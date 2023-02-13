/* @preserve
(c) 2020 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { tokenize } from 'esprima';
import { $view, view } from './view';
import type { lmvc_controller, lmvc_model_event, lmvc_scope, lmvc_view } from './type';

// warning: the following value should never be zero.
const leaf_pool_max_sz = 50;

@view()
export class lmvc_for implements lmvc_view {
  private get_items() {
    const model = this.controller!.$model;
    const item: unknown[] = this.func!.apply(undefined, this.prop.map(x => {
      const rt = model[x];
      return typeof rt === 'function' ? rt.bind(model) : rt;
    }));
    return item ? (this.op_is_in === true ? Object.keys(item || {}) : item || []) : [];
  }

  private async do_render() {
    if(this.updating) {
      this.updating = undefined;
      return;
    }
    const parent = this.place_holder.parentElement;
    if(parent && this.controller) {
      const items = this.get_items();
      const remove: lmvc_scope[] = [];
      const idx_nm = this.idx_nm;
      const item_nm = this.item_nm;
      const self = this;
      for(let i = 0, max = Math.max(items.length, this.leaf.length); i < max; ++i) {
        let leaf: lmvc_scope | undefined = this.leaf[i];
        if(i < items.length) {
          const idx = i;
          let model = {};
          Object.defineProperty(model, item_nm!, {
            get() {
              return self.get_items()[idx];
            }
          });
          if(idx_nm !== undefined) {
            Object.defineProperty(model, idx_nm, {
              get() {
                return idx;
              }
            });
          }
          Object.setPrototypeOf(model, this.controller.$model);
          const controller = new Proxy(this.controller, {
            get(target: any, property: string | symbol | number, receiver?: any) {
              console.debug({target})
              return property === '$model' ? model : Reflect.get(target, property, receiver);
            },
            set(target: any, property: string | symbol | number, value: unknown, receiver: any) {
              console.debug({target, value})
              return property === '$model' ? true : Reflect.set(target, property, value, receiver);
            },
          });
          if(!leaf) {
            const views = new Set<lmvc_view>();
            if(this.leaf_pool.length) {
              leaf = this.leaf_pool.pop();
            }
            else {
              leaf = await this.$scope!.app.load_scope(this.template!.cloneNode(true), controller, views);
              if(leaf) {
                if(views.size) {
                  await this.$scope!.app.load_descendants(leaf.node, leaf.controller, views);
                  await $view.init_views(Array.from(views));
                }
              }
              else {
                console.assert(false, 'unexpected');
              }
            }
            this.leaf[i] = leaf!;
          }
          else {
            // todo: reuse leaf.
            leaf.controller = controller;
          }
          parent.insertBefore(leaf!.node, this.place_holder);
        }
        else if(leaf) {
          remove.push(leaf);
        }
      }
      for(let x of remove) {
        this.leaf.splice(this.leaf.indexOf(x), 1);
        if(this.leaf_pool.length < leaf_pool_max_sz) {
          parent.removeChild(x.node);
          x.controller = this.controller!;
          this.leaf_pool.push(x);
        }
        else {
          await x.app.destroy_scope(x);
        }
      }
    }
  }

  $dispose() {
    if(this.place_holder.parentElement) {
      this.place_holder.parentElement.removeChild(this.place_holder);
    }
  }

  async $init(): Promise<void> {
    if(this.$value) {
      const value = tokenize(this.$value);
      if(value.length >= 3 &&
        value.slice(1).some(x => (x.type === 'Identifier' && x.value === 'of') || (x.type === 'Keyword' && x.value === 'in'))) {
        let op_idx: number | undefined;
        if(value[0].value === '(') {
          if(value[1].type === 'Identifier') {
            this.item_nm = value[1].value;
            if(value[2].value === ',') {
              if(value.length >= 7 && value[3].type === 'Identifier') {
                this.idx_nm = value[3].value;
                if(value[4].value === ')') {
                  op_idx = 5;
                }
              }
            }
            else if(value[2].value === ')') {
              op_idx = 3;
            }
          }
        }
        else if(value[0].type === 'Identifier') {
          this.item_nm = value[0].value;
          op_idx = 1;
        }
        if(this.item_nm && op_idx && (op_idx + 1) < value.length) {
          switch(value[op_idx].value) {
            case 'of':
              this.op_is_in = false;
              break;
            case 'in':
              this.op_is_in = true;
              break;
          }
          if(this.op_is_in !== undefined) {
            const statement = value.slice(op_idx + 1);
            this.prop = [];
            let is_member = false;
            for(let x of statement) {
              switch(x.type) {
                case 'Identifier':
                  if(is_member) {
                    is_member = false
                  }
                  else {
                    this.prop.push(x.value);
                  }
                  break;
                case 'Punctuator':
                  if(x.value === '.') {
                    console.assert(!is_member && this.prop.length !== 0);
                    is_member = true;
                  }
                  break;
              }
            }
            if(this.prop.length) {
              this.prop = Array.from(new Set(this.prop));
              this.func = Function(`"use strict";return(function(${this.prop}){"use strict";return(${statement.map(x => x.value).join('')});})`)();
              this.leaf_pool.push(this.$scope!);
              this.template = <Element>this.$scope!.template.cloneNode(true);
              this.template.removeAttribute('l:for');
              return;
            }
          }
          else {
            console.error('l:for missing "of" or "in" operator');
          }
        }
      }
    }
    console.error(`l:for invalid statement "${this.$value}")".`);
  }

  $model_changed(evt: lmvc_model_event[]): void {
    if((!evt.length || evt.some(x => this.prop.some(y => x.property == y || (typeof x.property === 'string' && x.property.startsWith(y))))) && this.func) {
      if(this.governor) {
        clearTimeout(this.governor);
      }
      this.governor = setTimeout(() => {
        this.governor = undefined;
        this.task = this.task.then(() => this.do_render().then(() => {
          for(let x of this.leaf) {
            if(typeof x.view[0].$model_changed === 'function') {
              x.view[0].$model_changed(evt);
            }
          }
        }, ex=>console.error(ex)), ex => console.error(ex));
      }, 10);
    }
  }

  $mount() {
    this.$model_changed([]);
  }

  $ready() {
    this.controller = this.$scope!.controller;
    const node = this.$scope!.node;
    console.assert(node.parentNode !== null, 'unexpected (for) view element has no parent');
    if(node.parentNode) {
      node.parentNode.replaceChild(this.place_holder!, this.$scope!.node);
    }
  }

  private controller?: lmvc_controller; // need a non-proxy instance of the controller.
  private func?: Function;
  private governor?: number;
  private idx_nm?: string;
  private item_nm?: string;
  private leaf: lmvc_scope[] = [];
  private leaf_pool: lmvc_scope[] = [];
  private op_is_in?: boolean;
  private place_holder = document.createComment('');
  private prop!: string[];
  private task = Promise.resolve();
  private template?: Element;
  private updating?: true;
  $scope?: lmvc_scope;
  $value?: string;
}
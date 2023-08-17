/* @preserve
(c) 2020 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { tokenize } from 'esprima';
import { $view, view } from './view';
import type { lmvc_controller_t, lmvc_model_event_t, lmvc_scope_t, lmvc_view_t } from './type';

@view()
export class lmvc_for implements lmvc_view_t {
  private get_items() {
    const model = this.$scope!.controller.$model;
    const item: unknown[] | object | undefined | null = this.func!.apply(undefined, this.prop.map(x => {
      const rt = model[x];
      return typeof rt === 'function' ? rt.bind(model) : rt;
    }));
    return <unknown[]>(item ? (this.op_is_in === true ? Object.keys(item || {}) : item || []) : []);
  }

  private async do_render(evt: lmvc_model_event_t[]) {
    const parent = this.place_holder.parentElement;
    if(parent) {
      this.list = this.get_items();
      if(this.list.length > this.leaf_ub) {
        for(; this.leaf_ub < this.list.length; ++this.leaf_ub) {
          let leaf: lmvc_scope_t | undefined = this.leaf[this.leaf_ub];
          if(leaf) {
            console.assert(leaf.node.parentElement === null);
            this.place_holder.parentElement!.insertBefore(leaf.node, this.place_holder);
          }
          else {
            const self = this;
            const idx = this.leaf_ub;
            let model = {};
            Object.defineProperty(model, this.item_nm!, {
              get() {
                return self.list[idx];
              }
            });
            if(this.idx_nm !== undefined) {
              Object.defineProperty(model, this.idx_nm, {
                get() {
                  return idx;
                }
              });
            }
            Object.setPrototypeOf(model, this.$scope!.controller.$model);
            const controller: lmvc_controller_t = {
              get $model() {
                return model;
              },
              set $model(_: any) { },
              $view: []
            };
            Object.setPrototypeOf(controller, this.$scope!.controller);
            const views = new Set<lmvc_view_t>();
            leaf = await this.$scope!.app.load_scope(this.template!.cloneNode(true), controller, views);
            if(leaf) {
              if(views.size) {
                await $view.init_views(Array.from(views));
              }
              this.place_holder.parentElement!.insertBefore(leaf.node, this.place_holder);
            }
            else {
              console.assert(false, 'unexpected');
            }
            this.leaf[this.leaf_ub] = leaf!;
          }
        }
      }
      else if(this.list.length < this.leaf_ub) {
        while(this.leaf_ub > this.list.length) {
          this.place_holder.parentElement!.removeChild(this.leaf[--this.leaf_ub].node);
        }
      }
      for(let leaf of this.leaf) {
        for(let view of leaf.controller.$view.filter(x => typeof x.$model_changed === 'function')) {
          try {
            view.$model_changed!(evt);
          }
          catch(ex) {
            console.error(ex);
          }
        }
      }
    }
  }

  $dispose() {
    for(let leaf of this.leaf) {
      this.$scope?.app.destroy_scope(leaf);
    }
    this.leaf = [];
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
              this.template = <Element>this.$scope!.template.cloneNode(true);
              this.template.removeAttribute('l:for');
            }
            for(let x of this.$scope!.view) {
              if(x !== this) {
                const i = this.$scope!.controller.$view.indexOf(x);
                console.assert(i !== -1);
                this.$scope!.controller.$view.splice(i, 1);
              }
            }
          }
          else {
            console.error(`l:for missing "of" or "in" operator ${this.$value}`);
          }
          return;
        }
      }
    }
    console.error(`l:for invalid statement "${this.$value}")".`);
  }

  $model_changed(evt: lmvc_model_event_t[]): void {
    if((!evt.length || evt.some(x => this.prop.some(y => x.property == y || (typeof x.property === 'string' && x.property.startsWith(y))))) && this.func) {
      if(this.governor) {
        clearTimeout(this.governor);
      }
      this.governor = setTimeout(() => {
        this.governor = undefined;
        this.task = this.task.then(() => this.do_render(evt), ex => console.error(ex));
      }, 10);
    }
  }

  $mount() {
    if(this.$scope!.node?.parentNode) {
      this.$model_changed([]);
    }
  }

  $ready() {
    const node = this.$scope!.node;
    if(node.parentNode) {
      node.parentNode.replaceChild(this.place_holder!, this.$scope!.node);
    }
  }

  private func?: Function;
  private governor?: number;
  private idx_nm?: string;
  private item_nm?: string;
  private leaf: lmvc_scope_t[] = [];
  private leaf_ub = 0;
  private list: unknown[] = [];
  private op_is_in?: boolean;
  private place_holder = document.createComment('');
  private prop!: string[];
  private task = Promise.resolve();
  private template?: Element;
  $scope?: lmvc_scope_t;
  $value?: string;
}
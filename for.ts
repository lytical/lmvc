/* @preserve
(c) 2020 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { tokenize } from 'esprima';
import { $model } from './model';
import { view } from './view';
import type { Unsubscribable } from 'rxjs';
import type { lmvc_model, lmvc_model_event, lmvc_scope, lmvc_view } from './type';

@view()
export class lmvc_for implements lmvc_view {
  /*
  private async create_leaf(item: unknown, idx: number): Promise<lmvc_controller> {
    const leaf_model = this.$create_model(item, idx);
    const node = this.template.cloneNode(true);
    return await this.$app.mount_controller(node, <lmvc_controller>{
      $create_model() { return leaf_model; },
      $dispose() {
        return <any>mvc_view.invoke_dispose(...this.$view);
      }
    }, this);
  }
  */

  private create_model(item: unknown, idx: number): lmvc_model {
    const self = this;
    const rt = new Proxy(this.$scope!.controller.$model, {
      get(target: any, property: string | symbol | number, receiver?: any) {
        if(property === self.idx_nm) {
          return idx;
        }
        return property === self.item_nm ? item : Reflect.get(target, property, receiver);
      }
    });
    return rt;
  }

  $dispose() {
    if(this.dispose) {
      this.dispose.unsubscribe();
      this.dispose = undefined;
    }
    if(this.$place_holder.parentElement) {
      this.$place_holder.parentElement.removeChild(this.$place_holder);
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
          const op = value[op_idx].value;
          if(op === 'in' || op === 'of') {
            this.is_in_loop = op === 'in';
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
              this.dispose = $model.get_subject(this.$scope!.controller.$model)!.subscribe({
                next: evt => this.render(evt)
              });
              return;
            }
          }
        }
      }
    }
    console.error(`l:for invalid statement "${this.$value}")".`);
  }

  private render(evt: lmvc_model_event[]) {
    if((!evt.length || evt.some(x => this.prop.some(y => x.property == y || (typeof x.property === 'string' && x.property.startsWith(y))))) && this.func) {
      if(this.governor) {
        clearTimeout(this.governor);
      }
      this.governor = setTimeout(() => {
        this.governor = undefined;
        this.do_render();
      }, 10);
    }
  }

  $mount() {
    this.render([]);
  }

  $ready() {
    const node = this.$scope!.node;
    console.assert(node.parentNode !== null, 'unexpected (for) view element has no parent');
    if(node.parentNode) {
      node.parentNode.replaceChild(this.$place_holder!, this.$scope!.node);
    }
    this.is_eq;
    this.is_in_loop;
    this.idx_nm;
    this.create_model;
  }

  private do_render() {
    const model = this.$scope!.controller.$model;
    const items = this.func!.apply(undefined, this.prop.map(x => {
      const rt = model[x];
      return typeof rt === 'function' ? rt.bind(model) : rt;
    }));
    console.debug('rendering', items);
    /*
    if(document.body.contains(this.$place_holder!)) {
      const update_leaf = (item: unknown, idx: number) => {
        return this.update_leaf(item, idx);
      }
      let idx = 0;
      if(this.is_in_loop) {
        for(const item in items) {
          await update_leaf(item, idx++);
        }
      }
      else {
        for(const item of items) {
          await update_leaf(item, idx++);
        }
      }
      let prune: lmvc_controller[] | undefined;
      if(this.$view.length > items.length) {
        prune = this.$view.splice(items.length);
        const removed: Node[] = [];
        for(const item of prune) {
          const node = item.$place_holder?.parentNode ? item.$place_holder : item.$scope.node;
          this.$place_holder?.parentNode?.removeChild(node);
          removed.push(node);
        }
      }
      if(prune) {
        await mvc_view.invoke_dispose(...prune);
        this.leaf_pool.push(...prune);
      }
    }
    */
  }

  /*
  private async set_leaf(item: unknown, idx: number): Promise<void> {
    if(this.$view[idx]?.$scope.model[this.item_nm!] !== item) {
      const rs = await this.create_leaf(item, idx);
      this.$view[idx] = rs;
      const next = this.$view[++idx];
      if(next) {
        next.$scope.node.parentNode?.insertBefore(rs.$scope.node, next.$scope.node);
      }
      else {
        this.$place_holder?.parentNode?.insertBefore(rs.$scope.node, this.$place_holder);
      }
    }
  }

  private async update_leaf(item: unknown, idx: number) {
    let leaf = this.$view[idx];
    if(leaf === undefined) {
      await this.set_leaf(item, idx);
    }
    else {
      let leaf_item = leaf.$scope.model[this.item_nm!];
      if(!this.is_eq(leaf_item, item)) {
        let found = this.$view.findIndex(x => this.is_eq(item, x.$scope.model[this.item_nm!]));
        if(found !== -1) {
          leaf = this.$view.splice(found, 1)[0];
          this.$view.splice(idx, 0, leaf);
          const new_child = leaf.$place_holder?.parentNode ? leaf.$place_holder : leaf.$scope.node;
          let next_leaf = this.$view[idx + 1];
          const next_child = next_leaf ? (next_leaf.$place_holder?.parentNode ? next_leaf.$place_holder : next_leaf.$scope.node) : this.$place_holder;
          if(next_child) {
            this.$place_holder?.parentElement!.insertBefore(new_child, next_child);
          }
        }
        else {
          this.$view.splice(idx, 0, <lmvc_controller><unknown>undefined);
          await this.set_leaf(item, idx);
        }
      }
    }
  }

  leaf_pool!: lmvc_controller[];
  $value?: string;
  $view!: lmvc_controller[];
  */

  private dispose?: Unsubscribable;
  private func?: Function;
  private governor?: number;
  private is_eq: (l: unknown, r: unknown) => boolean = (l: unknown, r: unknown) => l === r;
  private is_in_loop?: boolean;
  private idx_nm?: string;
  private item_nm?: string;
  private leaf_pool: lmvc_scope[] = [];
  private prop!: string[];
  private template?: Element;
  $place_holder = document.createComment('');
  $scope?: lmvc_scope;
  $value?: string;
}
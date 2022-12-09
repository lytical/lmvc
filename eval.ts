/* @preserve
  (c) 2020 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import type { Unsubscribable } from 'rxjs';
import { tokenize } from 'esprima';
import { $model } from './model';
import type { lmvc_model_event, lmvc_scope, lmvc_view } from './type';

export abstract class lmvc_eval implements lmvc_view {
  $dispose() {
    if(this.dispose) {
      this.dispose.unsubscribe();
      this.dispose = undefined;
    }
  }

  $init() {
    if(this.$value) {
      this.$arg = typeof this.$arg === 'string' ? decodeURI(this.$arg) : undefined;
      if(this.$arg && this.$arg.startsWith('?')) {
        this.$arg = this.$arg.slice(1);
      }
      this.prop = [];
      tokenize(this.$value).forEach(node => {
        if(node.type === 'Identifier') {
          this.prop.push(node.value);
        }
      });
      this.prop = Array.from(new Set(this.prop));
      this.func = Function(`"use strict";return(function(${this.prop}){"use strict";return(${this.$value});})`)();
      this.dispose = $model.get_subject(this.$scope!.controller.$model)!.subscribe({
        next: msg => this.invoke!(msg)
      });
    }
    else {
      console.warn(`(${Object.getPrototypeOf(this).constructor.name}) missing 'value' in statement.`);
    }
  }

  private invoke(msg: lmvc_model_event[] = []) {
    if(this.func) {
      const model = this.$scope!.controller.$model;
      this.update(this.func.apply(undefined, this.prop.map(x => {
        const rt = model[x];
        return typeof rt === 'function' ? rt.bind(model) : rt;
      })), msg, this.$arg);
    }
  }

  $mount() {
    if(this.func) {
      this.invoke();
    }
  }

  $ready() {
    if(this.func) {
      this.invoke();
    }
  }

  protected abstract update(value: any, msg: lmvc_model_event[], arg?: string): void;

  $arg?: string;
  $scope?: lmvc_scope;
  $value?: string;
  dispose?: Unsubscribable;
  func?: Function;
  prop!: string[];
}
/* @preserve
  (c) 2020 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { tokenize } from 'esprima';
import obj_util from '../common/obj-util';
import type { lmvc_model_event, lmvc_scope, lmvc_view } from './type';

export abstract class lmvc_eval implements lmvc_view {
  $init() {
    if(this.$value) {
      this.$arg = typeof this.$arg === 'string' ? decodeURI(this.$arg) : undefined;
      if(this.$arg && this.$arg.startsWith('?')) {
        this.$arg = this.$arg.slice(1);
      }
      this.prop = [];
      let is_member = false;
      tokenize(this.$value).forEach(node => {
        switch(node.type) {
          case 'Identifier':
            if(is_member) {
              is_member = false;
            }
            else {
              this.prop.push(node.value);
            }
            break;
          case 'Punctuator':
            if(node.value === '.' && this.prop.length) {
              is_member = true;
            }
            break;
        }
      });
      this.prop = Array.from(new Set(this.prop));
      this.func = Function(`"use strict";return(function(${this.prop}){"use strict";return(${this.$value});})`)();
    }
    else {
      console.warn(`(${Object.getPrototypeOf(this).constructor.name}) missing 'value' in statement.`);
    }
  }

  $model_changed(evt: lmvc_model_event[]): void {
    if(this.func) {
      try {
        const value = this.func.apply(undefined, this.prop.map(x => {
          const rt = obj_util.select(x, this.$scope!.controller.$model);
          return typeof rt === 'function' ? rt.bind(this.$scope!.controller.$model) : rt;
        }));
        this.update(value, evt, this.$arg);
      }
      catch(ex) {
        console.error(ex);
      }
    }
  }

  $mount() {
    if(this.func) {
      this.$model_changed([]);
    }
  }

  $ready() {
    if(this.func) {
      this.$model_changed([]);
    }
  }

  protected abstract update(value: any, msg: lmvc_model_event[], arg?: string): void;

  $arg?: string;
  $scope?: lmvc_scope;
  $value?: string;
  func?: Function;
  prop!: string[];
}
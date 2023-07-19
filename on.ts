/* @preserve
(c) 2020 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { view } from './view';
import { tokenize } from 'esprima';
import type { lmvc_scope_t, lmvc_view_t } from './type';

@view()
export class lmvc_on implements lmvc_view_t {
  async $init() {
    console.debug({instance: this.instance, arg: this.$arg, value: this.$value})
    let arg = typeof this.$arg === 'string' ? decodeURI(this.$arg) : undefined;
    if(arg) {
      if(this.$value) {
        this.evt_nm = decodeURI(arg.startsWith('?') ? arg.slice(1) : arg).split('&');
        const value = tokenize(this.$value);
        console.assert(
          value.length >= 3 &&
          value[0].type === 'Identifier' &&
          value.some(x => x.value === '(') &&
          value[value.length - 1].value === ')');
        let method = '';
        let member: any = this.$scope!.controller;
        let args_idx = 0;
        for(; value[args_idx].value !== '('; ++args_idx) {
          const token = value[args_idx];
          method += token.value;
          if(member && token.type === 'Identifier') {
            this.model = member;
            member = member[token.value];
          }
        }
        if(typeof member === 'function') {
          this.member = member;
          const args = value.slice(++args_idx, value.length - 1);
          this.prop = Array.from(new Set(args.filter(x => x.type === 'Identifier' && x.value !== '$event').map(x => x.value)));
          this.func = Function(this.prop.length ?
            `"use strict";return(function($event,$method,${this.prop}){"use strict";$method.apply(undefined,[${args.map(x => x.value).join('')}]);})` :
            `"use strict";return(function($event,$method){"use strict";$method.apply(undefined,[${args.map(x => x.value).join('')}]);})`
          )();
          this.evt_handler = lmvc_on.prototype.invoke.bind(this);
        }
        else {
          console.warn(`l:on method (${method}) is not defined in the model.`);
        }
      }
      else {
        console.warn('l:on missing method name. use l:on?event-name="method_name(...)"');
      }
    }
    else {
      console.warn('l:on missing event name. use l:on?event-name="..."');
    }
  }

  invoke(evt: Event) {
    if(this.member) {
      this.func!.apply(undefined, [evt, this.member.bind(this.model)].concat(...this.prop!.map(x => {
        const rt = this.model[x];
        return typeof rt === 'function' ? rt.bind(this.model) : rt;
      })));
    }
  }

  $mount() {
    if(this.func && this.evt_nm) {
      this.evt_nm.forEach(x => this.$scope!.node.addEventListener(x, this.evt_handler!));
    }
  }

  $unmount() {
    if(this.func && this.evt_nm) {
      this.evt_nm.forEach(x => this.$scope!.node.removeEventListener(x, this.evt_handler!));
    }
  }

  $arg?: string;
  $scope?: lmvc_scope_t;
  $value?: string;
  private evt_handler?: EventListener;
  private evt_nm?: string[];
  private func?: Function;
  private member?: Function;
  private model: any;
  private prop?: string[];
  private instance = ++id;
}

let id = 0;
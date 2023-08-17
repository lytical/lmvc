/* @preserve
(c) 2020 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { lmvc_eval } from './eval';
import { view } from './view';

@view()
export class lmvc_style extends lmvc_eval {
  protected update(value: any, _msg: unknown, arg?: string) {
    if(arg) {
      if(value !== undefined && this.$scope?.node instanceof HTMLElement) {
        for(let x of arg.split('&')) {
          (<any>this.$scope.node.style)[x] = value;
        }
      }
    }
    else {
      console.warn('l:style missing style name. use l:style?style-name="..."');
    }
  }
}
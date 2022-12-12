/* @preserve
(c) 2020 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { lmvc_eval } from './eval';
import { view } from './view';

@view()
export class lmvc_class extends lmvc_eval {
  protected update(value: any, _msg: unknown, arg?: string) {
    if(arg) {
      if(value) {
        (<Element | undefined>this.$scope?.node)?.classList.add(...arg.split('&'));
      }
      else {
        (<Element | undefined>this.$scope?.node)?.classList.remove(...arg.split('&'));
      }
    }
    else {
      console.warn('l:class missing class name. use l:class?class-name="..."');
    }
  }
}
/* @preserve
  (c) 2020 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { lmvc_eval } from './eval';
import { view } from './view';

@view()
export class lmvc_attr extends lmvc_eval {
  protected update(value: any, _msg: unknown, arg?: string) {
    if(arg) {
      arg.split('&').forEach(x => {
        switch(x) {
          case 'allowfullscreen':
          case 'allowpaymentrequest':
          case 'async':
          case 'autofocus':
          case 'autoplay':
          case 'checked':
          case 'controls':
          case 'default':
          case 'disabled':
          case 'formnovalidate':
          case 'hidden':
          case 'ismap':
          case 'itemscope':
          case 'loop':
          case 'multiple':
          case 'muted':
          case 'nomodule':
          case 'novalidate':
          case 'open':
          case 'playsinline':
          case 'readonly':
          case 'required':
          case 'reversed':
          case 'selected':
          case 'truespeed':
            if(value === 'false' || !value) {
              (<Element | undefined>this.$scope?.node)?.removeAttribute(x);
            }
            else {
              (<Element | undefined>this.$scope?.node)?.setAttribute(x, '');
            }
            break;
          default:
            if(value === undefined) {
              (<Element | undefined>this.$scope?.node)?.removeAttribute(x);
            }
            else {
              (<Element | undefined>this.$scope?.node)?.setAttribute(x, value?.toString());
            }
            break;
        }
      });
    }
    else {
      console.warn('l:attr missing attribute name. use l:attr?attribute_name="..."');
    }
  }
}
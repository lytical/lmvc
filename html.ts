/* @preserve
(c) 2020 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { lmvc_eval } from './eval';
import { view } from './view';

@view()
export class lmvc_html extends lmvc_eval {
  protected update(value: any) {
    const html = value?.toString();
    if(this.$scope?.node instanceof Element) {
      this.$scope.node.innerHTML = html;
    }
  }
}
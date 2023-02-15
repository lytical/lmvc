/* @preserve
  (c) 2020 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { view } from './view';
import { lmvc_eval } from './eval';

@view()
export class lmvc_text extends lmvc_eval {
  protected update(value: any) {
    console.debug({ [(<Element>this.$scope!.node).id]: value });
    (<Element>this.$scope!.node).textContent = value?.toString();
  }
}
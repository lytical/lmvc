/* @preserve
(c) 2020 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { lmvc_eval } from './eval';
import { view } from './view';

@view()
export class lmvc_if extends lmvc_eval {
  protected update(value: any) {
    if(value) {
      const parent = this.place_holder.parentNode;
      if(parent) {
        parent.insertBefore(this.$scope!.node, this.place_holder);
        parent.removeChild(this.place_holder!);
        // if(typeof this.$mount === 'function') {
        //   this.$mount();
        // }
      }
    }
    else {
      const parent = this.$scope!.node!.parentNode;
      if(parent) {
        parent.insertBefore(this.place_holder, this.$scope!.node);
        parent.removeChild(this.$scope!.node);
      }
    }
  }

  private place_holder = window.document.createComment('');
}
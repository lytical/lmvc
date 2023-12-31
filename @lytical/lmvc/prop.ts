/* @preserve
(c) 2020 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { lmvc_eval } from './eval';
import { view } from './view';
import { $controller } from './controller';
import obj_util from './obj-util';
import type { lmvc_model_t, lmvc_controller_t } from './type';

@view()
export class lmvc_prop extends lmvc_eval {
  $ready() {
    const ctlr = this.$scope!.view.filter(x => $controller.is_controller(x));
    if(ctlr.length) {
      this.target = (<lmvc_controller_t>ctlr[0]).$model;
    }
    else {
      console.warn(`(l:prop:${this.$arg}) failed to locate the controller in scope.\n${(<Element | undefined>this.$scope?.template)?.outerHTML}`);
    }
    return super.$ready();
  }

  protected update(value: any, _msg: unknown, arg?: string) {
    if(this.target) {
      if(arg) {
        for(let x of arg.split('&')) {
          obj_util.assing(value, x, this.target);
        }
      }
      else {
        console.warn('l:prop missing property name. use l:prop?property_name="..."');
      }
    }
  }

  target?: lmvc_model_t;
}
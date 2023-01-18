/* @preserve
  (c) 2020 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { controller } from '../../controller';
import { lmvc_test_controller } from './controller';

@controller({ html: 'lmvc/test/item/controller.html' })
export class lmvc_test_controller3 extends lmvc_test_controller {
  async $ready() {
    await super.$ready();
    this.$model.text = 'yeah baby!';
  }
}
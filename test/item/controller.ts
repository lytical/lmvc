/* @preserve
  (c) 2020 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { controller } from '../../controller';
import type { lmvc_controller_t, lmvc_model_t } from '../../type';

interface model extends lmvc_model_t {
  text?: string;
}

@controller({ html: 'lmvc/test/item/controller.html' })
export class lmvc_test_controller implements lmvc_controller_t<model> {
  async $create() {
    this.created = true;
  }

  async $dispose() {
    this.disposed = true;
  }

  async $get_title() {
    return 'test controller';
  }
  
  async $init() {
    this.inited = true;
  }

  async $mount() {
    this.mounted = true;
  }

  async $ready() {
    this.readyed = true;
    this.$model.text = 'foobar this stuff';
  }

  async $unmount() {
    this.unmounted = true;
  }

  $model!: model;
  $view = [];
  created?: true;
  disposed?: true;
  inited?: true;
  mounted?: true;
  readyed?: true;
  unmounted?: true;
}
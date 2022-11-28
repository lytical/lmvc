/* @preserve
  (c) 2020 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { controller } from '../controller';
import type { lmvc_controller, lmvc_model } from '../type';

interface model extends lmvc_model {
  text?: string;
}

@controller({ html: 'lmvc/test/controller.html' })
export class lmvc_test_controller implements lmvc_controller<model> {
  $model!: model;
  $view = [];
}
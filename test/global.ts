/* @preserve
  (c) 2022 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import lmvc_app from '../app';
import type { lmvc_controller_t } from 'lmvc/type';

after(() => {
});

before(async () => {
  expect(lmvc_app, 'failed to allocate app.').is.not.undefined;
  const root: root_controller = {
    $model: {},
    $view: []
  };
  let task: Promise<any>[] = <any>before_bootstrap.map(x => x(root)).filter(x => typeof x === 'object' && typeof x.then === 'function');
  if(task.length) {
    await Promise.all(task);
  }
  const rt = await lmvc_app.bootstrap(root);
  task = <any>after_bootstrap.map(x => x(root)).filter(x => typeof x === 'object' && typeof x.then === 'function');
  if(task.length) {
    await Promise.all(task);
  }
  after_bootstrap.splice(0);
  before_bootstrap.splice(0);
  return rt;
});

export class fixture {
  static after_bootstrap(cb: (ctlr: root_controller) => Promise<any> | void) {
    after_bootstrap.push(cb);
  }

  static before_bootstrap(cb: (ctlr: root_controller) => Promise<any> | void) {
    before_bootstrap.push(cb);
  }

  static timeout(delay?: number) {
    return new Promise<void>((res) => setTimeout(() => res(), delay));
  }
}

const after_bootstrap: ((ctlr: root_controller) => Promise<any> | void)[] = [];
const before_bootstrap: ((ctlr: root_controller) => Promise<any> | void)[] = [];

export interface root_controller extends lmvc_controller_t {
  on_load?: (e?: Event, v?: string | number) => void;
}
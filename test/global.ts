/* @preserve
  (c) 2022 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import lmvc_app from '../app';

after(() => {
});

before(async () => {
  expect(lmvc_app, 'failed to allocate app.').is.not.undefined;
  let task: Promise<any>[] = <any>before_bootstrap.map(x => x()).filter(x => typeof x === 'object' && typeof x.then === 'function');
  if(task.length) {
    await Promise.all(task);
  }
  return await lmvc_app.bootstrap();
});

export class fixture {
  static before_bootstrap(cb: () => Promise<any> | void) {
    before_bootstrap.push(cb);
  }

  static timeout(delay?: number) {
    return new Promise<void>((res) => setTimeout(() => res(), delay));
  }
}

const before_bootstrap: (() => Promise<any> | void)[] = [];
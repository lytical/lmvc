/* @preserve
  (c) 2022 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import 'mocha';
import { expect } from 'chai';
import { lmvc_app } from 'lmvc/app';
import type { lmvc_model } from 'lmvc/type';

after(() => {
  fixture.test_app = undefined;
});

before(() => {
  fixture.test_app = new lmvc_app<model>();
  expect(fixture.test_app, 'failed to allocate app.').is.not.undefined;
  return fixture.test_app.bootstrap();
});

interface model extends lmvc_model {
  style?: string;
  text?: string;
}

export class fixture {
  static timeout(delay?: number) {
    return new Promise<void>((res) => setTimeout(() => res(), delay));
  }

  static test_app?: lmvc_app<model>;
}
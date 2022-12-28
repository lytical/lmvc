/* @preserve
  (c) 2022 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import 'mocha';
import { expect } from 'chai';
import { lmvc_app } from 'lmvc/app';

after(() => {
  fixture.test_app = undefined;
});

before(() => {
  fixture.test_app = new lmvc_app();
  expect(fixture.test_app, 'failed to allocate app.').is.not.undefined;
});

export class fixture {
  static test_app?: lmvc_app;
}
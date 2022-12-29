/* @preserve
  (c) 2022 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import lmvc_app from '../app';

after(() => {
});

before(() => {
  expect(lmvc_app, 'failed to allocate app.').is.not.undefined;
  return lmvc_app.bootstrap();
});

export class fixture {
  static timeout(delay?: number) {
    return new Promise<void>((res) => setTimeout(() => res(), delay));
  }
}
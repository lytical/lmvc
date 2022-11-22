/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { lmvc_app } from 'lmvc/app';

before(() => {
});

describe('an app instance', () => {
  it('can bootstrap the application', async () => {
    var x = new lmvc_app();
    expect(x).is.not.undefined;
    x.bootstrap();
    expect(true).to.be.true;
    expect(window.document.querySelector('#lmvc-test-controller')).is.not.null;
  });
});
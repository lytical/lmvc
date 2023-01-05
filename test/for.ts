/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { fixture } from './global';
import test_app from '../app';

describe('l:for view', () => {
  it('can render elements via the $model', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    if(test_app) {
      let y = window.document.querySelector('#test-for');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        await fixture.timeout(1);
       // y.parentNode?.removeChild(y);
      }
    }
  });
});
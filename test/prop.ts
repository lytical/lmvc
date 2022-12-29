/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { fixture } from './global';
import test_app from '../app';

describe('l:prop view', () => {
  it('can change text values via the $model', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    if(test_app) {
      let y = window.document.querySelector('#test-prop');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        test_app.$model.text = 'prop-value';
        await fixture.timeout(10);
        expect(y.textContent).equals('prop-value');
        test_app.$model.text = 'prop-value11';
        await fixture.timeout(10);
        expect(y.textContent).equals('prop-value11');
        y.parentNode?.removeChild(y);
      }
    }
  });
});
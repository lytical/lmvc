/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import 'mocha';
import { expect } from 'chai';
import { fixture } from './global';

describe('l:text attribute', () => {
  it('can change text values via the $model', async () => {
    expect(fixture.test_app, 'failed to allocate app.').is.not.undefined;
    if(fixture.test_app) {
      let y = window.document.querySelector('#test-text');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        fixture.test_app.$model.text = 'foobar';
        await fixture.timeout(10);
        expect(y.textContent === 'foobar');
        fixture.test_app.$model.text = 'barfoo';
        await fixture.timeout(10);
        expect(y.textContent === 'barfoo');
        y.parentNode?.removeChild(y);
      }
    }
  });
});
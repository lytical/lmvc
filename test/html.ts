/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { fixture } from './global';
import test_app from '../app';

describe('l:html view', () => {
  it('can change html values via the $model', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    if(test_app) {
      let y = window.document.querySelector('#test-html');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        test_app.$model.text = '<b>html value</b>';
        await fixture.timeout(1);
        expect(y.innerHTML).equals('<b>html value</b>');
        y.parentNode?.removeChild(y);
      }
    }
  });
});
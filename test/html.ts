/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { fixture } from './global';
import test_app from '../app';
import { $model } from 'lmvc/model';

let model: any;

fixture.after_bootstrap(ctlr => {
  model = ctlr.$model;
});

describe('l:html view', () => {
  it('can change html values via the $model', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    expect(model, 'failed to bootstrap app.').is.not.undefined;
    if(test_app) {
      let y = window.document.querySelector('#test-html');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        model.text = '<b>html value</b>';
        await $model.after_dispatch;
        expect(y.innerHTML).equals('<b>html value</b>');
        y.parentNode?.removeChild(y);
      }
    }
  });
});
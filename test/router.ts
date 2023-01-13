/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { fixture } from './global';
import test_app from '../app';

let model: any;

fixture.after_bootstrap(ctlr => {
  model = ctlr.$model;
});

describe('l:router view', () => {
  it('can display controllers via "window.location" object', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    expect(model, 'failed to bootstrap app.').is.not.undefined;
    if(test_app) {
      let y = window.document.querySelector('#test-router');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        await fixture.timeout(1);
        //y.parentNode?.removeChild(y);
      }
    }
  });
});
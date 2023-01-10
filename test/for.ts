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

describe('l:for view', () => {
  it('can render elements via the $model', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    expect(model, 'failed to bootstrap app.').is.not.undefined;
    if(test_app) {
      let y = window.document.querySelector('#test-for');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        expect(y.childNodes.length, 'expected at least a comment element').greaterThanOrEqual(1);
        for(let x = 0; x < y.childNodes.length; ++x) {
          const i = y.childNodes.item(x);
          expect(i instanceof Comment || i instanceof Text, 'unexpected rendered element').is.true;
        }
        model.item = { values: ['foo', 'bar'] };
        await fixture.timeout(110);
        // y.parentNode?.removeChild(y);
      }
    }
  });
});
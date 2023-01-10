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

describe('l:class view', () => {
  it('can remove and insert class ids for an element via the $model', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    expect(model, 'failed to bootstrap app.').is.not.undefined;
    if(test_app) {
      let y = window.document.querySelector('#test-class');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        expect(y.classList).is.empty;
        model.text = 'foobar';
        await fixture.timeout(1);
        expect(y.classList).is.empty;
        model.text = 'mute';
        await fixture.timeout(1);
        expect(y.classList).length(1);
        expect(y.classList.contains('text-muted')).is.true;
        model.text = 'space';
        await fixture.timeout(1);
        expect(y.classList).length(2);
        expect(y.classList.contains('bt-4')).is.true;
        expect(y.classList.contains('pb-2')).is.true;
        model.text = 'foobar';
        await fixture.timeout(1);
        expect(y.classList).is.empty;
        y.parentNode?.removeChild(y);
      }
    }
  });
});
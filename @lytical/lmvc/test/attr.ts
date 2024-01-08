/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { fixture } from './global';
import { $model } from '../model';
import test_app from '../app';

let model: any;

fixture.after_bootstrap(ctlr => {
  model = ctlr.$model;
});

describe('l:attr view', () => {
  it('can remove and insert attributes for an element via the $model', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    expect(model, 'failed to bootstrap app.').is.not.undefined;
    if(test_app) {
      let y = window.document.querySelector('#test-attr');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        model.text = undefined;
        await $model.after_dispatch;
        let val = y.getAttribute('foobar');
        expect(val, 'unexpected "foobar" attribute').is.null;
        expect(y.hasAttribute('disabled'), 'unexpected "disabled" attribute').is.false;
        model.text = 'testing';
        await $model.after_dispatch;
        val = y.getAttribute('foobar');
        expect(val, 'attribute not added').equals('testing');
        expect(y.hasAttribute('disabled'), 'unexpected "disabled" attribute').is.false;
        model.text = 'this out';
        await $model.after_dispatch;
        val = y.getAttribute('foobar');
        expect(val, 'attribute not added').equals('this out');
        expect(y.hasAttribute('disabled'), 'unexpected "disabled" attribute').is.false;
        model.text = 'disable';
        await $model.after_dispatch;
        val = y.getAttribute('foobar');
        expect(val, 'attribute not added').equals('disable');
        expect(y.hasAttribute('disabled'), 'expected "disabled" attribute').is.true;
        //y.parentNode?.removeChild(y);
      }
    }
  });
});
/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { fixture } from './global';
import test_app from '../app';

describe('l:attr view', () => {
  it('can remove and insert attributes for an element via the $model', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    if(test_app) {
      let y = window.document.querySelector('#test-attr');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        test_app.$model.text = undefined;
        await fixture.timeout(1);
        let val = y.getAttribute('foobar');
        expect(val, 'unexpected "foobar" attribute').is.null;
        expect(y.hasAttribute('disabled'), 'unexpected "disabled" attribute').is.false;
        test_app.$model.text = 'testing';
        await fixture.timeout(1);
        val = y.getAttribute('foobar');
        expect(val, 'attribute not added').equals('testing');
        expect(y.hasAttribute('disabled'), 'unexpected "disabled" attribute').is.false;
        test_app.$model.text = 'this out';
        await fixture.timeout(1);
        val = y.getAttribute('foobar');
        expect(val, 'attribute not added').equals('this out');
        expect(y.hasAttribute('disabled'), 'unexpected "disabled" attribute').is.false;
        test_app.$model.text = 'disable';
        await fixture.timeout(1);
        val = y.getAttribute('foobar');
        expect(val, 'attribute not added').equals('disable');
        expect(y.hasAttribute('disabled'), 'expected "disabled" attribute').is.true;
        y.parentNode?.removeChild(y);
      }
    }
  });
});
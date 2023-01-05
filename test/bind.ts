/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { fixture } from './global';
import test_app from '../app';

describe('l:bind view', () => {
  it('can change element values and update element via the $model', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    if(test_app) {
      let y = window.document.querySelector('#test-bind');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        let i = <HTMLInputElement | null>y.firstElementChild;
        expect(i, 'the test element is not in the dom.').is.not.null;
        if(i) {
          test_app.$model.text = 'bind1';
          await fixture.timeout(1);
          expect(i.value).equals('bind1');
          i.value = 'bind2';
          i.dispatchEvent(new Event('input')); // setting value property doesn't fire event.
          await fixture.timeout(1);
          expect(test_app.$model.text).equals('bind2');
        }
        i = <HTMLInputElement | null>y.lastElementChild;
        expect(i, 'the test element is not in the dom.').is.not.null;
        if(i) {
          test_app.$model.item = { text: 'bind3' };
          await fixture.timeout(1);
          expect(i.value).equals('bind3');
          i.value = 'bind4';
          i.dispatchEvent(new Event('input')); // setting value property doesn't fire event.
          await fixture.timeout(1);
          expect(test_app.$model.item.text).equals('bind4');
        }
        y.parentNode?.removeChild(y);
      }
    }
  });
});
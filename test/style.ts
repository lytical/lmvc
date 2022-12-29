/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { fixture } from './global';
import test_app from '../app';

describe('l:style view', () => {
  it('can change the "text-decoration" style value via the $model', async () => {
    expect(test_app, 'failed to allocate app').is.not.undefined;
    if(test_app) {
      let y: HTMLElement | null = window.document.querySelector('#test-style');
      expect(y, 'the test element is not in the dom').is.not.null;
      if(y) {
        expect(y.style.length, 'style should be empty').equals(0);
        test_app.$model.style = 'line-through';
        await fixture.timeout(1);
        expect(y.style.textDecoration, 'style should be "line-through"').equals('line-through');
        test_app.$model.style = 'line-through underline';
        await fixture.timeout(1);
        expect(y.style.textDecoration, 'style should be "line-through" and "underline"').contains('underline').contains('line-through');
        y.parentNode?.removeChild(y);
      }
    }
  });
});
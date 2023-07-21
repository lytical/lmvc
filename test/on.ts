/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { fixture } from './global';
import test_app from '../app';

let evt: Event | undefined;
let val: number | string | undefined;

fixture.before_bootstrap(ctlr => {
  ctlr.on_load = (e?: Event, v?: string | number) => {
    evt = e;
    val = v;
  }
});

describe('l:on view', () => {
  it('can invoke method on "load" event', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    if(test_app) {
      let y = window.document.querySelector('#test-on');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        expect(evt).is.undefined;
        expect(val).is.undefined;
        y.dispatchEvent(new Event('test-it'));
        expect(evt, 'event handler not invoked.').is.not.undefined;
        expect(val, 'event handler not invoked.').equals(123);
        //y.parentNode?.removeChild(y);
      }
    }
  });
});
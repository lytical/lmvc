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
      let y = <HTMLDivElement>window.document.querySelector('#test-router');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        let cnt = 0;
        let cont = true;
        while(cont) {
          try {
            console.debug({ loc: JSON.stringify(window.location), txt: y.innerText });
            switch(window.location.hash) {
              case '#/':
                await fixture.timeout(200);
                window.location.href = './#/lmvc/test/item/controller';
                window.dispatchEvent(new Event('popstate'));
                break;
              case '':
                expect(y.innerText === '' || y.innerText === 'loading, please wait...', 'controller should not be loaded').is.true;
                break;
              case '#/lmvc/test/item/controller':
                expect(y.innerText === '' || y.innerText === 'loading, please wait...' || y.innerText === 'foobar this stuff', 'controller should be loading or loaded').is.true;
                if(y.innerText === 'foobar this stuff') {
                  window.location.href = './#/lmvc/test/item/controller2';
                }
                break;
              case '#/lmvc/test/item/controller2':
                expect(y.innerText === '' || y.innerText === 'loading, please wait...' || y.innerText === 'and another one', 'controller2 should be loading or loaded').is.true;
                if(y.innerText === 'and another one') {
                  cont = false;
                  cnt = 0;
                }
                break;
            }
            await fixture.timeout(10);
            expect(++cnt, 'retries expired testing routing').lessThan(10);
          }
          catch(ex) {
            window.location.href = './#/';
            throw ex;
          }
        }
        //y.parentNode?.removeChild(y);
      }
    }
  });
});
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
      expect(test_app.router, 'router not loaded').exist;
      let y = <HTMLDivElement>window.document.querySelector('#test-router');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        let cnt = 0;
        let cont = true;
        while(cont) {
          switch(window.location.hash) {
            case '#/':
              window.location.replace('./');
              continue;
            case '':
              expect(y.innerText === '' || y.innerText === 'loading, please wait...', 'controller should not be loaded').is.true;
              break;
            case '#/lmvc/test/item/controller':
              expect(y.innerText, 'controller should be loaded').equals('foobar this stuff');
              expect(await test_app.router!.replace('/lmvc/test/item/controller2'), 'controller2 failed to load').is.true;
              cnt = 0;
              continue;
            case '#/lmvc/test/item/controller2':
              expect(y.innerText, 'controller2 should be loaded').equals('and another one');
              expect(await test_app.router!.push('/lmvc/test/item/controller3'), 'controller3 failed to load').is.true;
              cnt = 0;
              continue;
            case '#/lmvc/test/item/controller3':
              expect(y.innerText, 'controller3 should be loaded').equals('yeah baby!');
              cont = false;
              cnt = 0;
              expect(await test_app.router!.replace('/lmvc/test/item/controller'), 'failed to reset url').is.true;
              break;
          }
          await fixture.timeout(10);
          expect(++cnt, 'retries expired testing routing').lessThan(10);
        }
        test_app.destroy_node(y);
      }
    }
  });
});
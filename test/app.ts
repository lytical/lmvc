/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import test_app from '../app';
import type { lmvc_scope } from '../type';

let z: lmvc_scope[] | undefined;

describe('an app instance', () => {
  it('can bootstrap the application', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    let y = window.document.querySelector('#test-app');
    expect(y, 'the test controller did not replace the dom element.').is.not.null;
    expect(y?.textContent, 'l:text view did not render $model.text value').equals('foobar this stuff');
  });

  it('can locate and destroy scopes', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    if(test_app) {
      let y = window.document.querySelector('#test-app');
      expect(y, 'the test controller did not replace the dom element.').is.not.null;
      if(y) {
        z = test_app.find_scope(y);
        expect(z, 'scope not found from the dom element.').is.not.null.and.is.not.empty;
        for(let s of z) {
          await test_app.destroy_scope(s);
        }
        y = window.document.querySelector('#test-app');
        expect(y, 'dom element not removed after scope destroyed.').is.null;
      }
    }
  });

  it('can hook into life cycle methods', async () => {
    expect(z, 'failed to locate scope.').is.not.undefined.and.is.not.empty;
    if(z) {
      let c = <{
        created: boolean,
        disposed: boolean,
        inited: boolean,
        mounted: boolean,
        readyed: boolean,
        unmounted: boolean
      }>z[0].view[0];
      expect(c, 'controller is missing.').not.empty;
      expect(c.created, 'view method $created() not invoked.').is.true;
      expect(c.disposed, 'view method $dispose() not invoked.').is.true;
      expect(c.inited, 'view method $init() not invoked.').is.true;
      expect(c.mounted, 'view method $mount() not invoked.').is.true;
      expect(c.readyed, 'view method $ready() not invoked.').is.true;
      expect(c.unmounted, 'view method $unmount() not invoked.').is.true;
      z = undefined;
    }
  });
});
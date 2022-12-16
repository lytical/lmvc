/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { lmvc_app } from 'lmvc/app';

declare global {
  interface Window {
    test_app?: lmvc_app;
  }
}

after(() => {
  window.test_app = undefined;
});

before(() => {
  if(!window.test_app) {
    window.test_app = new lmvc_app();
    expect(window.test_app, 'failed to allocate app.').is.not.undefined;
  }
});

describe('abc fafkasdjf lkasd jflkjasdlkfj', () => {
  it('does a', async () => {
    expect(true, 'huh').is.true;
  });
});

describe('xyz', () => {
  it('does a', async () => {
    expect(true, 'huh').is.true;
  });
});

// describe('an app instance', () => {
//   it('can bootstrap the application', async () => {
//     let x = window.test_app!;
//     expect(x, 'failed to allocate app.').is.not.undefined;
//     await x.bootstrap();
//     let y = window.document.querySelector('#lmvc-test-controller');
//     expect(y, 'the test controller did not replace the dom element.').is.not.null;
//     expect(y?.textContent, 'l:text view did not render $model.text value').equals('foobar this stuff');
//     let z = x.find_scope(y!);
//     expect(z, 'scope not found from the dom element.').is.not.null.and.is.not.empty;
//     for(let s of z) {
//       await x.destroy_scope(s);
//     }
//     y = window.document.querySelector('#lmvc-test-controller');
//     expect(y, 'dom element not removed after scope destroyed.').is.null;
//     let c = <{
//       created: boolean,
//       disposed: boolean,
//       inited: boolean,
//       mounted: boolean,
//       readyed: boolean,
//       unmounted: boolean
//     }>z[0].view[0];
//     expect(c, 'controller is missing.').not.empty;
//     expect(c.created, 'view method $created() not invoked.').is.true;
//     expect(c.disposed, 'view method $dispose() not invoked.').is.true;
//     expect(c.inited, 'view method $init() not invoked.').is.true;
//     expect(c.mounted, 'view method $mount() not invoked.').is.true;
//     expect(c.readyed, 'view method $ready() not invoked.').is.true;
//     expect(c.unmounted, 'view method $unmount() not invoked.').is.true;
//   });
// });
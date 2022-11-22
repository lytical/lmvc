/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

require.config({
  baseUrl: "/",
  deps: [
    'chai'
  ],
  map: {
    '*': {
      l: 'lmvc'
    }
  },
  paths: {
    chai: '/node_modules/chai/chai',
    esprima: '/node_modules/esprima/dist/esprima',
    mocha: '/node_modules/mocha/mocha',
    rxjs: '/node_modules/rxjs/dist/bundles/rxjs.umd.min',
    text: '/node_modules/requirejs-text/text'
  },
  shim: {
    chai: {
      deps: ['mocha']
    },
    mocha: {}
  }
});

require(['mocha'], (mocha: any) => {
  mocha.setup('bdd');
  mocha.checkLeaks();
  require([
    'lmvc/test/bootstrap'
  ], () => mocha.run());
});
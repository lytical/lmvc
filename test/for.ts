/* @preserve
(c) 2022 lytical, inc. all rights are reserved.
lytical(r) is a registered trademark of lytical, inc.
please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { fixture } from './global';
import test_app from '../app';
import { $model } from 'lmvc/model';

let model: any;

fixture.after_bootstrap(ctlr => {
  model = ctlr.$model;
});

describe('l:for view', () => {
  it('can render array elements via the $model', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    expect(model, 'failed to bootstrap app.').is.not.undefined;
    if(test_app) {
      let y = window.document.querySelector('#test-for-of');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        expect(y.childNodes.length, 'expected at least a comment element').greaterThanOrEqual(1);
        for(let x = 0; x < y.childNodes.length; ++x) {
          const i = y.childNodes.item(x);
          expect(i instanceof Comment || i instanceof Text, 'unexpected initial rendered element').is.true;
        }
        const assert_all = async (z: Element) => {
          await $model.after_dispatch;
          await fixture.timeout(10);
          expect(z.childNodes.length, 'expected at least a comment element').greaterThanOrEqual(model.item.values.length);
          let cnt = 0;
          for(let x = 0; x < z.childNodes.length; ++x) {
            const i = z.childNodes.item(x);
            expect(i instanceof Comment || i instanceof Text || i instanceof HTMLDivElement, 'unexpected rendered element').is.true;
            if(i instanceof HTMLDivElement) {
              try {
                expect(i.innerText, 'text not rendered').contains(model.forloop);
                expect(i.innerText.endsWith(cnt.toString()), 'leaf did not render ending').is.true;
                expect(i.innerText.startsWith(model.item.values[cnt]), 'leaf did not render begining').is.true;
                ++cnt;
              } catch(ex) {
                console.error(ex);
                throw ex;
              }
            }
          }
          expect(cnt).equals(model.item.values.length, 'failed to render all leaves');
        }
        model.item = { values: ['foo', 'bar'] };
        model.forloop = 'for-loop-of';
        await assert_all(y);
        model.item.values.push('stuff');
        model.forloop = 'barrydaboom';
        await assert_all(y);
        model.item.values[1] = 'china';
        model.forloop = 'timing';
        await assert_all(y);
        model.item.values.push(model.item.values.shift());
        model.forloop = 'clocks';
        await assert_all(y);
        model.item.values.splice(1, 1);
        await assert_all(y);
        model.item.values.splice(0);
        await assert_all(y);
        test_app.destroy_node(y);
      }
    }
  });
  it('can render object fields via the $model', async () => {
    expect(test_app, 'failed to allocate app.').is.not.undefined;
    expect(model, 'failed to bootstrap app.').is.not.undefined;
    if(test_app) {
      let y = window.document.querySelector('#test-for-in');
      expect(y, 'the test element is not in the dom.').is.not.null;
      if(y) {
        expect(y.childNodes.length, 'expected at least a comment element').greaterThanOrEqual(1);
        for(let x = 0; x < y.childNodes.length; ++x) {
          const i = y.childNodes.item(x);
          expect(i instanceof Comment || i instanceof Text, 'unexpected initial rendered element').is.true;
        }
        const assert_all = async (z: Element) => {
          await $model.after_dispatch;
          await fixture.timeout(10);
          const key = Object.keys(model.item.values);
          expect(z.childNodes.length, 'expected at least a comment element').greaterThanOrEqual(key.length);
          let cnt = 0;
          for(let x = 0; x < z.childNodes.length; ++x) {
            const i = z.childNodes.item(x);
            expect(i instanceof Comment || i instanceof Text || i instanceof HTMLDivElement, 'unexpected rendered element').is.true;
            if(i instanceof HTMLDivElement) {
              expect(i.innerText, 'text not rendered').contains(model.forloop);
              expect(i.innerText.endsWith(cnt.toString()), 'leaf index not rendered').is.true;
              expect(i.innerText.startsWith(key[cnt]), 'leaf key not rendered').is.true;
              ++cnt;
            }
          }
          expect(cnt).equals(key.length, 'failed to render all leaves');
        }
        model.item = { values: { oof: 123, rab: 321 } };
        model.forloop = 'for-loop-in';
        await assert_all(y);
        model.item.values.stuff = 1;
        model.forloop = 'barrydaboom';
        await assert_all(y);
        delete model.item.values.oof;
        model.forloop = 'clocks';
        await assert_all(y);
        model.item.values = {};
        await assert_all(y);
        test_app.destroy_node(y);
      }
    }
  });
});
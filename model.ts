/* @preserve
  (c) 2019 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { future } from '../common/future';
import { parseScript } from 'esprima';
import { Subject } from 'rxjs';
import type { lmvc_model_event, lmvc_model_subject } from './type';

const governor = new Map<Subject<lmvc_model_event[]>, lmvc_model_event[]>();

const is_proxy_metadata: unique symbol = Symbol('l-mvc-is-proxy-metadata');

/**
 * accessor to view related methods.
 */
const $mvc_model_subject: unique symbol = Symbol('l-mvc-model-subject');

/**
 * utility static class providing model related methods.
 */
export class $model {
  private static create_model<_t_>(data: _t_, subject: Subject<lmvc_model_event[] & { timeout?: number; }>, prefix: string = ''): _t_ {
    const map: Record<string, string[] | Set<string>> = {};
    for(let obj = data; obj; obj = Object.getPrototypeOf(obj)) {
      for(let nm of Object.getOwnPropertyNames(obj)) {
        if(nm !== '__proto__') {
          const getter = Object.getOwnPropertyDescriptor(obj, nm)!.get;
          if(getter) {
            let statement = getter.toString();
            statement = statement.slice(statement.indexOf('{') + 1);
            parseScript(statement.slice(0, statement.lastIndexOf('}')), { tolerant: true }, node => {
              if(node.type === 'MemberExpression' && node.object.type === 'ThisExpression') {
                const prop = (<any>node.property).name;
                if(map[prop]) {
                  (<Set<string>>map[prop]).add(nm);
                }
                else {
                  map[prop] = new Set([nm]);
                }
              }
            });
          }
        }
      }
    }
    for(let x in map) {
      map[x] = Array.from(map[x]);
    }
    const view = <lmvc_model_subject & { subject: Subject<lmvc_model_event[]> }>{
      get_underlying() {
        return data;
      },
      next(...msg: lmvc_model_event[]) {
        let queue: lmvc_model_event[] & { timeout?: number; };
        if(governor.has(subject)) {
          queue = governor.get(subject)!;
          queue.push(...msg);
          clearTimeout(queue.timeout);
        }
        else {
          queue = msg;
          governor.set(subject, queue);
        }
        queue.timeout = setTimeout(() => {
          const msg = governor.get(subject)!;
          governor.delete(subject);
          try {
            subject.next(msg);
          }
          finally {
            if(governor.size === 0) {
              $model.evt.resolve();
            }
          }
        });
        return queue;
      },
      subject,
      subscribe() {
        return subject.subscribe(arguments[0]);
      }
    };
    let proxy: ProxyConstructor;
    const notify = (target: any, property: string | symbol | number, prev: unknown, value: unknown) => {
      const evt: lmvc_model_event = {
        property: typeof property !== 'symbol' ? `${prefix}${property}` : property,
        model: proxy,
        prev,
        value
      };
      const queue = view.next(evt);
      if(typeof property === 'string' && map[property]) {
        queue.push(...(<string[]>map[property]).map(x => <lmvc_model_event>{
          property: x,
          model: proxy,
          prev: undefined,
          value: target[x]
        }));
      }
    }

    proxy = new Proxy(<any>data, {
      deleteProperty(target: any, property: string | symbol | number) {
        if(property === is_proxy_metadata || property === $mvc_model_subject) {
          return false;
        }
        const prev = Reflect.get(target, property);
        const rt = Reflect.deleteProperty(target, property);
        if(rt) {
          notify(target, property, prev, undefined);
        }
        return rt;
      },

      get(target: any, property: string | symbol | number, receiver?: any): any {
        if(property === is_proxy_metadata) {
          return true;
        }
        if(property === $mvc_model_subject) {
          return view;
        }
        let rt = Reflect.get(target, property, receiver);
        if(rt && typeof rt === 'object' && rt[is_proxy_metadata] === undefined && typeof property !== 'symbol') {
          rt = $model.create_model(rt, subject, `${prefix}${property}.`);
          Reflect.set(target, property, rt, receiver);
        }
        return rt;
      },

      set(target: any, property: string | symbol | number, value: any, receiver?: any): boolean {
        const prev = Reflect.get(target, property, receiver);
        if(prev === value || property === is_proxy_metadata || property === $mvc_model_subject) {
          return true;
        }
        let rt = Reflect.set(target, property, value, receiver);
        if(rt) {
          notify(target, property, prev, value);
        }
        return rt;
      }
    });
    return <$model & _t_><unknown>proxy;
  }

  static get_subject(model?: object) {
    return model ? <lmvc_model_subject>(<any>model)[$mvc_model_subject] : undefined;
  }

  static get_underlying<_t_ = unknown>(model?: object) {
    const rt = $model.get_subject(model);
    return <_t_>(rt?.get_underlying() || model);
  }

  static is_model(value: any) {
    return value && typeof value === 'object' && value[is_proxy_metadata] === true;
  }

  static make_model<_t_ = any>(value: _t_ = <any>{}): _t_ {
    return $model.is_model(value) ? value : $model.create_model<_t_>(value, new Subject<lmvc_model_event[]>());
  }

  static get after_dispatch() {
    return governor.size ? $model.evt.promise : Promise.resolve();
  }

  private static evt = new future<void>();
}
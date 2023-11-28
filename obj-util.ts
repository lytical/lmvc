/* @preserve
  (c) 2019 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import type { plain_object_t } from './plain-object';

export class obj_util {
  are_equal(left: any, right: any): boolean {
    if(left == right) {
      return true;
    }
    if(left instanceof Date && right instanceof Date) {
      return left.valueOf() == right.valueOf();
    }
    return typeof left === 'object' && left && typeof right === 'object' && right ?
      Array.from(new Set(Object.keys(left).concat(Object.keys(right)))).every(x => this.are_equal(left[x], right[x])) :
      left == right;
  }

  are_same_type(lt: any, rt: any): boolean {
    return typeof lt === typeof rt && (lt === undefined || (lt === null && rt === null) || (isNaN(lt) && isNaN(rt)) || Object.getPrototypeOf(lt) === Object.getPrototypeOf(rt));
  }

  detect_changes(model: any, prestine: any, get_value: (value: any, key: string, is_set: boolean) => any, key_prfx: string = ''): update_t<any> {
    const rt: update_t<any> = {};
    for(let key of Object.keys(prestine)) {
      if(model[key] === undefined) {
        const new_key = `${key_prfx}${key}`;
        const val = get_value(prestine[key], new_key, false);
        if(val !== undefined) {
          if(!rt.$unset) {
            rt.$unset = { [new_key]: val };
          }
          else {
            rt.$unset[new_key] = val;
          }
        }
      }
    }
    for(let key of Object.keys(model)) {
      const cur = model[key];
      const org = prestine[key];
      if(cur !== undefined) {
        if(!this.are_same_type(cur, org)) {
          const new_key = `${key_prfx}${key}`;
          const val = get_value(cur, new_key, true);
          if(val !== undefined) {
            if(!rt.$set) {
              rt.$set = { [new_key]: val };
            }
            else {
              rt.$set[new_key] = val;
            }
          }
        }
        else {
          if(Array.isArray(cur)) {
            const new_key = `${key_prfx}${key}`;
            for(let idx in org) {
              const item = org[idx];
              if(cur.findIndex(x => this.are_equal(item, x)) === -1) {
                const val = get_value(item, `${new_key}.${idx}`, false);
                if(val !== undefined) {
                  if(!rt.$pull) {
                    rt.$pull = { [new_key]: val };
                  }
                  else if(!rt.$pull[new_key]) {
                    rt.$pull[new_key] = val;
                  }
                  else if((<any>rt.$pull[new_key]).$in) {
                    (<any>rt.$pull[new_key]).$in.push(val);
                  }
                  else {
                    (<any>rt.$pull[new_key]) = { $in: [rt.$pull[new_key], val] };
                  }
                }
              }
            }
            for(let idx in cur) {
              const item = cur[idx];
              if(org.findIndex((x: any) => this.are_equal(item, x)) === -1) {
                const val = get_value(item, `${new_key}.${idx}`, true);
                if(val !== undefined) {
                  if(!rt.$push) {
                    rt.$push = { [new_key]: val };
                  }
                  else if(!rt.$push[new_key]) {
                    rt.$push[new_key] = val;
                  }
                  else if((<any>rt.$push[new_key]).$each) {
                    (<any>rt.$push[new_key]).$each.push(val);
                  }
                  else {
                    (<any>rt.$push[new_key]) = { $each: [rt.$push[new_key], val] };
                  }
                }
              }
            }
          }
          else {
            if(org != cur) {
              if(typeof org === 'object') {
                Object.assign(rt, this.detect_changes(cur, org, get_value, `${key_prfx}${key}.`));
              }
              else {
                const new_key = `${key_prfx}${key}`;
                const val = get_value(cur, new_key, true);
                if(val !== undefined) {
                  if(!rt.$set) {
                    rt.$set = { [new_key]: val };
                  }
                  else {
                    rt.$set[new_key] = val;
                  }
                }
              }
            }
          }
        }
      }
    }
    return rt;
  }

  assing(value: any, selector: string | string[], target: plain_object_t) {
    const key = typeof selector === 'string' ? selector.split('.') : selector;
    if(key.length) {
      target = key.slice(0, key.length - 1).reduce((rt, x) => {
        let y = rt[x];
        if(y === undefined) {
          y = typeof x === 'number' ? [] : {};
          rt[x] = y;
        }
        else if(typeof y !== 'object') {
          throw new Error(`failed to assing value to non-object property (${x}) of type (${typeof y}) using selector (${selector})`);
        }
        return y;
      }, <any>target);
      if(target[key[key.length - 1]] !== value) {
        target[key[key.length - 1]] = value;
        return true;
      }
    }
    return false;
  }

  duplicate<_t_ = any>(obj: _t_): _t_ {
    if(obj === null || obj === undefined || typeof obj !== 'object') {
      return <_t_>obj;
    }
    if(obj instanceof Date) {
      return <_t_><any>new Date(obj.valueOf());
    }
    const rt: any = Array.isArray(obj) ? [] : (() => {
      const rt = {};
      Object.setPrototypeOf(rt, Object.getPrototypeOf(obj));
      return rt;
    })();
    for(let key of Object.keys(obj).filter(x => x !== '__ob__')) {
      rt[key] = typeof (<any>obj)[key] === 'object' ? this.duplicate((<any>obj)[key]) : (<any>obj)[key];
    }
    return <_t_>rt;
  }

  is_class(value: any) {
    return typeof value === 'function' && /^\s*class(\s|{)/.test(Function.prototype.toString.call(value));
  }

  merge<_t_ = object>(target: _t_, ...source: object[]): _t_ {
    if(target !== null && source !== null) {
      for(let src of <any[]>source) {
        for(let nm in src) {
          const src_val = src[nm];
          const trg_val = (<any>target)[nm];
          if(typeof src_val === 'object' && typeof trg_val === 'object') {
            this.merge(trg_val, src_val);
          }
          else {
            (<any>target)[nm] = src_val;
          }
        }
      }
    }
    return target;
  }

  mutate(doc: any, cb: (obj: any, prop: string, value: any) => void): any {
    if(typeof doc === 'object' && doc !== null) {
      const set = new Set<any>();
      const stack: any[] = [doc];
      do {
        const next = stack.pop();
        if(!set.has(next)) {
          set.add(next);
          for(const nm of Object.keys(next)) {
            const value = next[nm];
            if(typeof value === 'object' && value !== null) {
              stack.push(value);
            }
            cb(next, nm, value);
          }
        }
      }
      while(stack.length);
    }
    return doc;
  }

  select<_t_ = unknown>(selector: string | string[], obj: plain_object_t): _t_ | undefined {
    return (typeof selector === 'string' ? selector.split('.') : selector).reduce((rt, x) => rt !== undefined && x !== undefined && x !== null ? rt[x] : undefined, <any>obj);
  }
}

interface update_t<_t_> {
  _id?: string | number | null;
  $pull?: Record<keyof _t_, unknown | undefined>;
  $push?: Record<keyof _t_, unknown | undefined>;
  $set?: Record<keyof _t_, unknown>;
  $unset?: Record<keyof _t_, unknown>;
}

export default new obj_util();
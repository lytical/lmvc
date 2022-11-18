/* @preserve
  (c) 2019 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import type { __cstor } from 'common/plain-object';

const mvc_view_metadata: unique symbol = Symbol('l-mvc-view-metadata');

export class $view {
  static get_view_metadata(value: any) {
    switch(typeof value) {
      case 'object':
        return Object.getPrototypeOf(value)[mvc_view_metadata];
      case 'function':
        return value[mvc_view_metadata];
    }
    return undefined;
  }

  static is_view(value: any) {
    return $view.get_view_metadata(value) !== undefined;
  }

  static async load_view(id: string): Promise<__cstor> {
    let mod = await import(id.replace(/:/g, '/'));
    for(const key of Object.getOwnPropertyNames(mod)) {
      if(key !== '__esModule') {
        let cstor: __cstor = mod[key];
        if(typeof cstor === 'function' && cstor.prototype[mvc_view_metadata]) {
          return cstor;
        }
      }
    }
    throw new Error(`not-found: ${id}`);
  }
}

export interface lmvc_view_metadata_arg {
}

export function view(args: lmvc_view_metadata_arg = {}) {
  return (cstr: Function) => {
    cstr.prototype[mvc_view_metadata] = args;
  };
}
/* @preserve
  (c) 2019 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import type { lmvc_controller } from './controller';
import type { lmvc_view } from './view';

export interface lmvc_scope {
  app: lmvc_app;
  args?: string | string[];
  controller: lmvc_controller;
  descendant: lmvc_scope[];
  node: Node;
  view: lmvc_view[];
}

export type lmvc_hook = (scope: lmvc_scope) => void | Promise<any>;

export class lmvc_app {
  constructor() {
    console.assert(document.body.parentNode !== null);
    if(document.body.parentNode !== null) {
      this.observer = new MutationObserver(x => this.on_mutation(x));
      this.observer.observe(document.body.parentNode, { childList: true, subtree: true });
    }
  }

  bootstrap<_t_ = unknown>(controller: lmvc_controller<_t_> = {}): void | Promise<any> {
    console.assert(!this.root_scope && document.body.parentElement !== null);
    if(document.body.parentElement !== null) {
      this.root_scope = {
        app: this,
        controller,
        descendant: [],
        node: document.body.parentElement,
        view: [controller]
      };
      return this.create(this.root_scope);
    }
  }

  private async create(scope: lmvc_scope) {
    for(const hook of this.create_hooks) {
      const rs = hook(scope);
      if(typeof rs === 'object' && rs !== null && typeof rs.then === 'function') {
        await rs;
      }
    }
  }

  static create_controller(scope: lmvc_scope) {
    if(scope.controller) {
    }
  }

  static create_view(scope: lmvc_scope) {
    if(scope.args) {
    }
  }

  private on_mutation(recs: MutationRecord[]) {
    console.debug({ on_mutation: recs });
  }

  create_hooks: lmvc_hook[] = [
    lmvc_app.create_view
  ];

  teardown_hooks: lmvc_hook[] = [
  ];

  private observer?: MutationObserver;
  root_scope?: lmvc_scope;
}
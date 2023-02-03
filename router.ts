/* @preserve
  (c) 2020 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { $view, view } from './view';
import type { lmvc_controller, lmvc_controller_metedata_arg, lmvc_router, lmvc_scope } from './type';

@view()
export class lmvc_router_imp implements lmvc_router {
  constructor() {
    this.base_url += (this.base_url.endsWith('/') ? '#' : '/#');
  }

  private async append() {
    this.place_holder.parentElement!.insertBefore(this.content!, this.place_holder);
    const id = window.location.hash.slice(2).replace(/\//g, ':');
    let node = <Element>this.$scope!.node;
    node.innerHTML = `<div *${id}></div>`;
    node = node.firstElementChild!;
    const scope = await this.$scope!.app.load_scope(node, this.$scope!.controller);
    this.route[++this.current] = scope;
    window.history.replaceState(this.current, '');
    this.place_holder.parentElement!.removeChild(this.content!);
    this.place_holder.parentElement!.insertBefore(scope.node, this.place_holder);
    const ctlr = <lmvc_route_controller | undefined>scope.view[0];
    if(ctlr && typeof ctlr.$get_title === 'function') {
      let rs = ctlr.$get_title();
      if(typeof rs === 'object' && typeof rs.then === 'function') {
        rs = await rs;
      }
      window.document.title = <string>rs;
    }
  }

  private create_node(id: string) {
    let node = <Element>this.$scope!.node;
    node.innerHTML = `<div *${id}></div>`;
    return <HTMLDivElement>node.firstElementChild!;
  }

  private do_initial_route() {
    return this.replace(window.location.href.startsWith(this.base_url) ? window.location.hash.slice(1) : this.$value || '/home');
  }

  private async handle_popstate(evt: PopStateEvent) {
    await new Promise<void>(res => setTimeout(res, 0));
    console.debug('onpopstate', evt);
    if(this.current !== -1) {
      let scope = this.route[this.current];
      let ctlr = <lmvc_route_controller>scope.view[0];
      if(typeof ctlr.$can_leave === 'function') {
        let rs = ctlr.$can_leave();
        if(typeof rs === 'object' && typeof rs.then === 'function') {
          rs = await rs;
        }
        if(!rs) {
          if(typeof evt.state !== 'number' || this.current < evt.state) {
            window.history.back();
          }
          else {
            window.history.forward();
          }
          return;
        }
      }
      let node = scope.node;
      node.parentElement!.removeChild(node);
    }
    if(typeof evt.state === 'number' && evt.state >= 0) {
      this.current = evt.state;
      this.place_holder.parentElement!.insertBefore(this.route[this.current].node, this.place_holder);
    }
    else if(!evt.state) {
      await this.append();
    }
    //   if(!this.is_cancelling) {
    //     if(typeof evt.state === 'number' && evt.state >= 0) {
    //       if(await this.unmount_current()) {
    //         const vctx = this.$view[evt.state];
    //         if(vctx) {
    //           this.current = evt.state;
    //           if(this.content.parentNode) {
    //             this.$place_holder!.parentNode!.replaceChild(vctx.$scope.node, this.content);
    //           }
    //           else {
    //             this.$place_holder!.parentNode!.insertBefore(vctx.$scope.node, this.$place_holder!);
    //           }
    //           window.document.title = await this.get_view_title(vctx) || 'untitled';
    //         }
    //         else {
    //           await this.refresh(window.location.hash.slice(2), evt.state);
    //         }
    //       }
    //       else {
    //         this.is_cancelling = true;
    //         if(this.current > evt.state) {
    //           window.history.forward();
    //         }
    //         else {
    //           window.history.back();
    //         }
    //       }
    //     }
    //     else {
    //       await this.push(window.location.hash.slice(2), push_state.replace);
    //     }
    //   }
    //   else {
    //     this.is_cancelling = undefined;
    //   }
  }

  private static is_not_found_exception(ex: any) {
    if(ex.message === 'cancelled') {
      return false;
    }
    if(typeof ex.redirect === 'string') {
      setTimeout(() => window.location.href = ex.redirect);
      return false;
    }
    if(typeof ex.replace === 'string') {
      setTimeout(() => window.location.replace(ex.replace));
      return false;
    }
    if(ex.status === 401) { // unauthorized
      const auth: string | null = ex.getResponseHeader('www-authenticate');
      if(auth) {
        const match = /^OAuth realm="([^"]+)"$/.exec(auth);
        if(match?.length === 2) {
          setTimeout(() => window.location.replace(match[1]));
          return false;
        }
      }
      setTimeout(() => window.location.replace('/#/not-authorized'));
      return false;
    }
    return true;
  }

  private async load(path: string): Promise<lmvc_scope | undefined> {
    this.place_holder.parentElement?.insertBefore(this.content!, this.place_holder);
    try {
      for(let item of this.rest) {
        const match = item.pattern.exec(path);
        if(match) {
          let rt = await this.$scope!.app.load_scope(item.node.cloneNode(true), this.$scope!.controller);
          if(rt) {
            rt.view[0].$arg = match.slice(1).reduce<any>((rs, x, idx) => {
              rs[item.rest[idx]] = x.slice(1);
              return rs;
            }, {});
            return rt;
          }
        }
      }
      const segment = path.slice(1).split('/');
      if(segment.length === 1) {
        segment.push('main');
      }
      let error: any;
      for(let idx = segment.length; idx > 0; --idx) {
        let id = segment.slice(0, idx).join(':');
        if(!id) {
          break;
        }
        if(this.skip.has(id)) {
          continue;
        }
        let rt: lmvc_scope | undefined;
        let node = this.create_node(id);
        try {
          rt = await this.$scope!.app.load_scope(node.cloneNode(), this.$scope!.controller);
          if(rt.view.length === 0) {
            throw new Error('not-found');
          }
        }
        catch(ex: any) {
          if(!lmvc_router_imp.is_not_found_exception(ex)) {
            return undefined;
          }
          if(ex.message !== 'not-found') {
            console.error(ex);
          }
          try {
            node = this.create_node(id + ':main');
            rt = await this.$scope!.app.load_scope(node.cloneNode(), this.$scope!.controller);
            if(rt.view.length === 0) {
              throw new Error('not-found');
            }
          }
          catch(ex2: any) {
            this.skip.add(id);
            if(!lmvc_router_imp.is_not_found_exception(ex2)) {
              return undefined;
            }
            if(ex2.message !== 'not-found') {
              console.error(ex2);
              error = ex2;
            }
            continue;
          }
        }
        const ctlr = <lmvc_route_controller>rt.view[0];
        const md = <lmvc_controller_metedata_arg | undefined>$view.get_view_metadata(ctlr);
        if(md && Array.isArray(md.rest)) {
          let required = md.rest.findIndex(x => typeof x !== 'string' && x.is_optional);
          if((required === -1 && md.rest.length <= (segment.length - idx)) || (required > 0 && required < (segment.length - idx))) {
            const rest = {
              pattern: new RegExp(`^${segment.slice(0, idx).join('\\/')}${md.rest.map((_x, i) => {
                let rt = '(\\/[^\\/]+)';
                return required !== -1 && i >= required ? `${rt}?` : rt;
              })}$`),
              rest: md.rest.map(x => typeof x === 'string' ? x : x.id),
              node
            };
            this.rest.push(rest);
            ctlr.$arg = segment.slice(idx).reduce<any>((rs, x, idx) => {
              rs[rest.rest[idx]] = x;
              return rs;
            }, {});
          }
        }
        if(ctlr && typeof ctlr.$get_title === 'function') {
          let rs = ctlr.$get_title();
          if(typeof rs === 'object' && typeof rs.then === 'function') {
            rs = await rs;
          }
          window.document.title = <string>rs;
        }
        return rt;
      }
      if(error) {
        const iframe = window.document.createElement('iframe');
        iframe.height = '100%';
        iframe.width = '100%';
        iframe.src = `data:text/html;charset=utf-8,${encodeURI(error.responseText || error.message || JSON.stringify(error))}`;
        this.place_holder.parentElement?.insertBefore(iframe, this.place_holder);
      }
      return undefined;
    }
    finally {
      this.place_holder.parentElement!.removeChild(this.content!);
    }
  }

  async push(path: string) {
    await this.task;
    if(!await this.unmount_current()) {
      return false;
    }
    const app = this.$scope!.app;
    if(this.current !== -1) {
      for(let scope of this.route.splice(this.current + 1)) {
        app.destroy_scope(scope);
      }
    }
    let scope = await this.load(path);
    if(scope) {
      this.route.push(scope);
      window.history.pushState(++this.current, '', `./#${path}`);
      (<lmvc_route_controller>scope.view[0]).href = window.location.href;
      this.place_holder.parentElement!.insertBefore(scope.node, this.place_holder);
      return true;
    }
    return false;
  }

  private on_popstate(evt: PopStateEvent) {
    this.task = this.task.then(() => this.handle_popstate(evt), ex => console.error(ex));
  }

  async replace(path: string) {
    await this.task;
    if(!await this.unmount_current()) {
      return false;
    }
    let scope = await this.load(path);
    if(scope) {
      if(this.current === -1) {
        this.current = 0;
        this.route.push(scope);
      }
      else {
        await this.$scope!.app.destroy_scope(this.route[this.current]);
        this.route[this.current] = scope;
      }
      window.history.replaceState(0, '', `./#${path}`);
      (<lmvc_route_controller>scope.view[0]).href = window.location.href;
      this.place_holder.parentElement!.insertBefore(scope.node, this.place_holder);
      return true;
    }
    return false;
  }

  private async unmount_current() {
    let scope = this.route[this.current];
    if(scope) {
      let ctlr = <lmvc_route_controller>scope.view[0];
      if(typeof ctlr.$can_leave === 'function') {
        let rs = ctlr.$can_leave();
        if(!(typeof rs === 'object' && typeof rs.then === 'function' ? await rs : rs)) {
          return false;
        }
      }
      let node = scope.node;
      console.assert(node.parentElement !== null);
      if(node.parentElement) {
        node.parentElement.removeChild(node);
      }
    }
    return true;
  }

  $dispose() {
    if(this.place_holder.parentElement) {
      this.place_holder.parentElement.removeChild(this.place_holder);
    }
  }

  $init() {
    this.$scope!.app.router = this;
  }

  $mount(): void | Promise<any> {
    if(!this.popstate_handler) {
      this.popstate_handler = lmvc_router_imp.prototype.on_popstate.bind(this);
      window.addEventListener('popstate', this.popstate_handler);
    }
    if(!this.place_holder.parentNode && this.$scope?.node.parentNode) {
      this.$scope.node.parentNode.replaceChild(this.place_holder, this.$scope.node);
      return this.do_initial_route();
    }
  }

  async $ready() {
    const node = this.$scope!.node;
    node.childNodes.forEach(x => {
      if(x.nodeType === Node.ELEMENT_NODE) {
        this.content = x;
      }
    });
    if(this.content) {
      node.removeChild(this.content);
    }
    else {
      this.content = document.createElement('div');
      (<HTMLElement>this.content).classList.add('l-router-loading');
      (<HTMLElement>this.content).innerText = 'loading, please wait...';
    }
    if(node.parentNode) {
      this.popstate_handler = lmvc_router_imp.prototype.on_popstate.bind(this);
      window.addEventListener('popstate', this.popstate_handler);
      node.parentNode.replaceChild(this.place_holder, node);
      await this.do_initial_route();
    }
  }

  $unmount(): void | Promise<any> {
    if(this.popstate_handler) {
      window.removeEventListener('popstate', this.popstate_handler);
      this.popstate_handler = undefined;
    }
  }

  // private async do_route(controller: lmvc_controller, module: string, cb: (view: route_page_view_ctx) => Promise<void>) {
  //   let vctx: lmvc_controller;
  //   const template = <HTMLElement | undefined>await $controller.get_controller_html(controller);
  //   if(template) {
  //     try {
  //       vctx = await this.$app.mount_controller(template, controller, this);
  //     }
  //     catch(ex: any) {
  //       console.error(ex);
  //       vctx = {
  //         $app: this.$app,
  //         $scope: {
  //           model: this.$model,
  //           node: window.document.createElement('iframe'),
  //           template
  //         },
  //         $view: [],
  //         $arg: module,
  //         $model: {},
  //         $parent: this,
  //         $value: Object.getPrototypeOf(controller).constructor.name
  //       };
  //       const iframe = <HTMLIFrameElement>vctx.$scope.node;
  //       iframe.height = '100%';
  //       iframe.width = '100%';
  //       iframe.src = `data:text/html;charset=utf-8,${encodeURI(ex.responseText || ex.message || JSON.stringify(ex))}`;
  //     }
  //     await cb(vctx);
  //   }
  // }

  // private async get_view_title(vctx: route_page_view_ctx) {
  //   let title: string | undefined;
  //   if(typeof vctx.$get_title === 'function') {
  //     const rs = vctx.$get_title();
  //     return typeof rs === 'string' ? rs : await rs;
  //   }
  //   return title;
  // }

  // private async load(module: string, cb: ((view: route_page_view_ctx) => Promise<void>), dont_redirect?: true) {
  //   this.$place_holder!.parentNode!.insertBefore(this.content, this.$place_holder!);
  //   for(let item of this.rest) {
  //     const match = item.pattern.exec(module);
  //     if(match) {
  //       item.controller.$arg = match.slice(1).reduce<any>((rs, x, idx) => {
  //         rs[item.rest[idx]] = x.slice(1);
  //         return rs;
  //       }, {});
  //       await this.do_route(item.controller, module, cb);
  //       return;
  //     }
  //   }
  //   const segment = module ? module.split('/') : [];
  //   for(let idx = segment.length; idx > 0; --idx) {
  //     const path = segment.slice(0, idx).join(':');
  //     if(!path) {
  //       break;
  //     }
  //     let controller = this.route[path];
  //     if(!controller) {
  //       if(this.skip.has(path)) {
  //         continue;
  //       }
  //       try {
  //         controller = <lmvc_controller>await this.$app.create_view(path);
  //       }
  //       catch(_) {
  //         try {
  //           controller = <lmvc_controller>await this.$app.create_view(`${path}:main`);
  //         }
  //         catch(_) {
  //           this.skip.add(path);
  //           continue;
  //         }
  //       }
  //       const md = <mvc_controller_metedata_arg | undefined>mvc_view.get_view_metadata(controller);
  //       if(md && Array.isArray(md.rest)) {
  //         let required = md.rest.findIndex(x => typeof x !== 'string' && x.is_optional);
  //         if((required === -1 && md.rest.length <= (segment.length - idx)) || (required > 0 && required < (segment.length - idx))) {
  //           const rest = {
  //             pattern: new RegExp(`^${segment.slice(0, idx).join('\\/')}${md.rest.map((_x, i) => {
  //               let rt = '(\\/[^\\/]+)';
  //               return required !== -1 && i >= required ? `${rt}?` : rt;
  //             })}$`),
  //             rest: md.rest.map(x => typeof x === 'string' ? x : x.id),
  //             controller
  //           };
  //           this.rest.push(rest);
  //           controller.$arg = segment.slice(idx).reduce<any>((rs, x, idx) => {
  //             rs[rest.rest[idx]] = x;
  //             return rs;
  //           }, {});
  //         }
  //       }
  //       this.route[path] = controller;
  //     }
  //     await this.do_route(controller, module, cb);
  //     return;
  //   }
  //   console.warn(`route (${module}) not found.`);
  //   if(!dont_redirect) {
  //     this.$place_holder!.parentNode!.removeChild(this.content);
  //     await this.load(`${this.$value || 'home'}/page/not-found`, cb, true);
  //   }
  // }

  // private async push(module: string, state: push_state) {
  //   if(await this.unmount_current()) {
  //     if(state && this.current !== (this.$view.length - 1)) {
  //       await Promise.all(this.$view.splice(this.current + 1).filter(x => typeof x.$dispose === 'function').map(x => x.$dispose!()).filter(x => x && typeof x.then === 'function'));
  //     }
  //     await this.load(module, async vctx => {
  //       vctx.href = `${this.base_url}/${module}`;
  //       let title = await this.get_view_title(vctx) || 'untitled';
  //       this.$view.push(vctx);
  //       ++this.current;
  //       this.$place_holder!.parentNode!.replaceChild(vctx.$scope.node, this.content);
  //       switch(state) {
  //         case push_state.append:
  //           window.history.pushState(this.current, title, vctx.href);
  //           window.document.title = title;
  //           break;
  //         case push_state.replace:
  //           window.history.replaceState(this.current, title, vctx.href);
  //           window.document.title = title;
  //           break;
  //       }
  //     });
  //   }
  // }

  // private refresh(module: string, current: number): PromiseLike<void> {
  //   return this.load(module, async vctx => {
  //     vctx.href = `${this.base_url}/${module}`;
  //     let title = await this.get_view_title(vctx) || 'untitled';
  //     if(typeof current === 'number') {
  //       this.current = current;
  //     }
  //     else {
  //       window.history.replaceState(this.current, title, vctx.href);
  //     }
  //     this.$view[this.current] = vctx;
  //     this.$place_holder!.parentNode!.replaceChild(vctx.$scope.node, this.content);
  //     window.document.title = title;
  //   });
  // }

  // private replace(module: string,): PromiseLike<void> {
  //   return this.load(module, async vctx => {
  //     if(await this.unmount_current()) {
  //       vctx.href = `${this.base_url}/${module}`;
  //       let title = await this.get_view_title(vctx) || 'untitled';
  //       if(this.$view.length > this.current) {
  //         const old = this.$view.splice(this.current, 1, vctx)[0];
  //         if(typeof old.$dispose === 'function') {
  //           const rs = old.$dispose();
  //           if(rs) {
  //             await rs;
  //           }
  //         }
  //       }
  //       else {
  //         this.$view.push(vctx);
  //       }
  //       this.$place_holder!.parentNode!.replaceChild(vctx.$scope.node, this.content);
  //       window.history.replaceState(this.current, title, vctx.href);
  //       window.document.title = title;
  //     }
  //   });
  // }

  // private async unmount_current(): Promise<boolean> {
  //   const vctx = this.$view[this.current];
  //   if(vctx && vctx.$scope.node.parentNode) {
  //     if(typeof vctx.$can_unmount === 'function') {
  //       const rs = vctx.$can_unmount();
  //       if(rs === false || (await rs) === false) {
  //         return false;
  //       }
  //     }
  //     this.$place_holder!.parentNode!.removeChild(vctx.$scope.node);
  //   }
  //   return true;
  // }

  private base_url = `${window.location.origin}${requirejs.toUrl(window.location.pathname)}`;
  private content?: Node;
  private current = -1;
  private place_holder = document.createComment('');
  private popstate_handler?: (evt: PopStateEvent) => any;
  private rest: { pattern: RegExp, node: HTMLDivElement, rest: string[] }[] = [];
  private route: lmvc_scope[] = [];
  private skip = new Set<string>();
  private task = Promise.resolve();
  // $view!: route_page_view_ctx[];
  // is_cancelling?: true;
  // route!: Record<string, lmvc_controller>;
  $scope?: lmvc_scope;
  $value?: string;
}

interface lmvc_route_controller extends lmvc_controller {
  href?: string;
}

// enum push_state {
//   dont,
//   append,
//   replace
// }
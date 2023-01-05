/* @preserve
  (c) 2020 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { view } from './view';
import type { lmvc_view } from './type';

@view()
export class lmvc_router implements lmvc_view {
  constructor() {
    this.base_url += (this.base_url.endsWith('/') ? '#' : '/#');
  //   this.current = 0;
  //   this.$view = [];
  //   this.rest = [];
  //   this.route = {};
  //   this.skip = new Set<string>();
  }

  // private async do_route(controller: lmvc_controller, module: string, cb: (view: route_page_view_ctx) => Promise<void>) {
  //   let vctx: lmvc_controller;
  //   const template = <HTMLElement | undefined>await $controller.get_controller_html(controller);
  //   if(template) {
  //     try {
  //       vctx = await this.$app.mount_controller(template, controller, this);
  //     }
  //     catch(ex: any) {
  //       if(ex.message === 'cancelled') {
  //         return;
  //       }
  //       if(typeof ex.redirect === 'string') {
  //         setTimeout(() => window.location.href = ex.redirect);
  //         return;
  //       }
  //       if(typeof ex.replace === 'string') {
  //         setTimeout(() => window.location.replace(ex.replace));
  //         return;
  //       }
  //       if(ex.status === 401) { // unauthorized
  //         const auth: string | null = ex.getResponseHeader('www-authenticate');
  //         if(auth) {
  //           const match = /^OAuth realm="([^"]+)"$/.exec(auth);
  //           if(match?.length === 2) {
  //             setTimeout(() => window.location.replace(match[1]));
  //             return;
  //           }
  //         }
  //         setTimeout(() => window.location.replace('/#/not-authorized'));
  //         return;
  //       }
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

  // private async on_popstate(evt: PopStateEvent,) {
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

  // async $ready() {
  //   window.addEventListener('popstate', evt => this.on_popstate(evt).catch(ex => console.error(ex)));
  //   const node = this.$node;
  //   node.childNodes.forEach(x => {
  //     if(x.nodeType === Node.ELEMENT_NODE) {
  //       this.content = x;
  //     }
  //   });
  //   if(this.content) {
  //     node.removeChild(this.content);
  //   }
  //   else {
  //     this.content = document.createElement('div');
  //     (<HTMLElement>this.content).classList.add('l-router-loading');
  //     (<HTMLElement>this.content).innerText = 'loading, please wait...';
  //   }
  //   node.parentNode!.replaceChild(this.$place_holder!, node);
  //   await (window.location.href.startsWith(this.base_url) ?
  //     this.refresh(window.location.href.slice(this.base_url.length + 1), window.history.state) :
  //     this.replace(<string>this.$value || 'home'));
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

  base_url = `${window.location.origin}${requirejs.toUrl('/')}`;
  // content!: Node;
  // current!: number;
  $place_holder = document.createComment('');
  // $view!: route_page_view_ctx[];
  // is_cancelling?: true;
  // rest!: { pattern: RegExp, controller: lmvc_controller, rest: string[] }[];
  // route!: Record<string, lmvc_controller>;
  // skip!: Set<string>;
  $value?: unknown;
}

// interface route_page_view_ctx extends lmvc_controller {
//   href?: string;
// }

// enum push_state {
//   dont,
//   append,
//   replace
// }
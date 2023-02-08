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
    this.popstate_handler = lmvc_router_imp.prototype.on_popstate.bind(this);
    window.addEventListener('popstate', this.popstate_handler);
  }

  private async append(path?: string) {
    await this.trim();
    const rt = await this.create_scope(path);
    if(rt) {
      this.route[++this.current] = rt;
      await this.set_window_title();
    }
    return rt;
  }

  private async set_window_title() {
    const ctlr = <lmvc_controller | undefined>this.route[this.current].view[0];
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
    node.innerHTML = `<div ${id}></div>`;
    return <HTMLDivElement>node.firstElementChild!;
  }

  private async create_scope(path?: string) {
    const rt = await this.load(path || window.location.hash.slice(1));
    if(rt) {
      this.place_holder.parentElement!.insertBefore(rt.node, this.place_holder);
    }
    else {
      console.assert(false, 'todo: handle unloaded scope situations');
    }
    return rt;
  }

  private async do_initial_route() {
    if(this.current !== -1) {
      const scope = await this.create_scope();
      if(scope) {
        this.route[this.current] = scope;
        await this.set_window_title();
      }
    }
    else {
      await this.replace(window.location.href.startsWith(this.base_url) ? window.location.hash.slice(1) : this.$value || '/home');
    }
  }

  private async handle_popstate(evt: PopStateEvent) {
    await new Promise<void>(res => setTimeout(res, 0));
    if(this.current !== -1) {
      let scope = this.route[this.current];
      let ctlr = <lmvc_controller>scope.view[0];
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
      if(!this.route[evt.state]) {
        const scope = await this.create_scope();
        if(scope) {
          this.route[evt.state] = scope;
        }
      }
      else {
        this.place_holder.parentElement!.insertBefore(this.route[this.current].node, this.place_holder);
      }
    }
    else if(!evt.state) {
      const scope = await this.append();
      if(scope) {
        window.history.replaceState(this.current, '');
      }
    }
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
      setTimeout(() => window.location.replace('/#/home/not-authorized'));
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
            error = ex;
            break;
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
              break;
            }
            continue;
          }
        }
        const ctlr = <lmvc_controller>rt.view[0];
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
        const s = this.$scope!;
        return {
          app: s.app,
          controller: s.controller,
          node: iframe,
          template: iframe,
          view: [{}]
        };
      }
      return undefined;
    }
    finally {
      this.place_holder.parentElement!.removeChild(this.content!);
    }
  }

  async push(path: string) {
    await this.task;
    if(await this.unmount_current()) {
      const scope = await this.append(path);
      if(scope) {
        window.history.pushState(++this.current, '', `./#${path}`);
        return true;
      }
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
      this.place_holder.parentElement!.insertBefore(scope.node, this.place_holder);
      return true;
    }
    return false;
  }

  private trim() {
    const app = this.$scope!.app;
    const task: Promise<void>[] = [];
    if(this.current !== -1) {
      for(let scope of this.route.splice(this.current + 1)) {
        console.debug({ destroy_scope: scope });
        task.push(app.destroy_scope(scope));
      }
    }
    return Promise.all(task);
  }

  private async unmount_current() {
    let scope = this.route[this.current];
    if(scope) {
      let ctlr = <lmvc_controller>scope.view[0];
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
    window.removeEventListener('popstate', this.popstate_handler);
    if(this.place_holder.parentElement) {
      this.place_holder.parentElement.removeChild(this.place_holder);
    }
  }

  $init() {
    this.$scope!.app.router = this;
  }

  $mount(): void | Promise<any> {
    if(this.$scope!.node.parentNode) {
      this.$scope!.node.parentNode.replaceChild(this.place_holder, this.$scope!.node);
    }
    return this.do_initial_route();
  }

  $ready() {
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
      node.parentNode.replaceChild(this.place_holder, node);
    }
  }

  private base_url = `${window.location.origin}${requirejs.toUrl(window.location.pathname)}`;
  private content?: Node;
  private current = window.history.state || -1;
  private place_holder = document.createComment('');
  private popstate_handler: (evt: PopStateEvent) => any;
  private rest: { pattern: RegExp, node: HTMLDivElement, rest: string[] }[] = [];
  private route: lmvc_scope[] = [];
  private skip = new Set<string>();
  private task = Promise.resolve();
  $scope?: lmvc_scope;
  $value?: string;
}
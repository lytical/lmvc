/* @preserve.
  (c) 2019 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { $view } from './view';
import { $controller } from './controller';
import { $model } from './model';
import type { __cstor } from 'common/plain-object';
import type { lmvc_app as lmvc_app_t, lmvc_controller, lmvc_scope, lmvc_view } from './type';

const view_attr_pattern = /\*?\w[\w\-]*(:\w[\w\-]*){1,}/;

export class lmvc_app implements lmvc_app_t {
  constructor() {
    const html = document.querySelector('html');
    console.assert(html !== null);
    if(html !== null) {
      this.observer = new MutationObserver(x => this.on_mutation(x).catch(ex => console.error(ex)));
      this.observer.observe(html, { childList: true, subtree: true });
    }
  }

  async bootstrap(ctlr: lmvc_controller = { $model: {}, $view: [] }): Promise<lmvc_controller> {
    console.assert(document.body.parentNode !== null);
    if(document.body.parentNode !== null) {
      const views: lmvc_view[] = [ctlr];
      ctlr.$model = $model.make_model(ctlr.$model || {});
      ctlr.$scope = await this.load_scope(document.body.parentNode, ctlr, views);
      await this.load_descendants(ctlr.$scope.node, ctlr, views);
      await lmvc_app.init_views(views);
      await $view.invoke_method('$mount', this.get_scope_views_self_and_descendant(ctlr.$scope), x => x.$is_ready === true);
    }
    return ctlr;
  }

  async create_view_instance(id: string): Promise<lmvc_view> {
    let cstor = this.view[id];
    if(!cstor) {
      cstor = $view.load_view(id);
      this.register_view(id, cstor);
    }
    const rt = new (await cstor)();
    if(typeof rt.$create === 'function') {
      await rt.$create();
    }
    return rt;
  }

  async destroy_scope(scope: lmvc_scope) {
    const ls = this.get_scope_self_and_descendant(scope);
    if(ls.length) {
      ls[0].node.parentNode?.removeChild(ls[0].node);
      const task: Promise<void>[] = [];
      for(let i = ls.length - 1; i !== -1; --i) {
        for(let v of ls[i].view) {
          if(typeof v.$dispose === 'function') {
            let rs = v.$dispose();
            if(typeof rs === 'object' && typeof rs?.then === 'function') {
              task.push(rs);
            }
          }
        }
      }
      await Promise.all(task);
    }
  }

  find_scope(node: Node) {
    const rt: lmvc_scope[] = [];
    for(let scope of this.scope) {
      if(scope.node === node) {
        rt.push(scope);
      }
    }
    return rt;
  }

  private get_scope_self_and_descendant(scope: lmvc_scope) {
    const rt: lmvc_scope[] = [];
    for(let x of this.scope) {
      if(scope.node.contains(x.node)) {
        rt.push(x);
      }
    }
    return rt;
  }

  private get_scope_views_self_and_descendant(scope: lmvc_scope) {
    return this
      .get_scope_self_and_descendant(scope)
      .map(x => x.view).reduce((rs, x) => {
        rs.push(...x);
        return rs;
      }, []);
  }

  private static async init_views(views: lmvc_view[]) {
    let wait = <Promise<any>[]>views
      .map(x => typeof x.$init === 'function' ? x.$init() : undefined)
      .filter(x => typeof x === 'object' && typeof x.then === 'function');
    await Promise.all(wait);
    wait = <Promise<any>[]>views
      .map(x => typeof x.$ready === 'function' ? x.$ready() : undefined)
      .filter(x => typeof x === 'object' && typeof x.then === 'function');
    await Promise.all(wait);
    for(let x of views) {
      x.$is_ready = true;
    }
  }

  private invoke_scoped_views(node: Node, method: string, filter = (_: lmvc_view) => true): PromiseLike<any> {
    const scope = this.find_scope(node);
    return scope ? $view.invoke_method(method, scope.reduce((rs, x) => {
      rs.push(...x.view);
      return rs;
    }, <lmvc_view[]>[]), filter) : Promise.resolve();
  }

  private static join_attrib_value(name: string, target: Element, source: Element, seperator: string) {
    target.setAttribute(name,
      Array
        .from(new Set(`${target.getAttribute(name)}${seperator}${source.getAttribute(name)}`
          .split(seperator)
          .map(x => x.trim())
          .filter(x => x.length)))
        .join(seperator));
  }

  load_descendants(node: Node, controller: lmvc_controller, views?: lmvc_view[]) {
    let wait: Promise<lmvc_scope>[] = [];
    let it = document.createNodeIterator(node, NodeFilter.SHOW_ELEMENT, lmvc_app.node_iterator);
    for(let next = <Element>it.nextNode(); next; next = <Element>it.nextNode()) {
      wait.push(this.load_scope(next, controller, views));
    }
    return Promise.all(wait);
  }

  async load_scope(node: Node, ctlr: lmvc_controller, views?: lmvc_view[]): Promise<lmvc_scope> {
    const scope: lmvc_scope = {
      app: this,
      controller: ctlr,
      node,
      template: node.cloneNode(),
      view: []
    };
    let is_root: true | undefined;
    if(!views) {
      is_root = true;
      views = [];
    }
    if(scope.node instanceof Element) {
      const attr = scope.node.attributes;
      if(attr) {
        let remove: string[] = [];
        let ctlr: lmvc_controller | undefined;
        for(let i = 0, max = attr.length; i < max; ++i) {
          const item = attr.item(i);
          if(item) {
            const match = view_attr_pattern.exec(item.name);
            if(match && match.index === 0) {
              remove.push(item.name);
              if(item.name.startsWith('*')) {
                ctlr = <lmvc_controller>await this.create_view_instance(match.input.slice(1, match[0].length));
                scope.view.push(ctlr);
                views.push(ctlr);
                ctlr.$scope = scope;
                ctlr.$model = $model.make_model(ctlr.$model || {});
                ctlr.$arg = match.input.slice(match[0].length + 1);
                ctlr.$value = item.value;
              }
              else {
                let view = await this.create_view_instance(match.input.slice(0, match[0].length));
                scope.view.push(view);
                views.push(view);
                view.$scope = scope;
                view.$arg = match.input.slice(match[0].length + 1);
                view.$value = item.value;
              }
            }
          }
        }
        for(let name of remove) {
          attr.removeNamedItem(name);
        }
        if(ctlr) {
          let node = await $controller.get_controller_html(ctlr);
          if(node && Array.isArray(node) && node.length) {
            if(node.length > 1) {
              let lang =
                document.body.lang?.toLowerCase() ||
                document.body.parentElement?.querySelector('meta[http-equiv=content-language]')?.attributes.getNamedItem('content')?.value?.toLowerCase() ||
                document.body.parentElement?.lang?.toLowerCase() ||
                'en';
              let html = node.filter(x => (<Element>x).attributes.getNamedItem('lang')?.value === lang);
              if(!html.length) {
                lang = lang.split('-')[0];
                html = node.filter(x => (<Element>x).attributes.getNamedItem('lang')?.value === lang);
                if(!html.length) {
                  html = node.filter(x => (<Element>x).attributes.getNamedItem('lang') === null);
                  if(!html.length) {
                    console.assert(false, 'unable to identify locale');
                    html = [node[0]];
                  }
                }
              }
              console.assert(html.length === 1);
              node = [html[0]];
            }
            if(node[0] instanceof Element && scope.node instanceof Element) {
              if(node[0].attributes && scope.node.attributes) {
                for(let i = 0, max = scope.node.attributes.length; i < max; ++i) {
                  const attr = scope.node.attributes.item(i);
                  if(attr) {
                    if(!node[0].hasAttribute(attr.name)) {
                      scope.node.attributes.removeNamedItem(attr.name);
                      node[0].attributes.setNamedItem(attr);
                      --i;
                    }
                    else {
                      if(attr.name === 'style') {
                        lmvc_app.join_attrib_value('style', node[0], scope.node, ';');
                      }
                      else {
                        lmvc_app.join_attrib_value(attr.name, node[0], scope.node, ' ');
                      }
                    }
                  }
                }
              }
              scope.node.parentNode?.replaceChild(node[0], scope.node);
              scope.node = node[0];
            }
          }
          ctlr.$view = (await this.load_descendants(scope.node, ctlr, views)).reduce((rs, x) => {
            rs.push(...x.view);
            return rs;
          }, <lmvc_view[]>[]);
        }
      }
    }
    if(scope.controller) {
      scope.controller.$model = $model.make_model(scope.controller.$model || {});
    }
    if(is_root) {
      await lmvc_app.init_views(views.concat(scope.view));
    }
    this.scope.push(scope);
    return scope;
  }

  private on_mutation(recs: MutationRecord[]) {
    const rt: PromiseLike<any>[] = [];
    for(let x of recs) {
      x.removedNodes.forEach(y => rt.push(this.invoke_scoped_views(y, '$unmount')));
    }
    for(let x of recs) {
      x.addedNodes.forEach(y => rt.push(this.invoke_scoped_views(y, '$mount')));
    }
    return Promise.all(rt);
  }

  register_view(id: string, cstor: Promise<__cstor<lmvc_view>>) {
    console.assert(this.view[id] === undefined);
    this.view[id] = cstor;
  }

  private static node_iterator = {
    acceptNode(node: Node) {
      if(node instanceof Element) {
        const attr = node.attributes;
        if(attr !== undefined && attr.length) {
          for(let i = 0, max = attr.length; i < max; ++i) {
            const item = attr.item(i);
            if(item) {
              const match = view_attr_pattern.exec(item.name);
              if(match !== null && match.index === 0) {
                return NodeFilter.FILTER_ACCEPT;
              }
            }
          }
        }
      }
      return NodeFilter.FILTER_SKIP;
    }
  }

  controller?: lmvc_controller<any>;
  private observer?: MutationObserver;
  private scope: lmvc_scope[] = [];
  private readonly view: Record<string, Promise<__cstor<lmvc_view>>> = {};
}

export default new lmvc_app();
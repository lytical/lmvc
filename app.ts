/* @preserve
  (c) 2019 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { $view } from './view';
import { $controller } from './controller';
import { $model } from './model';
import type { __cstor } from 'common/plain-object';
import type { lmvc_controller, lmvc_scope, lmvc_view } from './type';

const view_attr_pattern = /\*?\w[\w\-]*(:\w[\w\-]*){1,}/;

export class lmvc_app {
  constructor() {
    console.assert(document.body.parentNode !== null);
    if(document.body.parentNode !== null) {
      this.observer = new MutationObserver(x => this.on_mutation(x));
      this.observer.observe(document.body.parentNode, { childList: true, subtree: true });
    }
  }

  async bootstrap(controller: lmvc_controller = { $model: {}, $view: [] }): Promise<any> {
    console.assert(!this.root_scope && document.body.parentNode !== null);
    if(document.body.parentNode !== null) {
      this.root_scope = {
        app: this,
        controller,
        node: document.body.parentNode,
        template: document.body.parentNode.cloneNode(),
        view: [controller]
      };
      const views: lmvc_view[] = [];
      const rt = await this.load_scope(this.root_scope, views);
      await this.load_descendants(this.root_scope.node, controller, this.root_scope, views);
      await lmvc_app.init_views(views.concat(this.root_scope.view));
      return rt;
    }
  }

  protected async create_view_instance(id: string): Promise<lmvc_view> {
    let cstor = this.view[id];
    if(!cstor) {
      cstor = await $view.load_view(id);
      this.view[id] = cstor;
    }
    const rt: lmvc_view = new cstor();
    if(typeof rt.$create === 'function') {
      await rt.$create();
    }
    return rt;
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

  protected async load_descendants(node: Node, controller: lmvc_controller, parent: lmvc_scope, views?: lmvc_view[]) {
    let wait: Promise<any>[] = [];
    let it = document.createNodeIterator(node, NodeFilter.SHOW_ELEMENT, lmvc_app.node_iterator);
    for(let next = <Element>it.nextNode(); next; next = <Element>it.nextNode()) {
      wait.push(this.load_scope({
        app: this,
        controller,
        node: next,
        parent,
        template: next.cloneNode(),
        view: []
      }, views));
    }
    parent.descendant = await Promise.all(wait);
  }

  protected async load_scope(scope: lmvc_scope, views?: lmvc_view[]) {
    let is_root: true | undefined;
    if(!views) {
      is_root = true;
      views = [];
    }
    if(scope.node instanceof Element) {
      const attr = scope.node.attributes;
      if(attr) {
        let remove: string[] = [];
        let controller: lmvc_controller | undefined;
        for(let i = 0, max = attr.length; i < max; ++i) {
          const item = attr.item(i);
          if(item) {
            const match = view_attr_pattern.exec(item.name);
            if(match && match.index === 0) {
              let name = item.name;
              remove.push(name);
              if(name.startsWith('*')) {
                controller = <lmvc_controller>await this.create_view_instance(name.slice(1));
                scope.view.push(controller);
                controller.$scope = scope;
              }
              else {
                let view = await this.create_view_instance(name);
                scope.view.push(view);
                view.$scope = scope;
              }
            }
          }
        }
        for(let name of remove) {
          attr.removeNamedItem(name);
        }
        if(controller) {
          let node = await $controller.get_controller_html(controller);
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
          this.load_descendants(scope.node, controller, scope, views);
        }
      }
    }
    if(scope.controller) {
      scope.controller.$model = $model.make_model(scope.controller.$model || {});
    }
    if(is_root) {
      await lmvc_app.init_views(views.concat(scope.view));
    }
    return scope;
  }

  private on_mutation(recs: MutationRecord[]) {
    console.debug({ on_mutation: recs });
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
  
  private observer?: MutationObserver;
  root_scope?: lmvc_scope;
  private readonly view: Record<string, __cstor> = {};
}
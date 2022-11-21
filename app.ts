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

  bootstrap(controller: lmvc_controller = { $model: {} }): void | Promise<any> {
    console.assert(!this.root_scope && document.body.parentElement !== null);
    if(document.body.parentElement !== null) {
      this.root_scope = {
        app: this,
        controller,
        model: {},
        node: document.body.parentElement,
        view: [controller]
      };
      return this.load_scope(this.root_scope);
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

  static init_views(scope: lmvc_scope) {
    if(scope.controller) {
    }
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

  protected async load_scope(scope: lmvc_scope, views?: lmvc_view[]) {
    console.debug({scope, views});
    let is_root: true | undefined;
    if(!views) {
      is_root = true;
      views = [];
    }
    if(scope.node instanceof Element) {
      const attr = scope.node.attributes;
      if(attr) {
        let remove: string[] = [];
        for(let i = 0, max = attr.length; i < max; ++i) {
          const item = attr.item(i);
          if(item) {
            const match = view_attr_pattern.exec(item.name);
            if(match && match.index === 0) {
              let name = item.name;
              remove.push(name);
              scope.view.push(await this.create_view_instance(name.startsWith('*') ? name.slice(1) : name));
            }
          }
        }
        for(let name of remove) {
          attr.removeNamedItem(name);
        }
      }
    }
    if(scope.controller) {
      let node = await $controller.get_controller_html(scope.controller);
      if(node instanceof Element && scope.node instanceof Element) {
        if(node.attributes && scope.node.attributes) {
          for(let i = 0, max = scope.node.attributes.length; i < max; ++i) {
            const attr = scope.node.attributes.item(i);
            if(attr) {
              if(!node.hasAttribute(attr.name)) {
                scope.node.attributes.removeNamedItem(attr.name);
                node.attributes.setNamedItem(attr);
                --i;
              }
              else {
                if(attr.name === 'style') {
                  lmvc_app.join_attrib_value('style', node, scope.node, ';');
                }
                else {
                  lmvc_app.join_attrib_value(attr.name, node, scope.node, ' ');
                }
              }
            }
          }
        }
        scope.node.parentNode?.replaceChild(node, scope.node);
        scope.node = node;        
      }
      scope.controller.$model = $model.make_model(scope.controller.$model || {});
      let it = document.createNodeIterator(scope.node, NodeFilter.SHOW_ELEMENT, lmvc_app.node_iterator);
      let wait: Promise<lmvc_scope>[] = [];
      for(let next = <Element>it.nextNode(); next; next = <Element>it.nextNode()) {
        wait.push(this.load_scope({
          app: this,
          model: scope.controller.$model,
          node: next,
          parent: scope,
          view: [],
          controller: scope.controller
        }, views));
      }
      scope.descendant = await Promise.all(wait);
    }
    else {
      scope.descendant = [];
    }
    if(is_root) {
      let wait = <Promise<any>[]>views.concat(scope.view)
        .map(x => typeof x.$init === 'function' ? x.$init() : undefined)
        .filter(x => typeof x === 'object' && typeof x.then === 'function');
      await Promise.all(wait);
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
/* @preserve
  (c) 2019 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { $view } from './view';
import { $controller } from './controller';
import type { __cstor } from 'common/plain-object';
import type { lmvc_controller, lmvc_scope, lmvc_view } from './type';

const view_attr_pattern = /\*?\w[\w\-]*(:\w[\w\-]*){1,}/;

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

  static init_controller(scope: lmvc_scope) {
    if(scope.controller) {
      // let it = document.createNodeIterator(scope.node, NodeFilter.SHOW_ELEMENT, {
      //   acceptNode(node) {
      //     if(node instanceof Element) {
      //       const attr = node.attributes;
      //       if(attr !== undefined && attr.length) {
      //         for(let i = 0, max = attr.length; i < max; ++i) {
      //           const item = attr.item(i);
      //           if(item) {
      //             const match = view_attr_pattern.exec(item.name);
      //             if(match !== null && match.index === 0) {
      //               if(node[view_attr] !== undefined) {
      //                 node[view_attr]!.push(match);
      //               }
      //               else {
      //                 node[view_attr] = [match];
      //               }
      //             }
      //           }
      //         }
      //       }
      //     }
      //     return (<Element>node)[view_attr] === undefined ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
      //   }
      // });
    }
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

  protected async load_scope(scope: lmvc_scope) {
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
              let is_controller = name.startsWith('*');
              if(is_controller) {
                console.assert(!scope.controller, 'multiple controllers detected');
                scope.controller = <lmvc_controller>await this.create_view_instance(name.slice(1));
                scope.view.push(scope.controller);
              }
              else {
                scope.view.push(await this.create_view_instance(name));
              }
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
    }
    let wait = <Promise<any>[]>scope.view
      .map(x => typeof x.$init === 'function' ? x.$init() : undefined)
      .filter(x => typeof x === 'object' && typeof x.then === 'function');
    await Promise.all(wait);
    
  }

  private on_mutation(recs: MutationRecord[]) {
    console.debug({ on_mutation: recs });
  }

  private observer?: MutationObserver;
  root_scope?: lmvc_scope;
  private readonly view: Record<string, __cstor> = {};
}
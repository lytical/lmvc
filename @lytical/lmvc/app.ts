/* @preserve.
  (c) 2019 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { $view } from './view';
import { $controller } from './controller';
import { $model } from './model';
import type { Unsubscribable } from 'rxjs';
import type { __cstor_t } from './plain-object';
import type { lmvc_app_t as lmvc_app_t, lmvc_controller_t, lmvc_router_t, lmvc_scope_t, lmvc_view_t } from './type';

const content_txt = 'l:content';
const template_match: unique symbol = Symbol('l-mvc-template-match');
const view_attr_pattern = /\w[\w\-]*(:\w[\w\-]*){1,}/;

export class lmvc_app implements lmvc_app_t {
  constructor() {
    const html = document.querySelector('html');
    console.assert(html !== null);
    if(html !== null) {
      this.observer = new MutationObserver(x => this.task.then(() => this.on_mutation(x), ex => console.error(ex)));
      this.observer.observe(html, { childList: true, subtree: true });
    }
  }

  async bootstrap(ctlr: lmvc_controller_t = { $model: {}, $view: [] }): Promise<lmvc_controller_t> {
    console.assert(document.body.parentNode !== null);
    if(document.body.parentNode !== null) {
      const views = new Set<lmvc_view_t>();
      views.add(ctlr);
      (<mutable_controller>ctlr).$model = $model.make_model(ctlr.$model || {});
      (<mutable_view>ctlr).$scope = await this.load_scope(document.body.parentNode, ctlr, views);
      lmvc_app.subscribe_to_model(<controller_t>ctlr);
      await $view.init_views(Array.from(views));
      await $view.invoke_method('$mount', this.get_scope_views_self_and_descendant(ctlr.$scope!), x => x.$is_ready === true);
      $model.get_subject(ctlr.$model)?.next();
    }
    return ctlr;
  }

  private async create_views(node: Node) {
    const rt: scope_ctx[] = [];
    let it = document.createNodeIterator(node, NodeFilter.SHOW_ELEMENT, lmvc_app.node_iterator);
    let wait: Promise<any>[] = [];
    for(let next = <Element>it.nextNode(); next; next = <Element>it.nextNode()) {
      const matchs: RegExpExecArray[] = (<any>next)[template_match];
      (<any>next)[template_match] = undefined;
      const item: scope_ctx = {
        node: next,
        view: []
      };
      rt.push(item);
      for(let match of matchs) {
        const create = async () => {
          item.view.push({
            arg: match.input.slice(match[0].length + 1),
            attr: match.input,
            instance: await this.create_view_instance(match[0])
          });
        };
        wait.push(create());
      }
    }
    await Promise.all(wait);
    return rt;
  }

  async create_view_instance(id: string): Promise<lmvc_view_t> {
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

  async destroy_node(node: Node) {
    await Promise.all(this.find_all_scopes(node).map(x => this.destroy_scope(x)));
    if(node.parentElement) {
      node.parentElement.removeChild(node);
    }
  }

  async destroy_scope(scope: lmvc_scope_t) {
    const ls = this.get_scope_self_and_descendant(scope);
    scope.node.parentNode?.removeChild(scope.node);
    if(ls.length) {
      const task: Promise<void>[] = [];
      for(let i = ls.length - 1; i !== -1; --i) {
        for(let v of ls[i].view) {
          if(typeof (<controller_t>v).$sub === 'function') {
            (<controller_t>v).$sub?.unsubscribe();
          }
          if(typeof v.$dispose === 'function') {
            let rs = v.$dispose();
            if(typeof rs === 'object' && typeof rs?.then === 'function') {
              task.push(rs);
            }
          }
        }
      }
      await Promise.all(task);
      while(ls.length) {
        this.scope.splice(this.scope.indexOf(ls.pop()!), 1);
      }
    }
  }

  find_all_scopes(node: Node) {
    const rt: lmvc_scope_t[] = [];
    for(let scope of this.scope) {
      if(node.contains(scope.node) || (scope.view.some(x => (<has_place_holder>x).place_holder && node.contains((<has_place_holder>x).place_holder)))) {
        rt.push(scope);
      }
    }
    return rt;
  }

  find_scope(node: Node) {
    const rt: lmvc_scope_t[] = [];
    for(let scope of this.scope) {
      if(scope.node === node || (scope.view.some(x => (<has_place_holder>x).place_holder === node))) {
        rt.push(scope);
      }
    }
    return rt;
  }

  private get_scope_self_and_descendant(scope: lmvc_scope_t) {
    console.assert(scope !== undefined);
    const rt: lmvc_scope_t[] = [];
    for(let x of this.scope) {
      if(scope.node.contains(x.node)) {
        rt.push(x);
      }
    }
    return rt;
  }

  private get_scope_views_self_and_descendant(scope: lmvc_scope_t) {
    return this
      .get_scope_self_and_descendant(scope)
      .map(x => x.view).reduce((rs, x) => {
        rs.push(...x);
        return rs;
      }, []);
  }

  private invoke_scoped_views(node: Node, method: string, filter = (_: lmvc_view_t) => true): PromiseLike<any> {
    const scope = this.find_all_scopes(node);
    return scope ? $view.invoke_method(method, scope.reduce((rs, x) => {
      rs.push(...x.view);
      return rs;
    }, <lmvc_view_t[]>[]), filter) : Promise.resolve();
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

  async load_scope(node: Node, controller: lmvc_controller_t, views?: Set<lmvc_view_t>): Promise<lmvc_scope_t> {
    const template = node.cloneNode(true);
    if(controller) {
      (<mutable_controller>controller).$model = $model.make_model(controller.$model || {});
      if(!controller.$view) {
        (<mutable_controller>controller).$view = [];
      }
    }
    let is_root: true | undefined;
    if(!views) {
      is_root = true;
      views = new Set<lmvc_view_t>();
    }
    const ctlrs: lmvc_controller_t[] = [];
    const scope = (await this.create_views(node)).map(x => {
      const rt = <lmvc_scope_t>{
        app: this,
        controller,
        node: x.node,
        template: x.node.cloneNode(true),
        view: x.view.map(y => {
          y.instance.$arg = y.arg || undefined;
          y.instance.$value = (<Element>x.node).getAttribute(y.attr) || undefined;
          (<Element>x.node).removeAttribute(y.attr);
          views!.add(y.instance);
          controller.$view.push(y.instance);
          return y.instance;
        })
      };
      for(let x of rt.view) {
        if($controller.is_controller(x)) {
          ctlrs.push(<lmvc_controller_t>x);
        }
        (<mutable_view>x).$scope = rt;
      }
      return rt;
    });
    const rt: lmvc_scope_t = node === scope[0]?.node ? scope[0] : {
      app: this,
      controller,
      node,
      template,
      view: []
    };
    for(let ctlr of ctlrs) {
      (<mutable_controller>ctlr).$model = $model.make_model(ctlr.$model || {});
      let html_node = await $controller.get_controller_html(ctlr);
      if(html_node && Array.isArray(html_node) && html_node.length) {
        if(html_node.length > 1) {
          let lang =
            document.body.lang?.toLowerCase() ||
            document.body.parentElement?.querySelector('meta[http-equiv=content-language]')?.attributes.getNamedItem('content')?.value?.toLowerCase() ||
            document.body.parentElement?.lang?.toLowerCase() ||
            'en';
          let html = html_node.filter(x => (<Element>x).attributes.getNamedItem('lang')?.value === lang);
          if(!html.length) {
            lang = lang.split('-')[0];
            html = html_node.filter(x => (<Element>x).attributes.getNamedItem('lang')?.value === lang);
            if(!html.length) {
              html = html_node.filter(x => (<Element>x).attributes.getNamedItem('lang') === null);
              if(!html.length) {
                console.assert(false, 'unable to identify locale');
                html = [html_node[0]];
              }
            }
          }
          console.assert(html.length === 1);
          html_node = [html[0]];
        }
        const ctlr_node = ctlr.$scope!.node;
        if(html_node[0] instanceof Element && ctlr_node instanceof Element) {
          if(html_node[0].attributes && ctlr_node.attributes) {
            for(let i = 0, max = ctlr_node.attributes.length; i < max; ++i) {
              const attr = ctlr_node.attributes.item(i);
              if(attr) {
                if(!html_node[0].hasAttribute(attr.name)) {
                  ctlr_node.attributes.removeNamedItem(attr.name);
                  html_node[0].attributes.setNamedItem(attr);
                  --i;
                }
                else {
                  if(attr.name === 'style') {
                    lmvc_app.join_attrib_value('style', html_node[0], ctlr_node, ';');
                  }
                  else {
                    lmvc_app.join_attrib_value(attr.name, html_node[0], ctlr_node, ' ');
                  }
                }
              }
            }
          }
          const ni = window.document.createNodeIterator(html_node[0], NodeFilter.SHOW_COMMENT, {
            acceptNode: (child: Comment) => child.textContent?.indexOf(content_txt) === -1 ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT
          });
          for(let content = ni.nextNode(); content; content = ni.nextNode()) {
            const parent = content.parentNode!;
            let sel = content.textContent!;
            sel = sel.slice(sel.indexOf(content_txt) + content_txt.length).trim();
            if(sel) {
              const child: Element[] = [];
              (<Element>ctlr.$scope!.node).querySelectorAll(sel).forEach(x => child.push(x));
              while(child.length) {
                parent.insertBefore(child.shift()!, content);
              }
            }
            else {
              while(ctlr_node.firstChild) {
                parent.insertBefore(ctlr_node.firstChild!, content);
              }
            }
            parent.removeChild(content);
          }
          ctlr_node.parentNode?.replaceChild(html_node[0], ctlr_node);
          ctlr.$scope!.node = html_node[0];
        }
      }
      await this.load_scope(ctlr.$scope!.node, ctlr, views);
      lmvc_app.subscribe_to_model(ctlr);
    }
    if(is_root) {
      await $view.init_views(Array.from(views));
    }
    this.scope.push(...scope);
    return rt;
  }

  static subscribe_to_model(ctlr: controller_t) {
    console.assert(ctlr.$sub === undefined);
    ctlr.$sub = $model.get_subject(ctlr.$model)?.subscribe({
      next: x => {
        const body = window.document.body;
        for(let y of [ctlr!, ...ctlr!.$view].filter(y => typeof y.$model_changed === 'function')) {
          try {
            const node = y.$scope!.node;
            if((body.contains(node) || ((<has_place_holder>y).place_holder && body.contains((<has_place_holder>y).place_holder)))) {
              y.$model_changed!(x);
            }
          }
          catch(ex) {
            console.error(ex);
          }
        }
      }
    });
  }

  private on_mutation(recs: MutationRecord[]) {
    const rt: PromiseLike<any>[] = [];
    /*console.debug({
      added: (recs.reduce((rs, x) => [...rs, x.addedNodes], <any[]>[])),
      removed: (recs.reduce((rs, x) => [...rs, x.removedNodes], <any[]>[]))
    });*/
    for(let x of recs) {
      x.removedNodes.forEach(y => rt.push(this.invoke_scoped_views(y, '$unmount')));
    }
    for(let x of recs) {
      x.addedNodes.forEach(y => rt.push(this.invoke_scoped_views(y, '$mount')));
    }
    return Promise.all(rt);
  }

  register_view(id: string, cstor: Promise<__cstor_t<lmvc_view_t>>) {
    console.assert(this.view[id] === undefined);
    this.view[id] = cstor;
  }

  private static node_iterator = {
    acceptNode(node: Node) {
      const list: RegExpExecArray[] = [];
      if(node instanceof Element) {
        const attr = node.attributes;
        if(attr !== undefined && attr.length) {
          for(let i = 0, max = attr.length; i < max; ++i) {
            const item = attr.item(i);
            if(item) {
              const match = view_attr_pattern.exec(item.name);
              if(match !== null && match.index === 0) {
                list.push(match);
              }
            }
          }
        }
      }
      if(list.length) {
        (<any>node)[template_match] = list;
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    }
  }

  controller?: lmvc_controller_t<any>;
  private observer?: MutationObserver;
  router?: lmvc_router_t;
  private scope: lmvc_scope_t[] = [];
  private task = Promise.resolve();
  private readonly view: Record<string, Promise<__cstor_t<lmvc_view_t>>> = {};
}

interface scope_ctx {
  node: Node;
  view: {
    arg: string;
    attr: string;
    instance: lmvc_view_t
  }[];
}

type controller_t = lmvc_controller_t & { $sub?: Unsubscribable };
type has_place_holder = { place_holder: Comment; };
type mutable_controller = { $model: unknown; $view: lmvc_view_t[]; };
type mutable_view = { $scope?: lmvc_scope_t; };
export default new lmvc_app();
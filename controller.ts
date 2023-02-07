/* @preserve
  (c) 2019 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { $view, view } from './view';
import type { lmvc_controller_metedata_arg } from './type';

export class $controller {
  static async get_controller_html(arg: any) {
    const md = <lmvc_controller_metedata_arg | undefined>$view.get_view_metadata(arg);
    let rs = typeof md?.html === 'function' ? md.html(arg) : md?.html;
    while(rs) {
      if(Array.isArray(rs)) {
        return rs.map(x => x.cloneNode(true));
      }
      if(typeof rs === 'object' && typeof rs.then === 'function') {
        rs = await rs;
      }
      if(typeof rs === 'string') {
        rs = await $controller.load_html(rs);
      }
    }
    return undefined;
  }

  static is_controller(arg: any) {
    return (<lmvc_controller_metedata_arg | undefined>$view.get_view_metadata(arg))?.html !== undefined;
  }

  static async load_html(url: string): Promise<Node[]> {
    let html: string = await import(`text!${url}`);
    if(typeof html !== 'string') {
      console.assert(typeof (<any>html).default === 'string', 'unexpected');
      html = (<any>html).default;
    }
    const root_html = (node: string, idx?: number) => {
      const parent = document.createElement(node);
      parent.innerHTML = html;
      if(parent.childNodes.length > 1) {
        let child = parent.childNodes.item(0);
        if(child instanceof Text && !child.textContent?.trim().length) {
          parent.removeChild(child);
        }
        if(parent.childNodes.length > 1) {
          child = parent.childNodes.item(parent.childNodes.length - 1);
          if(child instanceof Text && !child.textContent?.trim().length) {
            parent.removeChild(child);
          }
        }
      }
      if(typeof idx === 'number') {
        const rt = parent.childNodes.item(idx);
        parent.removeChild(rt);
        return [rt];
      }
      else {
        const rt: Node[] = [];
        parent.childNodes.forEach(x => rt.push(x));
        for(let x of rt) {
          parent.removeChild(x);
        }
        return rt;
      }
    }
    if(body_html_pattern.test(html)) {
      return root_html('html', 1);
    }
    if(head_html_pattern.test(html)) {
      return root_html('html', 0);
    }
    return root_html('div');
  }
}

export function controller(args: lmvc_controller_metedata_arg = { html: null }) {
  if(typeof args.html === 'string') {
    args.html = $controller.load_html(args.html);
  }
  return view(args);
}

const body_html_pattern = /<body[\s>]/;
const head_html_pattern = /<head[\s>]/;
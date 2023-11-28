/* @preserve
  (c) 2020 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { view } from './view';
import obj_util from './obj-util';
import type { lmvc_model_event_t, lmvc_scope_t, lmvc_view_t } from './type';

@view()
export class lmvc_bind implements lmvc_view_t {
  constructor() {
    this.on_input_handler = lmvc_bind.prototype.on_input.bind(this);
  }

  private get_value(et: EventTarget, _format?: string) {
    if(et instanceof HTMLSelectElement) {
      if(et.multiple) {
        const options = et.selectedOptions;
        const rt: string[] = [];
        for(let i = 0, max = options.length; i < max; ++i) {
          rt.push(options.item(i)!.value);
        }
        return rt;
      }
      return et.options.item(et.selectedIndex)!.value;
    }
    return (<HTMLInputElement>et).value;
  }

  private on_input(evt: InputEvent) {
    this.updating = true;
    obj_util.assing(this.get_value(evt.target!, typeof this.$arg === 'string' ? this.$arg : undefined), this.prop!, this.$scope!.controller.$model);
  }

  private set_value(node: Node, value: any) {
    if(node instanceof HTMLSelectElement) {
      if(!Array.isArray(value)) {
        value = [value];
      }
      const options = node.options;
      for(let i = 0, max = options.length; i < max; ++i) {
        const option = options.item(i)!;
        option.selected = (<any[]>value).some(x => x == option.value);
      }
    }
    else {
      (<HTMLInputElement>node).value = value || '';
    }
  }

  $init() {
    if(this.$value) {
      this.prop = this.$value.split('.');
    }
    else {
      console.warn('l:bind missing property name. use l:bind="property_name"');
    }
  }

  $model_changed(_evt: lmvc_model_event_t[]): void {
    if(this.updating) {
      this.updating = undefined;
    }
    else if(document.body.contains(this.$scope!.node)) {
      this.set_value(this.$scope!.node, obj_util.select(this.prop!, this.$scope!.controller.$model));
    }
  }

  $mount() {
    if(this.$value) {
      const node = this.$scope!.node;
      node.addEventListener('input', <(evt: Event) => void>this.on_input_handler);
      this.set_value(node, obj_util.select(this.prop!, this.$scope!.controller.$model));
    }
  }

  $unmount() {
    this.$scope!.node.removeEventListener('input', <(evt: Event) => void>this.on_input_handler);
  }

  $arg?: string;
  $scope?: lmvc_scope_t;
  $value?: string;
  private on_input_handler?: (evt: InputEvent) => void;
  private prop?: string[];
  private updating?: true;
}
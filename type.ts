/* @preserve
  (c) 2019 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import type { __cstor } from 'common/plain-object';
import type { Subscribable } from 'rxjs';

export interface lmvc_app {
  /**
   * @description create an instance of the view specified
   * @param id the identifier of the view.
   */
  create_view_instance(id: string): Promise<lmvc_view>;
  /**
   * @description destroys the specified node by removing the node and disposing all scopes from it and the its descendants.
   * @param node the node to destroy.
   */
  destroy_node(node: Node): Promise<void>;
  /**
   * @description destoy the specified scope by removing the associated node and disposing 
   * @param scope
   */
  destroy_scope(scope: lmvc_scope): Promise<void>;
  /**
   * 
   * @param node 
   */
  find_all_scopes(node: Node): lmvc_scope[];
  /**
   * 
   * @param node 
   */
  find_scope(node: Node): lmvc_scope[];
  /**
   * 
   * @param node 
   * @param controller 
   * @param views 
   */
  load_descendants(node: Node, controller: lmvc_controller, views?: Set<lmvc_view>): Promise<lmvc_scope[]>;
  /**
   * 
   * @param node 
   * @param controller 
   * @param views 
   */
  load_scope(node: Node, controller: lmvc_controller, views?: Set<lmvc_view>): Promise<lmvc_scope>;
  /**
   * 
   * @param id 
   * @param cstor 
   */
  register_view(id: string, cstor: Promise<__cstor<lmvc_view>>): void;
  /**
   * 
   */
  router?: lmvc_router;
}

export interface lmvc_scope<_t_ = lmvc_model> {
  app: lmvc_app;
  args?: string | string[];
  controller: lmvc_controller<_t_>;
  node: Node;
  parent?: lmvc_scope;
  template: Node;
  view: lmvc_view<_t_>[];
}

export interface lmvc_view<_t_ = lmvc_model> {
  /**
   * provides a way to asynchronously complete the creation of the view.
   * this is the first method called after a view's constructor.
   */
  $create?(): PromiseLike<any>;

  /**
   * an optional method that's invoked when the view context instance is being disposed
   */
  $dispose?(): void | Promise<any>;

  /**
   * an optional method to initialize the view context instance.
   * it's called after $create(), if defined.
   */
  $init?(): void | Promise<any>;

  /**
   * an optional method that's invoked after the model has changed.
   */
  $model_changed?(evt: lmvc_model_event[]): void;

  /**
   * an optional method that's invoked when the view instance is placed in the dom.
   * this method may be called more than once for a view instance.
   */
  $mount?(): void | Promise<any>;
  
  /**
   * an optional method that's invoked after all view instances are initialized.
   * the context dom node (ctx.scope.node) can be accessed by all views.
   */
  $ready?(): void | Promise<any>;

  /**
   * an optional method that's invoked when the view instance is removed from the dom.
   * this method may be called more than once for a view instance.
   */
  $unmount?(): void | Promise<any>;

  /**
   * the values provided in the dom attribute name.
   */
  $arg?: unknown;

  /**
   * indicates that the view has been initialized and is ready.
   */
  $is_ready?: true;

  /**
   * the associated scope.
   * this member is available for the entire life, after $create
   */
  $scope?: lmvc_scope<_t_>;

  /**
   * the dom attribute value.
   */
  $value?: unknown;
}

export interface lmvc_controller<_m_ = lmvc_model, _t_ = lmvc_model> extends lmvc_view<_t_> {
  $can_leave?(): boolean | Promise<boolean>;
  $get_title?(): string | Promise<string>;
  $model: _m_;
  $view: lmvc_view<_m_>[];
}

/**
 * a model encapsulates the data and related methods. it is usually created by the controller.
 */
export type lmvc_model = Record<string | number | symbol, unknown>;

/**
 * when a model has been modified, an event is fired and the details of the modification are provided by this instance.
 */
export interface lmvc_model_event {
  /**
   * the model instance that the change has occured.
   */
  model: unknown;
  /**
   * the identifier of the model property that has changed.
   */
  property: string | symbol | number;
  /**
   * the property value prior to the change.
   */
  prev?: unknown;
  /**
   * the property value after the change.
   */
  value: unknown;
}

/**
 * the subject interface of the model, used to subscribe to, and or broadcast model events.
 */
export interface lmvc_model_subject extends Subscribable<lmvc_model_event[]> {
  /**
   * get the underlying object
   */
  get_underlying<_t_ = unknown>(): _t_;
  /**
   * broadcast the provided model event(s) to all subscribers (views).
   */
  next(...msg: lmvc_model_event[]): lmvc_model_event[];
}

export interface lmvc_router extends lmvc_view {
  push(path: string): Promise<boolean>;
  replace(path: string): Promise<boolean>;
}

export interface lmvc_view_metadata_arg {
}

export interface lmvc_controller_metedata_arg extends lmvc_view_metadata_arg {
  html: string | null | Node[] | Promise<Node[]> | ((ctx: lmvc_controller) => Node[] | string | null | Promise<Node[] | string | null>);
  rest?: (string | { id: string, is_optional?: true })[];
}
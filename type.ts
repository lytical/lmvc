/* @preserve
  (c) 2019 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import type { __cstor_t } from 'common/plain-object';
import type { Subscribable } from 'rxjs';

export interface lmvc_app_t {
  /**
   * @description create an instance of the view specified
   * @param id the identifier of the view.
   */
  create_view_instance(id: string): Promise<lmvc_view_t>;
  /**
   * @description destroys the specified node by removing the node and disposing all scopes from it and the its descendants.
   * @param node the node to destroy.
   */
  destroy_node(node: Node): Promise<void>;
  /**
   * @description destoy the specified scope by removing the associated node and disposing 
   * @param scope
   */
  destroy_scope(scope: lmvc_scope_t): Promise<void>;
  /**
   * 
   * @param node 
   */
  find_all_scopes(node: Node): lmvc_scope_t[];
  /**
   * 
   * @param node 
   */
  find_scope(node: Node): lmvc_scope_t[];
  /**
   * 
   * @param node 
   * @param controller 
   * @param views 
   */
  load_scope(node: Node, controller: lmvc_controller_t, views?: Set<lmvc_view_t>): Promise<lmvc_scope_t>;
  /**
   * 
   * @param id 
   * @param cstor 
   */
  register_view(id: string, cstor: Promise<__cstor_t<lmvc_view_t>>): void;
  /**
   * 
   */
  router?: lmvc_router_t;
}

export interface lmvc_scope_t<_t_ = lmvc_model_t> {
  app: lmvc_app_t;
  args?: string | string[];
  readonly controller: lmvc_controller_t<_t_>;
  node: Node;
  template: Node;
  view: lmvc_view_t<_t_>[];
}

export interface lmvc_view_t<_t_ = lmvc_model_t> {
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
  $model_changed?(evt: lmvc_model_event_t[]): void;

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
  readonly $scope?: lmvc_scope_t<_t_>;

  /**
   * the dom attribute value.
   */
  $value?: unknown;
}

export interface lmvc_controller_t<_m_ = lmvc_model_t, _t_ = lmvc_model_t> extends lmvc_view_t<_t_> {
  $can_leave?(): boolean | Promise<boolean>;
  $get_title?(): string | Promise<string>;
  readonly $model: _m_;
  readonly $view: lmvc_view_t<_m_>[];
}

/**
 * a model encapsulates the data and related methods. it is usually created by the controller.
 */
export type lmvc_model_t = Record<string | number | symbol, unknown>;

/**
 * when a model has been modified, an event is fired and the details of the modification are provided by this instance.
 */
export interface lmvc_model_event_t {
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
export interface lmvc_model_subject_t extends Subscribable<lmvc_model_event_t[]> {
  /**
   * get the underlying object
   */
  get_underlying<_t_ = unknown>(): _t_;
  /**
   * broadcast the provided model event(s) to all subscribers (views).
   */
  next(...msg: lmvc_model_event_t[]): lmvc_model_event_t[];
}

export interface lmvc_router_t extends lmvc_view_t {
  push(path: string): Promise<boolean>;
  replace(path: string): Promise<boolean>;
}

export interface lmvc_view_metadata_arg_t {
}

export interface lmvc_controller_metedata_arg_t extends lmvc_view_metadata_arg_t {
  html: string | null | Node[] | Promise<Node[]> | ((ctx: lmvc_controller_t) => Node[] | string | null | Promise<Node[] | string | null>);
  rest?: (string | { id: string, is_optional?: true })[];
}
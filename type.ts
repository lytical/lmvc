/* @preserve
  (c) 2019 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

export interface lmvc_app {
}

export interface lmvc_scope {
  app: lmvc_app;
  args?: string | string[];
  controller: lmvc_controller;
  descendant: lmvc_scope[];
  node: Node;
  view: lmvc_view[];
}

export interface lmvc_view<_t_ = unknown> {
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
   * an optional method that's invoked when the view instance is placed in the dom.
   * this method may be called more than once for a view instance.
   */
  $mount?(): void | Promise<any>;

  /**
   * an optional method that's invoked when the view instance is removed from the dom.
   * this method may be called more than once for a view instance.
   */
  $unmount?(): void | Promise<any>;

  /**
   * an optional method that's invoked after all view instances are initialized.
   * the context dom node (ctx.scope.node) can be accessed by all views.
   */
  $ready?(): void | Promise<any>;

  /**
   * the associated scope.
   * this member is available for the entire life, after $create
   */
  $scope?: lmvc_scope;
}

export interface lmvc_controller<_t_ = unknown> extends lmvc_view<_t_> {
}

export interface lmvc_model {

}
/* @preserve
  (c) 2019 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

export type plain_object_t<_t_ = unknown> = Record<string | number | symbol, _t_>;
export type __cstor_t<_t_ = any> = new (..._: any[]) => _t_;
export interface object_type_t<_t_ = any> extends Function { new(..._: any[]): _t_; }
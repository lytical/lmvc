/* @preserve
  (c) 2023 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

export class future<_t_> {
  constructor() {
    this.p = new Promise<_t_>((res, rej) => {
      this.res = res;
      this.rej = rej;
    });
  }

  reject(error: any) {
    this.rej(error);
  }

  resolve(value: _t_) {
    this.res(value);
  }

  get promise() {
    return this.p;
  }
  
  private rej!: (error: any) => void;
  private res!: (value: _t_ | PromiseLike<_t_>) => void;
  private p: Promise<_t_>;
}
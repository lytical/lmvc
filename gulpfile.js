/*
  (c) 2020 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

const _gulp = require('gulp');
const _lib = require('../common/gulpfile');

exports.post_build = _gulp.parallel(
  () => _lib.pump(_gulp.src('../.obj/lmvc/**'), _gulp.dest('../.dist/.static/lmvc')),
  () => _lib.copy_static_assets('lmvc'));
/*
  (c) 2020 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

const _del = require('del');
const _gulp = require('gulp');
const _pump = require('pump');
const _uglify = require('gulp-uglify-es').default;

exports.post_build = _gulp.series(
  _gulp.parallel
  (
    done => _pump(_gulp.src(['package.json', 'README.md']), _gulp.dest('../.dist'), done),
    done => _pump(_gulp.src('../.dist/**/*.js', { dot: true }), _uglify({ mangle: { keep_fnames: true }, output: { comments: 'some' } }), _gulp.dest('../.dist'), done)
  ),
  done => { _del(['../.dist/*.{map,tsbuildinfo}'], { force: true }); done() }
);
//
// transpile-css.js — PROJECT
// ~/gulp
//

const gulp = require('gulp');
const sass = require('gulp-sass');

sass.compiler = require('sass');

/**
 * @return
 */
exports.transpileCss = function transpileCss() {
	return gulp.src('styles/*.scss')
		.pipe(sass({ /*outputStyle: 'compressed'*/ }).on('error', sass.logError))
		.pipe(gulp.dest('dist/styles'))
}

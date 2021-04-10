//
// transpile-src.js — PROJECT
// ~/gulp
//

const gulp = require('gulp');
const typescript = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const through2 = require('through2');

const tsProject = typescript.createProject('tsconfig.json', {
});

/**
 * Fix imports by adding .js to the file path if it's a relative import
 *
 * @return {function}
 */
const fixImports = () => through2.obj((file, __, cb) => {
	const raw = file.contents.toString();
	const modified = raw.replace(
		/from '\.\.?(?:\/(?:.+?))*\/([^/]+?)'/g,
		(str, name) => {
			if (!name.endsWith('.js')) {
				return str.slice(0, -1) + ".js'";
			} else {
				return str;
			}
		},
	);

	file.contents = Buffer.from(modified);
	cb(null, file);
});

exports.transpileSrc = function transpileSrc() {
	return gulp.src('src/**/*.ts')
		.pipe(sourcemaps.init())
		.pipe(tsProject())
		.pipe(fixImports())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist'))
}

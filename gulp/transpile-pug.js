//
// transpile-pug.js — Vampire 5e
// ~/gulp
//

const gulp = require('gulp');
const pug = require('pug');
const through2 = require('through2');
const path = require('path');

function enhance(filePath, code) {
	const relative = path.relative('.', filePath);
	const parent = '../'.repeat(relative.replace(/\\/g, '/').split('/').length - 1);

	return `
import { tr, editor } from '${parent}system/render-helper.js';

${code}

export default template;
`
}

/**
 * @param {object} options
 */
function transpile(options = {}) {
	return through2.obj((file, enc, cb) => {
		if (file.isBuffer()) {
			options.filename = file.path;
			file.path += '.js';

			try {
				const code = pug.compileClient(file.contents.toString(), options);
				file.contents = Buffer.from(enhance(file.path, code));
			} catch (error) {
				return cb(error);
			}
		}

		cb(null, file);
	});
}

exports.transpilePug = function transpilePug() {
	return gulp.src(['templates/**/*.pug', '!templates/**/*.partial.pug'])
		.pipe(transpile())
		.pipe(gulp.dest('dist/templates'))
}

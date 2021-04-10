//
// transpile-pug.js — Vampire 5e
// ~/gulp
//

const gulp = require('gulp');
const pug = require('pug');
const through2 = require('through2');

function enhance(code) {
	return `
function tr(id, params) {
	if (params) return game.i18n.format(id, params);
	return game.i18n.localize(id);
}

function editor(options) {
	const target = options.target;
	if (!target) throw new Error('You must defined the name of a target field.');
	const owner = !!options.owner;
	const content = TextEditor.enrichHTML(options.content || '', { secrets: owner, entities: true });
	let html = \`<div class="editor-content" data-edit="\${target}">\${content}</div>\`;
	const button = !!options.button;
	const editable = !!options.editable;
	if (button && editable) html += '<a class="editor-edit"><i class="fas fa-edit"></i></a>';
	return \`<div class="editor">\${html}</div>\`;
}

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
				file.contents = Buffer.from(enhance(code));
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

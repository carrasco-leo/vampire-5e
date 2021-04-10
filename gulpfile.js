//
// gulpfile.js — PROJECT
// ~
//

const gulp = require('gulp');

const { clean } = require('./gulp/clean');
const { transpileSrc } = require('./gulp/transpile-src');
const { transpileCss } = require('./gulp/transpile-css');
const { transpilePug } = require('./gulp/transpile-pug');
const { copyLangs, copyPacks, copyTemplates } = require('./gulp/copy-statics');
const { manifest } = require('./gulp/manifest');

const copyStatics = gulp.parallel(copyLangs, copyPacks, copyTemplates);

exports.clean = clean;
exports.build = gulp.series(clean, gulp.parallel(
	transpileSrc,
	transpilePug,
	transpileCss,
	copyStatics,
	manifest,
));
exports.watch = () => {
	const options = { ignoreInitial: false };

	gulp.watch(['src/**/*.ts'], options, transpileSrc);
	gulp.watch(['templates/**/*.pug'], options, transpilePug);
	gulp.watch(['styles/**/*.scss'], options, transpileCss);
	gulp.watch(['packs/*.db', 'langs/*.json', 'templates/**/*.hbs'], options, copyStatics);
	gulp.watch(['config/*.json'], options, manifest);
}

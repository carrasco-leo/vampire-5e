//
// copy-statics.js — PROJECT
// ~/gulp
//

const gulp = require('gulp');

exports.copyLangs = function copyLangs() {
	return gulp.src('langs/*.json', { allowEmpty: true })
		.pipe(gulp.dest('dist/langs'))
}

exports.copyPacks = function copyPacks() {
	return gulp.src('packs/*.db', { allowEmpty: true })
		.pipe(gulp.dest('dist/packs'))
}

exports.copyTemplates = function copyTemplates() {
	return gulp.src('templates/**/*.hbs', { allowEmpty: true })
		.pipe(gulp.dest('dist/templates'))
}

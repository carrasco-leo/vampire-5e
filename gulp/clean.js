//
// clean.js — PROJECT
// ~/gulp
//

const del = require('del');

/**
 * @return {Promise<void>}
 */
exports.clean = function clean() {
	return del(['dist/**']);
}

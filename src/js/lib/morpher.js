var m = require('mithril');

/**
 * Cretes a function that takes in a string and returns a mithril element object.
 *
 * @param  {String}  tagname
 * @param  {Boolean} [trust] Whether strings might contain HTML and should be trusted.
 * @return {Function}
 */
module.exports = function (tagname, trust) {
	return function (str) {
		return m(tagname, trust ? m.trust(str) : str);
	};
};
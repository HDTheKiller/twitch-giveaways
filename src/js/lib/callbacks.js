/**
 * Dynamic callback concatenation.
 * @param  {Function} callback
 * @return {Function}
 */
module.exports = function (callback) {
	var count = 0;
	var done = false;
	return function () {
		count++;
		return function (err) {
			if ((!--count || err) && !done) {
				done = true;
				// ensure next tick execution
				setTimeout(callback.bind(null, err));
			}
		};
	};
};
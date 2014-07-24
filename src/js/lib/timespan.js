var levels = [
	{ key: 'seconds', dur: 1000 },
	{ key: 'minutes', dur: 1000 * 60 },
	{ key: 'hours', dur: 1000 * 60 * 60 },
	{ key: 'days', dur: 1000 * 60 * 60 * 24 }
];

/**
 * Creates an object with time duration properties.
 *
 * @param  {Integer} ms
 * @param  {Integer} [lvls] Duration levels:
 *                            1 - seconds
 *                            2 - seconds+minutes
 *                            3 - seconds+minutes+hours
 *                            4 - seconds+minutes+hours+days
 *                          Default: 4
 * @return {Object}
 */
module.exports = function (ms, lvls) {
	var span = {};
	var lvl = lvls || 4;
	while (lvl--) {
		span[levels[lvl].key] = ms / levels[lvl].dur | 0;
		ms -= span[levels[lvl].key] * levels[lvl].dur;
	}
	return span;
};
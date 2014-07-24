module.exports = function withKey(keys, fn) {
	if (!Array.isArray(keys)) keys = [keys];
	return function (event) {
		var which = event.which || event.keyCode;
		for (var i in keys) if (which === keys[i]) fn(event);
	};
};
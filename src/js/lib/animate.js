module.exports = animate;

function animate(name, delay, duration) {
	return function (el, isInit) {
		if (isInit) return;
		if (delay) {
			el.style.webkitAnimationDelay = delay + 'ms';
			el.style.animationDelay = delay + 'ms';
		}
		if (duration) {
			el.style.webkitAnimationDuration = duration + 'ms';
			el.style.animationDuration = duration + 'ms';
		}
		el.classList.add(name);
		setTimeout(el.classList.remove.bind(el.classList, name), (delay | 0) + (duration || 500));
	};
}
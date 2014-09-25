var e = require('e');
var evt = require('event');
var Tip = require('tooltip');
var query = require('query');

// tga button
var button = module.exports = e('a.tga-button.button.glyph-only', {
	href: 'javascript:void(0)'
}, e('i.tgi.tgi-gift'));

// tooltip
var tip = new Tip('', {
	baseClass: 'tgatip',
	effectClass: 'slide',
	auto: 1
});
evt.bind(button, 'mouseenter', tip.show.bind(tip, button));
evt.bind(button, 'mouseleave', tip.hide.bind(tip));

button.tip = tip;

button.attach = function (container) {
	var target = container || query('.chat-buttons-container');
	if (target) target.appendChild(button);
	return button;
};
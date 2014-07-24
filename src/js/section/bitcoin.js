var m = require('mithril');
var animate = require('../lib/animate');

module.exports = {
	name: 'bitcoin',
	view: view
};

function view() {
	var i = 0;
	return [
		m('figure.bitcoin', [
			m('.qr', {config: animate('slideinleft', 50 * i++)}),
			m('figcaption.address', {config: animate('slideinleft', 50 * i++)}, '1Bc1vcWwzjWsnXQmdLExKnqsb5PVDYAhRj'),
		])
	];
}
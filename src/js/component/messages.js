var m = require('mithril');
var animate = require('../lib/animate');

module.exports = Messages;

function Messages() {
	if (!(this instanceof Messages)) return new Messages();
	var self = this;
	this.store = [];
	this.add = function (type, text) {
		if (arguments.lenght === 1) {
			text = type;
			type = 'info';
		}
		this.store.push({ type: type, text: text });
	};
	this.success = this.add.bind(this, 'success');
	this.info = this.add.bind(this, 'info');
	this.warning = this.add.bind(this, 'warning');
	this.danger = this.add.bind(this, 'danger');
	this.close = function (index) {
		this.store.splice(index, 1);
	};
	this.clear = function () {
		self.store.length = 0;
	};
	this.render = function () {
		return !self.store.length ? null : m('.msgs', self.store.map(function (message, i) {
			return m('.msg.' + message.type, {key: message.text + message.type, config: animate('slideinleft', 50 * i)}, [
				m('span.text', message.text),
				m('span.close', {onclick: self.close.bind(self, i)}, m('i.tgi.tgi-close'))
			]);
		}));
	};
}
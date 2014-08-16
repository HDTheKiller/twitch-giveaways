var m = require('mithril');
var ucFirst = require('to-sentence-case');
var withKey = require('../lib/withkey');
var animate = require('../lib/animate');

module.exports = {
	name: 'index',
	controller: Controller,
	view: view
};

function Controller() {
	var self = this;

	this.cleanEntries = function () {
		for (var i = 0, user; user = self.users[i], i < self.users.length; i++) {
			delete user.keyword;
			delete user.keywordEntries;
		}
		self.updateSelectedUsers();
	};

	this.cancelKeyword = function () {
		self.setter('keyword')('');
		self.cleanEntries();
	};

	this.resetEligible = function () {
		for (var i = 0, user; (user = self.users[i++]);) delete user.eligible;
	};
}

function view(ctrl) {
	var i = 0;
	return [
		m('.controls', [
			m('.block.groups', Object.keys(ctrl.rolling.groups).map(groupToToggle, ctrl)),
			m('ul.block.rolltypes', {config: animate('slideinleft', 50 * i++)}, ctrl.rolling.types.map(typeToTab, ctrl)),
			m('.block.options', [
				tabs[ctrl.rolling.type].view(ctrl),
				m('.option', {key: 'subscriber-luck', config: animate('slideinleft', 50 * i++)}, [
					m('label[for=subscriber-luck]', 'Subscriber luck'),
					m('input[type=range]#subscriber-luck', {
						min: 1,
						max: ctrl.options.maxSubscriberLuck,
						oninput: m.withAttr('value', ctrl.setter('rolling.subscriberLuck').type('number')),
						value: ctrl.rolling.subscriberLuck
					}),
					m('span.meta', ctrl.rolling.subscriberLuck),
					m('p.description', 'Subscribers '
						+ (ctrl.rolling.subscriberLuck > 1
							? 'are ' + ctrl.rolling.subscriberLuck + ' times more likely to win'
							: 'get no special treatment')
						+ '. Details in FAQ.')
				]),
			]),
			m('.block.actions', [
				m('.btn.btn-info.reset', {
					config: animate('slideinleft', 50 * i++),
					onmousedown: withKey(1, ctrl.resetEligible),
					'data-tip': 'Reset eligible status<br><small>Checks all unchecked people.</small>'
				}, [m('i.eligible-icon')]),
				m('.btn.btn-success.roll', {
					config: animate('slideinleft', 50 * i++),
					onmousedown: withKey(1, ctrl.roll)
				}, 'Roll'),
			]),
		]),
		require('../component/support').view(ctrl, 'Support the development<br><small>Please? :)</small>')
	];
}

function groupToToggle(name, i) {
	return m('.btn', {
			class: this.rolling.groups[name] ? 'checked' : '',
			onmousedown: withKey(1, this.setter('rolling.groups.' + name).to(!this.rolling.groups[name])),
			config: animate('slideinleft', 50 * i)
		}, [
			m('i', {class: this.rolling.groups[name] ? 'tgi tgi-check' : 'tgi tgi-close'}),
			ucFirst(name)
	]);
}

function typeToTab(name) {
	return m('li', {
		class: this.rolling.type === name ? 'active' : '',
		onclick: this.setter('rolling.type').to(name),
		'data-tip': tabs[name].tip(this)
	}, ucFirst(name));
}

var tabs = {};

tabs.active = {
	name: 'active',
	tip: function (ctrl) {
		return 'Roll from all active people'
			+ '<br>'
			+ '<small>'
			+ 'People that posted something in a last ' + ctrl.cfg.activeTimeout + ' minutes.'
			+ '</small>';
	},
	view: function () {
		return null;
	}
};

tabs.keyword = {
	name: 'keyword',
	tip: function () {
		return 'Keyword to enter<br><small>Only people who write the keyword will get in the list.</small>';
	},
	view: function (ctrl) {
		return m('.keyword' + (ctrl.keyword ? '.active' : ''), {key: 'keyword', config: animate('slideinleft', 50)}, [
			m('input.word', {
				value: ctrl.keyword,
				placeholder: 'Enter keyword ...',
				oninput: m.withAttr('value', ctrl.setter('keyword')),
				onkeydown: withKey(27, ctrl.cancelKeyword)
			}),
			m('.btn.clean', {
				onmousedown: withKey(1, ctrl.cleanEntries),
				'data-tip': 'Clean all entries<br><small>Makes people enter the keyword again.</small>'
			}, [m('i.tgi.tgi-trash')]),
			m('.btn.cancel', {
				onmousedown: withKey(1, ctrl.cancelKeyword),
				'data-tip': 'Cancel keyword <kbd>ESC</kbd>'
			}, [m('i.tgi.tgi-close')])
		]);
	}
};
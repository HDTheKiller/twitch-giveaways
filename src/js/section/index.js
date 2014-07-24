var m = require('mithril');
var ucFirst = require('to-sentence-case');
var withKey = require('../lib/withkey');
var Messages = require('../component/messages');
var callbacks = require('../lib/callbacks');
var animate = require('../lib/animate');
var channel = require('../lib/channel');
var twitch = require('../lib/twitch');
var e = require('e');

module.exports = {
	name: 'index',
	controller: Controller,
	view: view
};

function eligibleFilter(user) {
	return user.eligible;
}

function Controller(roll) {
	var self = this;
	this.messages = new Messages();

	this.cleanEntries = function () {
		for (var i = 0, user; user = self.users[i], i < self.users.length; i++)
			delete user.keyword;
		self.updateSelectedUsers();
	};

	this.cancelKeyword = function () {
		self.setter('keyword')('');
		self.cleanEntries();
	};

	this.roll = function () {
		if (self.rolling.active) return;
		self.rolling.active = true;
		self.messages.clear();

		var eligible = self.selectedUsers.filter(eligibleFilter);
		if (!eligible.length) {
			self.messages.danger('There are no eligible users.');
			self.rolling.active = false;
			return;
		}

		// clean current winner data
		if (self.winner) {
			delete self.winner.rolledAt;
			delete self.winner.respondedAt;
			delete self.winner.messages;
		}

		// prick random winner from array of eligible users
		var winner = eligible[Math.random() * eligible.length | 0];
		winner.messages = [];
		winner.rolledAt = new Date();
		if (self.cfg.uncheckWinners) winner.eligible = false;
		self.setter('winner')(winner);

		var cbs = callbacks(done);
		var followingDone = cbs();
		var profileDone = cbs();

		// following status
		if (winner.hasOwnProperty('following')) followingDone();
		else twitch.following(winner.id, channel.id).then(setFollowing, setFollowing);

		// profile
		if (winner.hasOwnProperty('profile')) profileDone();
		else twitch.profile(winner.id).then(setProfile, setProfile);

		function setFollowing(res) {
			if (res)
				if (res.channel) winner.following = true;
				else if (res.status === 404) winner.following = false;
			followingDone();
		}

		function setProfile(res) {
			if (res && res.name === winner.id) {
				winner.profile = res;
				if (!res.logo) {
					winner.avatar = null;
					return profileDone();
				}
				// load avatar image
				var avatarLoaded = function () {
					winner.avatar = res.logo;
					profileDone();
				};
				var avatarError = function () {
					winner.avatar = null;
					profileDone();
				};
				e('img', {onload: avatarLoaded, onerror: avatarError, src: res.logo});
			} else {
				profileDone();
			}
		}

		function done() {
			self.rolling.active = false;
			self.section.activate('profile', winner);
			m.redraw();
		}
	};

	this.resetEligible = function () {
		for (var i = 0, user; (user = self.users[i++]);) delete user.eligible;
	};

	// roll immediately when requested
	if (roll) this.roll();
}

function view(ctrl) {
	var i = 0;
	return [
		ctrl.messages.render(),
		m('.block.type', [
			m('ul.rolltypes', {config: animate('slideinleft', 50 * i++)}, ctrl.rolling.types.map(typeToTab, ctrl)),
			m('section.rolltype.' + ctrl.rolling.type, tabs[ctrl.rolling.type].view(ctrl))
		]),
		m('.block.groups', Object.keys(ctrl.rolling.groups).map(groupToToggle, ctrl).concat(
			m('.btn.subscribers-only' + (ctrl.rolling.subscribersOnly ? '.checked' : ''), {
					config: animate('slideinleft'),
					onmousedown: withKey(1, ctrl.setter('rolling.subscribersOnly').to(!ctrl.rolling.subscribersOnly))
				}, [
					m('i', {class: ctrl.rolling.subscribersOnly ? 'tgi tgi-check' : 'tgi tgi-close'}),
					'Subscribers only'
			])
		)),
		m('.block.actions', [
			m('.btn.btn-info.reset', {
				config: animate('slideinleft', 50 * i++),
				onmousedown: withKey(1, ctrl.resetEligible),
				'data-tip': 'Reset eligible status<br><small>Checks all unchecked people.</small>'
			}, [m('i.eligible-icon')]),
			m('.btn.btn-success.roll' + (ctrl.rolling.active ? '.loading' : ''), {
				config: animate('slideinleft', 50 * i++),
				onmousedown: withKey(1, ctrl.roll)
			}, [m('span.legend', 'Roll'), m('span.spinner')]),
		]),
		m('.spacer'),
		m('.support', [
			m('h2.divider', 'Support the development'),
			m('.options', [
				m('a.paypal', {
					href: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=AWZ2ZX5T3MF42',
					target: '_blank',
					config: animate('slideinleft', 50 * i++)
				}, [m('i.tgi.tgi-paypal'), 'Paypal']),
				m('a.bitcoin', {
					href: '#',
					onmousedown: ctrl.toSection('bitcoin'),
					config: animate('slideinleft', 50 * i++)
				}, [m('i.tgi.tgi-bitcoin'), 'Bitcoin'])
			])
		])
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
		return m('.keyword-input' + (ctrl.keyword ? '.active' : ''), {config: animate('slideinleft', 50)}, [
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
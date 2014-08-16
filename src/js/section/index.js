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

function Controller(roll) {
	var self = this;
	this.messages = new Messages();

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

	this.roll = function () {
		if (self.rolling.active) return;
		self.rolling.active = true;
		self.messages.clear();

		var pool = [];
		var subLuck = self.rolling.subscriberLuck;
		for (var i = 0, j, user; user = self.selectedUsers[i], i < self.selectedUsers.length; i++) {
			if (!user.eligible) continue;
			if (user.subscriber && subLuck > 1)
				for (j = 0; j < subLuck; j++) pool.push(user);
			else pool.push(user);
		}

		if (!pool.length) {
			self.messages.danger('There is none to roll from.');
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
		var winner = pool[Math.random() * pool.length | 0];
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
				m('.btn.btn-success.roll' + (ctrl.rolling.active ? '.loading' : ''), {
					config: animate('slideinleft', 50 * i++),
					onmousedown: withKey(1, ctrl.roll)
				}, [m('span.legend', 'Roll'), m('span.spinner')]),
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
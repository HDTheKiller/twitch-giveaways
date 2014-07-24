var m = require('mithril');
var timespan = require('../lib/timespan');
var animate = require('../lib/animate');
var chat = require('../lib/chat');
var throttle = require('throttle');

module.exports = {
	name: 'profile',
	controller: Controller,
	view: view
};

function Controller(user) {
	var self = this;
	this.user = user;

	// messages scrolling config : keeps the scrollbar at the end when new messages arrive
	this.messagesScrolling = function (el, isInit, ctx) {
		if (!isInit) {
			ctx.sync = function () {
				ctx.top = el.scrollTop;
				ctx.scrollHeight = el.scrollHeight;
				ctx.clientHeigh = el.clientHeight;
				ctx.atEnd = el.scrollTop > el.scrollHeight - el.clientHeight - 30;
			};
			ctx.toEnd = function () {
				el.scrollTop = el.scrollHeight - el.clientHeight;
			};
			ctx.change = throttle(function () {
				if (ctx.atEnd) ctx.toEnd();
				ctx.sync();
			}, 100);
			ctx.message = function (message) {
				if (message.user.name === self.user.name) ctx.change();
			};
			window.addEventListener('resize', ctx.change);
			el.addEventListener('scroll', ctx.sync);
			chat.on('message', ctx.message);
			ctx.onunload = function () {
				window.removeEventListener('resize', self.messagesSync);
				el.removeEventListener('scroll', ctx.sync);
				chat.off('message', ctx.message);
			};
			ctx.toEnd();
			return;
		}
		ctx.change();
	};

	// clock
	var clockID;
	if (!self.user.respondedAt) clockID = setInterval(clock, 1000);
	function clock() {
		if (self.user.respondedAt) clearInterval(clockID);
		m.redraw();
	}

	this.onunload = function () {
		clearInterval(clockID);
	};
}

function view(ctrl) {
	var i = 0;
	var user = ctrl.user;
	var following = user.following;
	var subscriber = user.subscriber;
	var elapsed = timespan(user.respondedAt ? user.respondedAt - user.rolledAt : new Date() - user.rolledAt, 2);
	return [
		m('.card', [
			m('.lead', [
				m('.emblem', {config: animate('rotatein', 0, 600)}, [
					user.avatar ? m('img', {src: user.avatar}) : m('i.tgi.tgi-user')
				]),
				m('aside.middle', [
					m('.meta', {
							class: 'color-' + (following ? 'success' : following === false ? 'light' : 'warning'),
							config: animate('slideinright', 200),
							'data-tip': following == null
								? 'Couldn\'t be determined<br><small>Connection issues, or twitch api down?</small>'
								: ''
						}, [
							'Following', m('i.tgi.tgi-' + (following ? 'check' : following === false ? 'close' : 'help'))
					]),
					m('.meta', {class: 'color-' + (subscriber ? 'success' : 'light'), config: animate('slideinleft', 200)}, [
						m('i.tgi.tgi-' + (subscriber ? 'check' : 'close')), 'Subscribed'
					])
				]),
				m('aside.lower', [
					m('.action.sliding', {onmousedown: ctrl.toSection('index', true), config: animate('slideinright', 300)}, [
						m('span.name', 'Roll again'),
						m('i.tgi.tgi-reload')
					]),
					m('a.action.sliding', {href: user.messageURL, target: '_blank', config: animate('slideinleft', 300)}, [
						m('i.tgi.tgi-envelope'),
						m('span.name', 'Send message')
					])
				])
			]),
			m('.title', {config: animate('slideintop', i++ * 50 + 200)}, [
				m('h1', [m('a', {href: user.profileURL, target: '_blank'}, user.name)])
			])
		]),
		m('.messages', [
			m('h2.title', {config: animate('slideinleft', i++ * 50 + 200)}, [
				m('span.name', {'data-tip': 'Messages since being rolled.'}, [
					m('i.tgi.tgi-speech-bubble'),
					' Messages ',
					m('span.count', user.messages.length)
				]),
				m('span.clock' + (user.respondedAt ? '.paused' : ''),
					{'data-tip': 'Response time<br><small>Time between roll and first message.</small>'},
					[
						m('span.minutes', elapsed.minutes),
						m('span.colon', ':'),
						m('span.seconds', String('00' + elapsed.seconds).substr(-2)),
					]
				)
			]),
			m('ul.list.fadein', {config: ctrl.messagesScrolling}, user.messages.slice(-100).map(messageToLi, ctrl))
		])
	];
}

function messageToLi(message) {
	var user = this.user;
	var elapsed = timespan(message.time - user.respondedAt, 2);
	return m('li', [
		m('span.time', elapsed.minutes + ':' + String('00' + elapsed.seconds).substr(-2)),
		m('span.content', m.trust(message.html))
	]);
}
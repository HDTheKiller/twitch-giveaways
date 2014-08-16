var m = require('mithril');
var extend = require('extend');
var ucFirst = require('to-sentence-case');
var closest = require('closest');
var throttle = require('throttle');
var withKey = require('../lib/withkey');
var escapeRegexp = require('escape-regexp');

var userlist = module.exports = {
	name: 'userlist',
	controller: Controller,
	view: view
};

userlist.defaults = {
	itemSize: 30
};

var groups = require('../model/user').groups;

function Controller(users, options) {
	var self = this;
	extend(this, userlist.defaults, options);

	this.users = m.prop(users);
	this.scrollTop = 0;
	this.limit = Math.ceil(window.innerHeight / this.itemSize);

	this.scroll = function () {
		self.scrollTop = this.scrollTop;
	};

	this.toggleUser = function (event) {
		var target = closest(event.target, '[data-id]', true, this);
		var id = target && target.dataset.id;
		if (!id) return;
		var user = self.users().get(id);
		if (user) user.eligible = !user.eligible;
	};

	this.syncHeight = function (element, isInit, ctx) {
		if (isInit) return;
		var resize = throttle(function () {
			updateLimit();
			m.redraw();
		}, 300);
		window.addEventListener('resize', resize);
		ctx.onunload = unload;
		updateLimit();
		function updateLimit() {
			self.limit = Math.ceil(element.clientHeight / self.itemSize) + 1;
		}
		function unload() {
			window.removeEventListener('resize', resize);
		}
	};
}

function view(ctrl) {
	var users = ctrl.users();
	var start = Math.max(Math.min(ctrl.scrollTop / ctrl.itemSize | 0, users.length - ctrl.limit), 0);
	var end = Math.min(start + ctrl.limit, users.length);
	return m('.userlist', {
			onscroll: ctrl.scroll,
			onmousedown: withKey(1, ctrl.toggleUser),
			config: ctrl.syncHeight
		}, [
		m('ul', {
			style: {
				height: (users.length * ctrl.itemSize) + 'px',
				paddingTop: (start * ctrl.itemSize) + 'px'
			}
		}, users.slice(start, end).map(userToLi, {
			query: ctrl.searchQuery ? new RegExp('(' + escapeRegexp(ctrl.searchQuery) + ')', 'i') : null
		}))
	]);
}

function userToLi(user) {
	var icon = groups[user.group].icon;
	return m('li', {key: user.id, class: user.eligible ? 'checked' : '', 'data-id': user.id}, [
		m('span.eligible'),
		m('span.name', this.query
			? m.trust(user.name.replace(this.query, '<span class="query">$1</span>'))
			: user.name),
		user.subscriber ? m('i.tgi.tgi-star.subscriber', {'data-tip': 'Subscriber', 'data-tip-place': 'right'}) : null,
		icon ? m('i.tgi.tgi-' + icon + '.' + user.group, {'data-tip': ucFirst(user.group), 'data-tip-place': 'right'}) : null
	]);
}
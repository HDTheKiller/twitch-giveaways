var m = require('mithril');
var ucfirst = require('to-sentence-case');
var animate = require('../lib/animate');
var morpher = require('../lib/morpher');
var extend = require('extend');
var withKey = require('../lib/withkey');

module.exports = {
	name: 'changelog',
	controller: Controller,
	view: view
};

function Controller() {
	this.releases = require('tga/data/changelog.json').map(formatRelease);
	// mark this version as read
	if (this.isNewVersion) {
		this.setter('isNewVersion')(false);
		this.setter('cfg.lastReadChangelog')(this.version);
	}
}

function formatRelease(release, i) {
	release = extend(true, {}, release);
	release.collapsed = m.prop(i > 0);
	return release;
}

var toLI = morpher('li', true);
var toP = morpher('p', true);

function view(ctrl) {
	return ctrl.releases.map(function (release, i) {
		var description = [];
		if (!release.collapsed()) {
			if (release.description) description = description.concat(release.description.map(toP));
			['new', 'changed', 'fixed', 'removed'].forEach(function (name) {
				if (!release[name]) return;
				description.push(m('h2.changestype.' + name, ucfirst(name)));
				description.push(m('ul.' + name, release[name].map(toLI)));
			});
		}
		return m('article.release', {config: animate('slideinleft', 50 * i)}, [
			m('h1.version', {
				onmousedown: withKey(1, release.collapsed.bind(null, !release.collapsed()))
			}, [
				release.version,
				m('small', release.date),
				m('.spacer'),
				m('i.tgi.tgi-chevron-' + (release.collapsed() ? 'down' : 'up'))
			]),
			description.length ? m('.description.fadein', description) : null
		]);
	});
}
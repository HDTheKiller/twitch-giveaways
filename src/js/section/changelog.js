var m = require('mithril');
var ucfirst = require('to-sentence-case');
var animate = require('../lib/animate');
var morpher = require('../lib/morpher');

module.exports = {
	name: 'changelog',
	controller: Controller,
	view: view
};

function Controller() {
	this.releases = require('tga/data/changelog.json');
	// mark this version as read
	if (this.isNewVersion) {
		this.setter('isNewVersion')(false);
		this.setter('cfg.lastReadChangelog')(this.version);
	}
}

var toLI = morpher('li', true);
var toP = morpher('p', true);

function view(ctrl) {
	return ctrl.releases.map(function (release, i) {
		var lists = [];
		['new', 'changed', 'fixed', 'removed'].forEach(function (name) {
			if (!release[name]) return;
			lists.push(m('h2.changestype.' + name, ucfirst(name)));
			lists.push(m('ul.' + name, release[name].map(toLI)));
		});
		return m('article.release', {config: animate('slideinleft', 50 * i)}, [
			m('h1.version', [
				release.version,
				m('small', release.date)
			]),
			!release.description ? null : release.description.map(toP)
		].concat(lists));
	});
}
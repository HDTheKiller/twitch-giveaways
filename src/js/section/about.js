var m = require('mithril');
var animate = require('../lib/animate');
var morpher = require('../lib/morpher');

module.exports = {
	name: 'about',
	controller: Controller,
	view: view
};

function Controller() {
	this.version = require('tga/data/changelog.json')[0];
	this.faqs = require('tga/data/faq.json');
}

var lineToP = morpher('p', true);

function view(ctrl) {
	return [
		m('.card', [
			m('.title', {config: animate('slideintop', 100)}, [
				m('h1', [
					m('a', {
						href: 'https://chrome.google.com/webstore/detail/twitch-giveaways/poohjpljfecljomfhhimjhddddlidhdd',
						target: '_blank'
					}, 'Twitch Giveaways')
				])
			]),
			m('.lead', [
				m('.emblem', {config: animate('slideintop')}, [m('i.tgi.tgi-tga')]),
				m('aside.middle', [
					m('.meta', {config: animate('slideinright', 50)}, [m('h3', ctrl.version.version)]),
					m('.meta', {config: animate('slideinleft', 50)}, [m('em', ctrl.version.date)])
				]),
				m('aside.lower', [
					m('a.action', {href: 'https://github.com/darsain/twitch-giveaways', target: '_blank', config: animate('slideinright', 150)}, [
						m('span.name', 'Repository'),
						m('i.tgi.tgi-github')
					]),
					m('a.action', {href: 'https://twitter.com/darsain', target: '_blank', config: animate('slideinleft', 150)}, [
						m('i.tgi.tgi-twitter'),
						m('span.name', 'Author')
					])
				])
			])
		]),
		m('fieldset.faq', [
				m('legend', {config: animate('fadein', 100)}, 'Frequently Asked Questions')
			].concat(ctrl.faqs.map(function (faq, i) {
				return m('article.qa', {config: animate('slideinleft', 50 * i + 100)}, [
					m('h1.question', m.trust(faq.question))
				].concat(faq.answer.map(lineToP)));
		})))
	];
}
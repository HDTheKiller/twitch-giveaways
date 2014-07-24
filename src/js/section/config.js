var m = require('mithril');
var animate = require('../lib/animate');
var withKey = require('../lib/withkey');

module.exports = {
	name: 'config',
	controller: Controller,
	view: view
};

function formatIngoreListItem(item) {
	return String(item).trim().replace(' ', '').toLowerCase();
}

function Controller() {
	var self = this;
	this.updateIgnoreList = function (list) {
		self.setter('cfg.ignoreList')(list.split('\n').map(formatIngoreListItem));
	};
}

function view(ctrl) {
	var i = 0;
	return [
		// active timeout
		m('article.option.active-timeout', {config: animate('slideinleft', 50 * i++)}, [
			m('label[for=cfg-active-timeout]', 'Active timeout:'),
			m('input[type=range]#cfg-active-timeout', {
				min: 1,
				max: 60,
				oninput: m.withAttr('value', ctrl.setter('cfg.activeTimeout').type('number')),
				value: ctrl.cfg.activeTimeout
			}),
			m('span', ctrl.cfg.activeTimeout), ' ', m('em', 'min'),
			m('p.description', 'Time since last message, after which users are no longer considered active and removed from the list.')
		]),
		// uncheck winners
		m('article.option.uncheck-winners', {config: animate('slideinleft', 50 * i++)}, [
			m('label', {onmousedown: withKey(1, ctrl.setter('cfg.uncheckWinners').to(!ctrl.cfg.uncheckWinners))}, 'Uncheck winners:'),
			m('i', {
				class: 'checkbox tgi ' + (ctrl.cfg.uncheckWinners ? 'tgi-check checked' : 'tgi-close'),
				onmousedown: withKey(1, ctrl.setter('cfg.uncheckWinners').to(!ctrl.cfg.uncheckWinners))
			}),
			m('p.description', 'When enabled, winners are automatically unchecked to not win twice.')
		]),
		// keyword antispam
		m('article.option.keyword-antispam', {config: animate('slideinleft', 50 * i++)}, [
			m('label', {onmousedown: withKey(1, ctrl.setter('cfg.keywordAntispam').to(!ctrl.cfg.keywordAntispam))}, 'Keyword antispam:'),
			m('i', {
				class: 'checkbox tgi ' + (ctrl.cfg.keywordAntispam ? 'tgi-check checked' : 'tgi-close'),
				onmousedown: withKey(1, ctrl.setter('cfg.keywordAntispam').to(!ctrl.cfg.keywordAntispam))
			}),
			m('p.description', 'People who enter keyword more than once are automatically unchecked.')
		]),
		// ignore list
		m('article.option.ignore-list', {config: animate('slideinleft', 50 * i++)}, [
			m('label[for=cfg-ignore-list]', [
				'Ignore list:',
				m('p.description', 'Separate usernames with new lines.')
			]),
			m('textarea#cfg-ignore-list', {
				placeholder: 'enter names here',
				oninput: m.withAttr('value', ctrl.updateIgnoreList),
				value: ctrl.cfg.ignoreList.join('\n')
			}),
		]),
		// display tooltips
		m('article.option.display-tooltips', {config: animate('slideinleft', 50 * i++)}, [
			m('label', {onmousedown: withKey(1, ctrl.setter('cfg.displayTooltips').to(!ctrl.cfg.displayTooltips))}, 'Display tooltips:'),
			m('i', {
				class: 'checkbox tgi ' + (ctrl.cfg.displayTooltips ? 'tgi-check checked' : 'tgi-close'),
				onmousedown: withKey(1, ctrl.setter('cfg.displayTooltips').to(!ctrl.cfg.displayTooltips))
			}),
			m('p.description', 'Hide tooltips if you already know what is what.')
		]),
	];
}
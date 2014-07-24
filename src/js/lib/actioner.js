'use strict';

var extend = require('extend');
var events = require('events');
var type = require('type');

module.exports = Actioner;

function Actioner (scope, container, options) {
	if (!(this instanceof Actioner)) {
		return new Actioner(scope, container, options);
	}
	this.scope = scope;
	this.container = container;
	this.events = events(container, this);
	this.options = extend({}, Actioner.defaults, options);
	this.actions = {};
	for (var i = 0; i < this.options.events.length; i++) {
		this.events.bind(this.options.events[i] + ' [data-' + this.options.key + ']', 'handle');
	}
}

Actioner.prototype.add = function add (name, fn) {
	this.actions[name] = fn || name;
};

Actioner.prototype.remove = function remove (name) {
	delete this.actions[name];
};

Actioner.prototype.has = function has (name) {
	return !!this.actions[name];
};

Actioner.prototype.handle = function handle (event) {
	var element = event.delegateTarget;
	var data = element.dataset;
	var name = data.action;
	if (this.has(name)) {
		if (element.tagName === 'A') {
			event.preventDefault();
		}
		this.trigger(name, data, element);
	}
};

Actioner.prototype.trigger = function trigger (name, data, element) {
	var action = this.actions[name];
	switch (type(action)) {
		case 'function':
			break;
		case 'string':
			action = this.scope[action];
			break;
		default:
			action = false;
	}
	if (action) {
		action.call(this.scope, data, element);
	}
};

Actioner.defaults = {
	key: 'action',
	events: ['click']
};
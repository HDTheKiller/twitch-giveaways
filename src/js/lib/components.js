var extend = require('extend');
var slice = require('sliced');
var constructorApply = require('constructor-apply');

module.exports = Components;

function Components(ctx) {
	if (!(this instanceof Components)) return new Components(ctx);
	this.ctx = ctx;
	this.store = {};
}

var proto = Components.prototype;

/**
 * Adds a component into instance.
 *
 * Component looks like:
 *   {
 *     name: 'name', // optional
 *     controller: constructorFunction, // optional
 *     view: viewFunction
 *   }
 *
 * Examples:
 *   #use('name', foo)
 *   #use(bar)         // when component has a `name` property
 *   #use('bar2', bar) // using same component twice
 *   #use(baz, arg1, argN) // passing arguments to component constructor
 *
 * @param  {String} [name]
 * @param  {Object} component
 * @param  {Mixed}  [arg1, ..., argN]
 * @return {Components}
 */
proto.use = function (name, component) {
	var args;
	if (typeof name !== 'string') {
		args = slice(arguments, 1);
		component = name;
		name = component.name;
	} else args = slice(arguments, 2);
	if (!name || typeof name !== 'string') throw new Error('Invalid component name.');
	if (this.has(name)) throw new Error('Component "' + name + '" already exists.');
	// save custom component object
	component = extend({ name: name, args: args }, component);
	// set up to inherit from parent component
	if (component.controller) component.controller.prototype = this.ctx;
	this.add(name, component);
	return this;
};

proto.add = function (name, component) {
	this.store[name] = component;
	return this;
};

proto.get = function (name) {
	return this.store[name];
};

proto.has = function (name) {
	return name in this.store;
};

proto.load = function (name) {
	var component = this.get(name);
	if (!component.instance && component.controller) {
		var args = component.args.slice();
		args.push(component.data);
		component.instance = constructorApply(component.controller, args);
	}
};

proto.unload = function (name, callback) {
	var component = this.get(name);
	var instance = component && component.instance;
	if (instance && typeof instance.onunload === 'function') {
		if (instance.onunload.length) {
			instance.unloading = true;
			instance.onunload(unloaded);
		} else {
			instance.onunload();
			unloaded();
		}
	} else unloaded();
	function unloaded() {
		component.instance = null;
		if (callback) callback();
	}
};

proto.remove = function (name) {
	this.unload(name);
	return delete this.store[name];
};

proto.destroy = function () {
	for (var key in this.store) this.remove(key);
	delete this.store;
};

proto.render = function (name) {
	var component = this.get(name);
	if (!component) throw new Error('Component "' + name + '" doesn\'t exist.');
	this.load(name);
	return component.view(component.instance || this.ctx);
};
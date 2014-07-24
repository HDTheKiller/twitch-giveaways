var m = require('mithril');
var inherit = require('inherit');
var Components = require('./components');

module.exports = Section;

function Section(ctx) {
	if (!(this instanceof Section)) return new Section(ctx);
	Components.call(this, ctx);
	this.active = 'index';
}

inherit(Section, Components);

var proto = Section.prototype;

proto.activate = function (name, data) {
	var self = this;
	if (!this.has(name)) throw new Error('Section "' + name + '" doesn\'t exist.');
	var currentActive = this.active;
	// update active section
	this.active = name;
	// update data argument when passed
	if (arguments.length > 1) this.get(name).data = data;
	// abort when unloading already in progress
	if (this.unloading) return this;
	// unload previous section
	var async = false;
	this.unloading = true;
	this.unload(currentActive, unloaded);
	async = true;
	function unloaded() {
		self.unloading = false;
		if (async) m.redraw();
	}
	return this;
};

proto.isActive = function (name) {
	return this.active === name;
};

proto.activator = function (name, data) {
	var self = this;
	return function (event) {
		if (event && event.preventDefault) event.preventDefault();
		self.activate(name, data);
	};
};

proto.render = function () {
	return Components.prototype.render.call(this, this.active);
};
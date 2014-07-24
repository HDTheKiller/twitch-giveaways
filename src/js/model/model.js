var extend = require('extend');

module.exports = Model;

function Model() {}

var proto = Model.prototype;

proto.extend = function (props) {
	return typeof props === 'object' ? extend(true, this, props) : this;
};
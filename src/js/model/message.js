var Model = require('./model');
var inherit = require('inherit');

module.exports = Message;

/**
 * User model constructor.
 *
 * @param {String} name
 */
function Message(string) {
	Model.call(this);
	this.time = new Date();
	this.html = string;
}

inherit(Message, Model);
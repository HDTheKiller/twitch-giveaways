var Model = require('./model');
var inherit = require('inherit');
var twitch = require('../lib/twitch');
var twitchURL = 'http://twitch.tv';

module.exports = User;

/**
 * User model constructor.
 *
 * @param {String} name
 */
function User(props) {
	Model.call(this);
	this.extend(props);
	this.id = User.getID(this);
	this.channelURL = twitchURL + '/' + this.id;
	this.profileURL = this.channelURL + '/profile';
	this.messageURL = twitchURL + '/message/compose?to=' + this.id;
	this.lastMessage = new Date();
}

inherit(User, Model);

var proto = User.prototype;
var mProto = Model.prototype;

proto.group = 'user';
proto.subscriber = false;
proto.eligible = true;

/**
 * Extracts group & subscriber status from badges.
 *
 * @param  {Array} badges
 * @return {User}
 */
proto.decoration = function (badges) {
	if (!badges || !badges.length) return this;
	for (var i = 0; i < badges.length; i++)
		if (badges[i] === 'subscriber') this.subscriber = true;
		else if (User.isGroup(badges[i])) this.group = badges[i];
	return this;
};

/**
 * Extend current model with new data.
 *
 * @param  {Object} props
 * @return {User}
 */
proto.extend = function (props) {
	if (props && props.badges) {
		this.decoration(props.badges);
		delete props.badges;
	}
	return mProto.extend.call(this, props);
};

User.isGroup = function (group) {
	return group in User.groups;
};

/**
 * Returns an ID for a user object.
 *
 * @param  {Object} props
 * @return {String}
 */
User.getID = function (props) {
	return props.id || twitch.toID(props.name);
};

User.groups = {
	broadcaster: {
		order: 1,
		icon: 'broadcaster'
	},
	staff: {
		order: 2,
		icon: 'twitch'
	},
	admin: {
		order: 3,
		icon: 'shield-full'
	},
	moderator: {
		order: 4,
		icon: 'shield-empty'
	},
	user: {
		order: 5,
		icon: null
	}
};
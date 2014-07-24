var ODB = require('../lib/odb');
var User = require('./user');

module.exports = Users;

function Users() {
	return new ODB(User, {
		orderFn: orderFn
	});
}

function orderFn(a, b) {
	// order by groups
	if (User.groups[a.group].order !== User.groups[b.group].order)
		return User.groups[a.group].order < User.groups[b.group].order ? -1 : 1;
	// order by subscribers
	// if (a.subscriber !== b.subscriber) return a.subscriber ? -1 : 1;
	// order alphabetically
	return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

Users.ignoredGroups = [
	'broadcaster'
];
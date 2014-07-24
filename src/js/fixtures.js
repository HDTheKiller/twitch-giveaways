var chance = new require('chance')();
var q = require('query');
var e = require('e');
var ucfirst = require('to-sentence-case');
var withKey = require('./lib/withkey');
var dumbo = {};

module.exports = fix;

/**
 * Populates the chat with set lines of messages by set amount of users.
 *
 * Examples:
 *   fix(10) // 10 messages by users from `fix.population` array
 *   fix(10) // another 10 messages by the same users from `fix.population` array
 *   fix(20, 10) // 20 messages by 10 uniquely generated users
 *   fix(20, 10) // 20 messages by 10 completely new uniquely generated users
 *
 * `fix.population` array is populated with 100 users on load. You can repopulate it with `fix.populate(count)`.
 *
 * @param {Integer}       [messages] Default: 100
 * @param {Integer|Array} [users]    Array of users, or a number of unique users to generate.
 */
function fix(messages, users) {
	var population;
	if (typeof users === 'object') {
		population = users;
	} else {
		users = users | 0;
		population = users ? fix.users(users) : fix.population;
	}
	if (population !== fix.population) fix.i = 0;
	messages = messages | 0 || population.length;
	function loop () {
		if (--messages) setTimeout(loop, 10);
		fix.line(population[fix.i++ % population.length]);
	}
	loop();
}

// variables & settings
fix.container = q('.chat-room .tse-content');
fix.scroller = fix.container.parentElement;
fix.i = 0;
fix.maxLines = 100;
fix.population = [];
fix.groups = [
	'moderator',
	'admin',
	'staff',
	'broadcaster'
];

/**
 * Returns a boolean on chance.
 *
 * @param  {Ingeter} chance Chance in percents.
 * @return {Boolean}
 */
fix.chance = function (chance) {
	return Math.random() * 100 < chance;
};

/**
 * Returns a random badges based on their rarity.
 *
 * You can specify rarity with chances argument:
 *   fix.badges({
 *     group: 20, // 20% chance for an admin, moderator, staff, or broadcaster badge
 *                // groups themselves have a rarity, where moderator is the most common, and broadcaster the least
 *     subscriber: 20, // 20% chance for a subscriber badge
 *     turbo: 20 // 20% chance for a turbo badge. Note: Twitch Giveaways ignores this badge.
 *   });
 *
 * @param  {Object} [chances] Object with chances for:
 *                              group - chance for admin, staff, moderator, or broadcaster badge (default: 20)
 *                              subscriber - chance for a subscriber badge (default: 20)
 *                              turbo - chance for a turbo badge (default: 20)
 * @return {String}
 */
fix.badges = function (chances) {
	chances = chances || dumbo;
	var badges = [];
	if (fix.chance(chances.group || 20)) badges.push(fix.groups[Math.pow(Math.random(), 5) * fix.groups.length | 0]);
	if (fix.chance(chances.subscriber || 20)) badges.push('subscriber');
	if (fix.chance(chances.turbo || 20)) badges.push('turbo');
	return badges;
};

/**
 * Generates a random user object.
 *
 * Supported signatures:
 *   fix.user(name)
 *   fix.user(name, badges)
 *   fix.user(badges)
 *   fix.user(name, chances)
 *   fix.user(chances)
 *
 * @param  {String} [name]
 * @param  {Array}  [badges]
 * @param  {Object} [chances] Object with chances for group, subscriber and turbo badges.
 * @return {Object}
 */
fix.user = function (name, badges, chances) {
	if (typeof badges === 'object' && !Array.isArray(badges)) {
		chances = badges;
		badges = null;
	}
	if (Array.isArray(name)) {
		badges = name;
		name = null;
	} else if (typeof name === 'object') {
		chances = name;
		name = null;
	}
	name = name || chance.first() + chance.last();
	return {
		id: name.toLowerCase(),
		name: name,
		badges: badges || fix.badges(chances)
	};
};

/**
 * Generates an array of random users.
 *
 * @param  {Integer} [count] Default: 100
 * @return {Array}
 */
fix.users = function (count) {
	count = count | 0 || 100;
	var users = [];
	for (var i = 0; i < count; i++) users.push(fix.user());
	return users;
};

/**
 * Adds a line to the chat.
 *
 * @param {Object} [user]    When omitted, it'll get someone from `fix.population`.
 * @param {String} [message]
 */
fix.line = function (user, message) {
	if (typeof user === 'string') {
		message = user;
		user = null;
	}
	if (!user) user = fix.popUser();
	var time = new Date();
	fix.container.appendChild(e('.ember-view.chat-line', [
		e('.indicator'),
		e('span.timestamp', time.getHours() + ':' + time.getMinutes()),
		e('span.badges', user.badges.map(function (badge) {
			return e([
				e('span.badge-container.tooltip', { title: ucfirst(badge) }, e('.badge.' + badge)),
				' '
			]);
		})),
		e('span.from', user.name),
		e('span.colon', ':'), ' ',
		e('span.message', message || chance.sentence({ words: Math.round(Math.random() * 15 + 5) }))
	]));
	// remove lines overflowing maxLines setting
	while (fix.container.children.length > fix.maxLines)
		fix.container.removeChild(fix.container.children[0]);
	// scroll to the bottom
	fix.scroller.scrollTop = fix.scroller.scrollHeight - fix.scroller.clientHeight;
};

/**
 * Re-populates the `fix.population` pool with number of random users.
 *
 * @param {Integer} [count] Default: 100
 */
fix.repop = function (count) {
	fix.population = fix.users(count);
};

/**
 * Find user from `fix.population` by their user name.
 * Case insensitive, finds 1st matching part of a needle.
 *
 * @param  {String} [needle]
 * @return {Object}
 */
fix.popFind = function (needle) {
	if (!needle) return;
	needle = String(needle).trim().toLowerCase();
	var i = fix.population.length;
	var user;
	while ((user = fix.population[--i]))
		if (~user.name.toLowerCase().indexOf(needle)) return user;
};

fix.popUser = function () {
	return fix.population[Math.random() * fix.population.length | 0];
};

// Pre-populate the `fix.population` pool.
fix.repop();

// make textarea useful
var evt = require('event');
var textarea = q('.chat-interface textarea');
var submit = q('.chat-interface .send-chat-button .button');
var msgHistory = localStorage.msgHistory ? JSON.parse(localStorage.msgHistory) : [];
var historyIndex = msgHistory.length;

evt.bind(textarea, 'keydown', withKey(13, post));
evt.bind(textarea, 'keydown', withKey(38, prevMsg));
evt.bind(textarea, 'keydown', withKey(40, nextMsg));
evt.bind(submit, 'mousedown', withKey(1, post));

/**
 * Posts a line from textarea.
 *
 * Line can be prefixed with username, like so:
 *   foo:my message
 *
 * post() will than find first user whose name contains `foo` and post the message as him.
 *
 * @param  {Event} event
 */
function post(event) {
	event.preventDefault();
	var message = String(textarea.value).trim();
	// action
	var words = message.split(' ');
	var action = actions[words[0]];
	if (action) {
		action.apply(null, words.slice(1));
	} else {
		// posting
		var parts = message.split(':');
		var user, name;
		if (parts.length > 1) {
			name = parts.shift().trim();
			user = fix.popFind(name);
			if (!user) {
				user = fix.user(name);
				fix.population.push(user);
			}
		} else {
			user = fix.popUser();
		}
		// post line
		var text = parts.join(':').trim();
		fix.line(user, text);
	}
	// reset textarea
	textarea.value = '';
	// add message to history
	if (message && msgHistory[msgHistory.length-1] !== message) {
		msgHistory = msgHistory.slice(0, historyIndex);
		msgHistory.push(message);
		saveHistory();
	}
	historyIndex = Math.min(historyIndex + 1, msgHistory.length);
}

function prevMsg(event) {
	event.preventDefault();
	historyIndex = Math.max(historyIndex - 1, 0);
	textarea.value = msgHistory[historyIndex] || '';
}

function nextMsg(event) {
	event.preventDefault();
	historyIndex = Math.min(historyIndex + 1, msgHistory.length);
	textarea.value = msgHistory[historyIndex] || '';
}

function saveHistory() {
	localStorage.msgHistory = JSON.stringify(msgHistory);
}

// text actions
var actions = {
	fix: fix,
	repop: fix.repop,
	clear: function () {
		msgHistory = [];
		historyIndex = 0;
		saveHistory();
	}
};
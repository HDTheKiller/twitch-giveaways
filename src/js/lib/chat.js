var emitter = require('emitter');
var query = require('query');
var slice = require('sliced');
var closest = require('closest');
var chatContainer = query('.chat-room .chat-lines');
var User = require('../model/user');

if (!chatContainer) return false;

var chat = module.exports = {};

emitter(chat);

// chat messages observer
var chatObserver = new MutationObserver(function processMutations(mutations) {
	var addedNodes, i, l, node, line, name, message;
	for (var m = 0, ml = mutations.length; m < ml; m++) {
		addedNodes = mutations[m].addedNodes;
		for (i = 0, l = addedNodes.length; i < l; i++) {
			node = addedNodes[i];
			line = closest(node, '.chat-line', true, chatContainer);
			if (!line) continue;
			name = query('.from', line);
			name = name && name.textContent.trim();
			if (!name) continue;
			if (query('.deleted', line)) continue;
			message = query('.message', line).innerHTML.trim();
			chat.emit('message', {
				user: {
					name: name,
					badges: slice(query.all('.badge', line)).map(getGroups).filter(filterFalsy),
				},
				html: message,
				time: new Date()
			});
		}
	}
});

function getGroups(el) {
	for (var i = 0; i < el.classList.length; i++)
		if (User.groups.hasOwnProperty(el.classList[i]) || ~User.badges.indexOf(el.classList[i]))
			return el.classList[i];
}

function filterFalsy(group) {
	return group;
}

// start observing mutations on chat messages
chatObserver.observe(chatContainer, { childList: true });
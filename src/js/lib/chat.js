var emitter = require('emitter');
var query = require('query');
var slice = require('sliced');
var closest = require('closest');
var chatContainer = query('.chat-room .tse-content');

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
			if (!name) continue;
			if (query('.deleted', line)) continue;
			name = name.textContent.trim();
			message = query('.message', line).innerHTML.trim();
			chat.emit('message', {
				user: {
					name: name,
					badges: slice(query.all('.badge', line)).map(getGroups),
				},
				html: message,
				time: new Date()
			});
		}
	}
});

function getGroups(el) {
	for (var i = 0; i < el.classList.length; i++)
		if (el.classList[i] !== 'badge') return el.classList[i];
}

// start observing mutations on chat messages
chatObserver.observe(chatContainer, { childList: true });
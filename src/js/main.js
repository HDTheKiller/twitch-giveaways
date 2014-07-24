/*global console */

// get environment variables
var env = require('./env');

if (env.development) window.log = console.log.bind(console);

// load modules
var twitch = require('./lib/twitch');
var channel = require('./lib/channel');
var chat = require('./lib/chat');
var evt = require('event');

// expose globals for debugging
window.env = env;
window.twitch = twitch;
window.channel = channel;

// abort when channel or chat couldn't be initialized
if (!channel) return console.error('Twitch Giveaways: Channel profile couldn\'t be loaded.');
if (!chat) return console.error('Twitch Giveaways: Chat interface couldn\'t be loaded.');

var e = require('e');
var query = require('query');
var Tip = require('tooltip');
var TGA = require('./tga');
var throttle = require('throttle');

// inject tga styles
var styles = e('link', {
	id: 'twitch-giveaways-styles', // be nice & identify ourselves
	rel: 'stylesheet',
	type: 'text/css',
	href: env.chrome ? chrome.extension.getURL('content.css') : '/build/content.css',
	media: 'all'
});
query('head').appendChild(styles);

// initiate tga when styles loaded
styles.onload = function () {
	// create tga container
	var container = e('.tga');
	document.body.insertBefore(container, document.body.firstChild);

	// tga button
	var button = e('a.tga-button.button.glyph-only', {
		href: 'javascript:void(0)',
		title: 'Twitch Giveaways'
	}, e('i.tgi.tgi-gift'));
	query('.chat-option-buttons').appendChild(button);

	// disable button for small screens
	var buttonTip = new Tip('', {
		baseClass: 'tgatip',
		effectClass: 'slide',
		auto: 1
	});

	evt.bind(button, 'mouseover', buttonTip.show.bind(buttonTip, button));
	evt.bind(button, 'mouseout', buttonTip.hide.bind(buttonTip));
	evt.bind(window, 'resize', throttle(winResize, 100));

	winResize();

	function winResize() {
		if (window.innerWidth < TGA.options.minWindowWidth) {
			buttonTip.content('Twitch Giveaways<br><small>Window has to be at least <strong>' + TGA.options.minWindowWidth + '</strong> pixels wide.</small>');
			buttonTip.type('error');
			button.classList.add('disabled');
		} else {
			buttonTip.content('Twitch Giveaways');
			buttonTip.type();
			button.classList.remove('disabled');
		}
	}

	// initialize tga
	var tga = TGA.init(container);
	button.addEventListener('click', tga.toggle);

	// expose globals for debugging
	window.tga = tga;

	// automatically open giveaways in development environment
	if (env.development) tga.open();
};
var twitch = require('./lib/twitch');
var evt = require('event');
var throttle = require('throttle');

var lastPath = window.location.pathname;
function onLocationChange(callback) {
	if (window.location.pathname === lastPath) return;
	lastPath = window.location.pathname;
	callback();
}

require('./boot/styles').onload = function () {
	var pageType = twitch.pageType();
	var tga = pageType === 'chat' ? require('./boot/tga') : null;
	var button = require('./boot/button');
	var tip = button.tip;
	var isFrame = window !== window.parent;
	var runsIn = ['channel', 'chat'];
	var tgaWindows = {};

	// button does different things in different situations:
	// channel page : pops out the chat with TGA already open
	// chat page
	//   - window width > 800 : opens TGA
	//   - window width < 800
	//     - top window    : displays warning tooltip asking to resize the window
	//     - inside iframe : pops out chat window with TGA already open

	// update button state on window resize
	evt.bind(window, 'resize', throttle(updateButtonState, 100));
	// update button state on  location.pathname change
	setInterval(onLocationChange.bind(null, updateButtonState), 1000);
	// set initial button state
	updateButtonState();

	function updateButtonState() {
		var pageType = twitch.pageType();
		var channelID = window.location.pathname.match(/^\/([^\/]+)/i)[1];
		if (~runsIn.indexOf(pageType)) button.attach();
		if (tga && window.innerWidth < tga.options.minWindowWidth) {
			tip.content(
				isFrame
					? 'Twitch Giveaways'
						+ '<br>'
						+ '<small>'
							+ 'This chat is too small to accommodate the UI. '
							+ 'Clicking this will pop it out and open Giveaways there.'
						+ '</small>'
					: 'Twitch Giveaways'
						+ '<br>'
						+ '<small>'
							+ 'Stretch the width of the window to accommodate the UI. '
							+ 'Has to be at least '
							+ '<strong>' + tga.options.minWindowWidth + '</strong> '
							+ 'pixels wide.'
						+ '</small>'
			);
			tip.type('error');
			button.classList[isFrame ? 'remove' : 'add']('disabled');
			button.onclick = !isFrame ? tga.toggle : popout.bind(null, channelID);
		} else {
			tip.type();
			tip.content(
				tga
				? 'Twitch Giveaways'
				: 'Twitch Giveaways'
					+ '<br>'
					+ '<small>'
						+ 'Works only in popped out or embedded chat. This will pop it out & open Giveaways.'
					+ '</small>'
			);
			button.classList.remove('disabled');
			button.onclick = tga ? tga.toggle : popout.bind(null, channelID);
		}
	}

	function popout(id) {
		var loc = window.location;
		tgaWindows[id] = tgaWindows[id] && !tgaWindows[id].closed ? tgaWindows[id] : window.open(
			loc.origin + '/' + id + '/chat?opentga=1',
			'twitch-giveaways-' + id,
			'left=100,top=100,width=1000,height=600'
		);
		tgaWindows[id].focus();
	}
};
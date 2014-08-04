var env = require('../env');
var e = require('e');
var query = require('query');

var link = module.exports = e('link', {
	id: 'twitch-giveaways-styles', // be nice & identify ourselves
	rel: 'stylesheet',
	type: 'text/css',
	media: 'all',
	href: env.chrome ? chrome.extension.getURL('content.css') : '/build/content.css'
});

// inject tga styles
query('head').appendChild(link);
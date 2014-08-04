var env = require('../env');
var e = require('e');
var TGA = require('../component/tga');

// create tga container
var container = e('.tga');
document.body.insertBefore(container, document.body.firstChild);

// initialize tga
var tga = module.exports = TGA.init(container);

// automatically open giveaways when requested or in development environment
if (~window.location.search.indexOf('opentga=1') || env.development) tga.open();
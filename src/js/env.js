var env = exports;
try {
	env.chrome = chrome && chrome.extension;
} catch(err) {
	env.chrome = false;
}
env.production = env.chrome;
env.development = !env.production;
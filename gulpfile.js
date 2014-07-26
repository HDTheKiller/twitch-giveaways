/*jshint node:true */
var gulp = require('gulp');
var livereload = require('gulp-livereload');

// tasks config
var argv = require('minimist')(process.argv.slice(2), { alias: {
	port: 'p',
	production: 'P',
	type: 't'
}});
var destination = 'build';

// exit with a correct code
var errorOccurred = false;
process.once('exit', function (code) {
	if (errorOccurred && code === 0) process.exit(1);
});

/**
 * Error handler.
 * @param  {Error} err
 */
function handleError(err) {
	var gutil = require('gulp-util');
	var maxStackLines = 10;
	errorOccurred = true;
	if (err.name && err.stack)
		err = gutil.colors.red(err.plugin + ': ' + err.name + ': ') +
			gutil.colors.bold.red(err.message) +
			'\n' + err.stack.replace(err.message, '').split('\n').map(shortenLine).slice(0, maxStackLines).join('\n');
	gutil.log(err);
	if (this.emit) this.emit('end');
}

function shortenLine(line) {
	var max = 80;
	return line.length > 80
		? line.substr(0, max * 0.6 | 0) + '{...}' + line.substr(-max * 0.4 | 0)
		: line;
}

/**
 * Dynamic callback concatenation.
 * @param  {Function} callback
 * @return {Function}
 */
function callbacks(callback) {
	var count = 0;
	var done = false;
	return function () {
		count++;
		return function (err) {
			if ((!--count || err) && !done) {
				done = true;
				callback(err);
			}
		};
	};
}

function stylesStream() {
	return contentStylesStream();
}

function contentStylesStream() {
	var stylus = require('gulp-stylus');
	var autoprefixer = require('gulp-autoprefixer');
	var minifyCSS = require('gulp-minify-css');
	var rename = require('gulp-rename');
	var gulpif = require('gulp-if');
	return gulp.src('src/styl/main.styl')
		.pipe(stylus({ errors: false })).on('error', handleError)
		.pipe(rename('content.css'))
		.pipe(autoprefixer('last 2 Chrome versions')).on('error', handleError)
		.pipe(gulpif(argv.production, minifyCSS({ noAdvanced: true })));
}

function scriptsStream() {
	return contentScriptsStream();
}

function contentScriptsStream() {
	var resolve = require('component-resolver');
	var Builder = require('component-build');
	var gulpif = require('gulp-if');
	var uglify = require('gulp-uglify');
	var File = require('vinyl');
	var stream = new require('stream').Readable({ objectMode: true });
	var done = false;
	stream._read = function () {
		if (done) return stream.push(null);
		resolve('.', { development: !argv.production }, build);
	};
	function build(err, tree) {
		done = true;
		if (err) return stream.emit('error', err);
		new Builder(tree, {
			autorequire: true,
			development: !argv.production
		}).scripts(pushFile);
	}
	function pushFile(err, string) {
		if (err) return stream.emit('error', err);
		stream.push(new File({
			cwd: '/',
			base: '/',
			path: '/content.js',
			contents: new Buffer(string)
		}));
	}
	return stream.on('error', handleError)
		.pipe(gulpif(argv.production, uglify()));
}

function iconFontStream() {
	var svgfont = require('gulp-svgicons2svgfont');
	var svg2ttf = require('gulp-svg2ttf');
	var ttf2woff = require('gulp-ttf2woff');
	return gulp.src('src/icon/*.svg')
		.pipe(svgfont({
			fontName: 'icons',
			normalize: true,
			// centerHorizontally: true
		}))
		.on('error', handleError)
		.pipe(svg2ttf())
		.on('error', handleError)
		.pipe(ttf2woff())
		.on('error', handleError);
}

function assetsStream() {
	return gulp.src(['manifest.json', 'src/img/**/*']);
}

gulp.task('assets', function () {
	return assetsStream().pipe(gulp.dest(destination)).pipe(livereload({ auto: false }));
});

gulp.task('icons', function () {
	return iconFontStream().pipe(gulp.dest(destination)).pipe(livereload({ auto: false }));
});

gulp.task('icons:serialize', function (cb) {
	var fs = require('fs');
	var path = require('path');
	var consolidate = require('gulp-consolidate');
	var iconsDir = 'src/icon';
	var iconsTemplate = 'template/icons.styl';
	var stylModules = 'src/styl/module';
	var cbs = callbacks(cb);

	fs.readdir(iconsDir, processFiles);

	function processFiles(err, files) {
		if (err) return handleError(err);
		var icons = files.filter(onlysvg).map(describe).sort(byName).map(addCodepoints);
		icons.forEach(renameFile);
		generateStyl(icons);
	}
	function onlysvg(filename) { return filename.substr(-4) === '.svg'; }
	function byName(a, b) { return a.name < b.name ? -1 : 1; }
	function describe(filename) {
		return {
			filename: filename,
			name: filename.replace(/(^ue[a-f\d]{3}-)|(\.svg$)/gi, '')
		};
	}
	function addCodepoints(file, i) {
		file.codepoint = 57345 + i;
		file.character = file.codepoint.toString(16);
		return file;
	}
	function renameFile(icon) {
		var filename = 'u' + icon.character + '-' + icon.name + '.svg';
		if (filename === icon.filename) return;
		else fs.rename(path.join(iconsDir, icon.filename), path.join(iconsDir, filename), cbs());
	}
	function generateStyl(icons) {
		gulp.src(iconsTemplate)
			.pipe(consolidate('swig', {
				name: 'icons',
				glyphs: icons
			}))
			.on('error', handleError)
			.pipe(gulp.dest(stylModules))
			.on('end', cbs());
	}
});

gulp.task('clean', function (cb) {
	require('rimraf')(destination, cb);
});

gulp.task('scripts:content', function () {
	return contentScriptsStream().pipe(gulp.dest(destination)).pipe(livereload({ auto: false }));
});

gulp.task('scripts', ['scripts:content']);

gulp.task('styles:content', function () {
	return contentStylesStream().pipe(gulp.dest(destination)).pipe(livereload({ auto: false }));
});

gulp.task('styles', ['styles:content']);

gulp.task('build', ['clean'], function () {
	gulp.start('assets', 'icons', 'scripts', 'styles');
});

gulp.task('bump', function () {
	var bump = require('gulp-bump');
	var type = argv.type ? argv.type : 'patch';
	var isType = ~['major', 'minor', 'patch'].indexOf(type);
	return gulp.src('manifest.json')
		.pipe(bump(isType ? { type: type } : { version: type }))
		.pipe(gulp.dest('.'));
});

gulp.task('package', function () {
	var version = require('./manifest.json').version;
	var streamqueue = require('streamqueue');
	var zip = require('gulp-zip');
	argv.production = true;
	return streamqueue({ objectMode: true },
		assetsStream(),
		iconFontStream(),
		scriptsStream(),
		stylesStream()
	).pipe(zip('tga-' + version + '.zip')).pipe(gulp.dest('.'));
});

gulp.task('release', ['bump'], function () {
	gulp.start('package');
});

gulp.task('serve', function () {
	var gutil = require('gulp-util');
	var http = require('http');
	var ecstatic = require('ecstatic');
	var port = argv.port || 8080;
	http.createServer(ecstatic({ root: __dirname })).listen(port);
	gutil.log('Serving:', gutil.colors.magenta('http://localhost:' + port + '/test/chat'));
	gulp.start('watch');
});

gulp.task('watch', function () {
	livereload.listen();
	gulp.watch(['manifest.json', 'src/img/**/*'], ['assets']);
	gulp.watch(['component.json', 'data/*.json', 'src/js/**/*.js'], ['scripts']);
	gulp.watch('src/styl/**/*.styl', ['styles']);
});

gulp.task('default', ['build'], function () {
	gulp.start('serve');
});
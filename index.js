const { writeFileSync, readFileSync, existsSync, readdirSync, statSync } = require('fs');
const { join, dirname, extname, delimiter } = require('path');
const { spawn, execSync } = require('child_process');
const chokidar   = require('chokidar');
const livereload = require('livereload');
process.env.path += delimiter + './node_modules/.bin';

colors();
const log = console.log;
const args = process.argv.slice(2);

if (args.length) {
	args.includes('uk') ? runUikit() :
	undefined;
} else {
	watch('public/**/style.scss', runSass);
	watch('public/**/style.css', runRtlcss);
	watch('public/**/_tmpl/**/*', runTemp);
	//watchFile('public/_common/uikit/uikit-theme.scss', runUikit);
	live();
}
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// sass
function runSass(w=true) {
	const entries = getFiles('./public', ['style.scss$', '!_common', '!lib']);
	let err;
	entries.forEach(entry => {
		const outFile = join(dirname(entry), './_built/', 'style.css');
		spawn(`sass ${entry}:${outFile}`, [w?'--watch':''], {shell:true,stdio:'inherit'});
	});
	log('Ran sass.'.green);
}
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// rtlcss
function runRtlcss() {
	const entries = getFiles('./public', ['style.css$', '!_common', '!lib']);
	for (const entry of entries) {
		const outFile = join(dirname(entry), './', 'style-rtl.css');
		spawn(`rtlcss ${entry} ${outFile}`, {shell:true,stdio:'inherit'});
	}
	log('Ran rtlcss.'.green);
}
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// uikit theme
function runUikit() {
	// execSync('sass public/_common/uikit/uikit-theme.scss | rtlcss --stdin public/_common/uikit/uikit-rtl.css');
	execSync('sass public/_common/uikit/uikit-theme.scss:public/_common/uikit/uikit.css');
	execSync('rtlcss public/_common/uikit/uikit.css public/_common/uikit/uikit-rtl.css');
}
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// templates
function runTemp() {
	const entries = getDirs('./public', '_tmpl$');
	
	entries.forEach(entry => {
		if ( !existsSync(entry) ) return;
		let str = 'const _templates = {};\n';
		getFiles(entry).forEach(file => {
			const key = file.replace(entry, '').replace(/\\/g, '/').replace(extname(file), '').replace(/^\//, '');
			str += "_templates['"+key+"'] = function (c={}) { return `"+ readFileSync(file, 'utf8') + "` };\n";
		});
		writeFileSync(join(entry, '../_built/', 'templates.js'), str);
	});
	log('Ran templates.'.green);
}
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// livereload
function live() {
	const port = existsSync('.livereload') && readFileSync('.livereload', 'utf8').match(/:(\d+)\/livereload.js\?snipver=1/)[1];
	const lrserver = livereload.createServer({
		extraExts : ['htm'],
		...port && {port}
	});
	
	lrserver.watch(
		[
			'public/**/*.html',
			'public/**/*.htm',
			'public/css/**/*.css',
			'public/js/**/*.js'
		].map( i => join(__dirname, i) )
	);
	log('livereload started...'.magentaB);
}
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// util
function watch(path, fn, init=true) {
	init && fn();
	const watcher = chokidar.watch(path).on('ready', () => {
		watcher
			.on('add',       () => fn())
			.on('addDir',    () => fn())
			.on('unlink',    () => fn())
			.on('unlinkDir', () => fn())
			.on('change',    () => fn());
		log('Watching...'.magentaB, path.whiteB);
	});
}
function watchFile(path, fn, init=true) {
	init && fn();
	const options = {
		awaitWriteFinish: {
			stabilityThreshold: 100,
			pollInterval: 100
		}
	};
	const watcher = chokidar.watch(path, options).on('ready', () => {
		watcher.on('change', () => fn());
		log('Watching...'.magentaB, path.whiteB);
	});
}
function getFiles(dir, patterns=[], res=[]) {
	if ( !existsSync(dir) ) return res;
	if (typeof patterns === 'string') patterns = [patterns];
	const files = readdirSync(dir);
	for (const file of files) {
		const path = join(dir, file);
		const stats = statSync(path);
		if ( stats.isDirectory() ) {
			getFiles(path, patterns, res);
		} else {
			if (patterns.length) {
				const invalid = patterns.map(i => i[0] === '!'
					? !new RegExp(i.slice(1)).test(path)
					: new RegExp(i).test(path)).filter(i=>!i).length;
				if (!invalid) res.push(path);
			} else {
				res.push(path);
			}
		}
	}
	return res;
}
function getDirs(dir, patterns=[], res=[]) {
	if (typeof patterns === 'string') patterns = [patterns];
  const items = readdirSync(dir);
  for (const i of items) {
    const path = join(dir, i);
    const stats = statSync(path);
    if ( stats.isDirectory() ) {
			if (patterns.length) {
				const invalid = patterns.map(i => i[0] === '!'
					? !new RegExp(i.slice(1)).test(path)
					: new RegExp(i).test(path)).filter(i=>!i).length;
				if (!invalid) res.push(path);
			} else {
				res.push(path);
			}
      getDirs(path, patterns, res);
    }
  }
	return res;
}
function colors() {
	[
		['red',      31],
		['green',    32],
		['yellow',   33],
		['magenta',  35],
		['redB',     91],
		['greenB',   92],
		['magentaB', 95],
		['whiteB',   97],
	].forEach(([k, n]) => {
		String.prototype.__defineGetter__(k, function () {
			return `[${n}m${this}[0m`;
		});
	});
}
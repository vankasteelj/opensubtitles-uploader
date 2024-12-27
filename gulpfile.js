'use strict';

/******** 
 * setup *
 ********/
const nwVersion = '0.76.0',
    flavor = 'sdk',
    availablePlatforms = ['linux32', 'linux64', 'win32', 'osx64'],
    releasesDir = 'build';

/*************** 
 * dependencies *
 ***************/
const gulp = require('gulp'),
    glp = require('gulp-load-plugins')(),
    runSequence = require('run-sequence'),
    nwBuilder = require('nw-builder'),
    del = require('del'),
    yargs = require('yargs'),
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    pkJson = require('./package.json'),
    modClean = require('modclean').ModClean;

const { detectCurrentPlatform } = require("nw-builder/dist/index.cjs");
const currentPlatform = () => { return detectCurrentPlatform(process) };

/***********
 *  custom  *
 ***********/
// returns an array of platforms that should be built
const parsePlatforms = () => {
    const requestedPlatforms = (yargs.argv.platforms || currentPlatform()).split(','),
        validPlatforms = [];

    for (let i in requestedPlatforms) {
        if (availablePlatforms.indexOf(requestedPlatforms[i]) !== -1) {
            validPlatforms.push(requestedPlatforms[i]);
        }
    }

    // for osx and win, 32-bits works on 64, if needed
    if (availablePlatforms.indexOf('win64') === -1 && requestedPlatforms.indexOf('win64') !== -1) {
        validPlatforms.push('win32');
    }
    if (availablePlatforms.indexOf('osx64') === -1 && requestedPlatforms.indexOf('osx64') !== -1) {
        validPlatforms.push('osx32');
    }

    // remove duplicates
    validPlatforms.filter((item, pos) => {
        return validPlatforms.indexOf(item) === pos;
    });

    return requestedPlatforms[0] === 'all' ? availablePlatforms : validPlatforms;
};


/************* 
 * gulp tasks *
 *************/
// start app in development
gulp.task('run', () => {
    return new Promise((resolve, reject) => {
        let platform = parsePlatforms()[0],
            bin = path.join('cache', nwVersion + '-' + flavor, platform);

        // path to nw binary
        switch (platform.slice(0, 3)) {
        case 'osx':
            bin += '/nwjs.app/Contents/MacOS/nwjs';
            break;
        case 'lin':
            bin += '/nw';
            break;
        case 'win':
            bin += '/nw.exe';
            break;
        default:
            reject(new Error('Unsupported %s platform', platform));
        }

        console.log('Running %s from cache', platform);

        // spawn cached binary with package.json, toggle dev flag
        const child = spawn(bin, ['.', '--development']);

        // nwjs console speaks to stderr
        child.stderr.on('data', (buf) => {
            console.log(buf.toString());
        });

        child.on('close', (exitCode) => {
            console.log('%s exited with code %d', pkJson.name, exitCode);
            resolve();
        });

        child.on('error', (error) => {
            if (error.code === 'ENOENT') {
                // nw binary most probably missing
                console.log('%s is not available in cache. Try running `gulp build` beforehand', platform);
            }
            reject(error);
        });
    });
});

// remove unused libraries
gulp.task('clean:nwjs', () => {
    return Promise.all(parsePlatforms().map((platform) => {
        let dirname = path.join(releasesDir, pkJson.name, platform);
        return del([
            dirname + '/pdf*',
            dirname + '/chrome*',
            dirname + '/nacl*',
            dirname + '/pnacl',
            dirname + '/payload*',
            dirname + '/nwjc*',
            dirname + '/credit*',
            dirname + '/debug*',
            dirname + '/swift*',
            dirname + '/notification_helper*',
            dirname + '/d3dcompiler*'
        ]);
    }));
});

// default is help, because we can!
gulp.task('default', () => {
    console.log([
        '\nBasic usage:',
        ' gulp run\tStart the application in dev mode',
        ' gulp build\tBuild the application',
        ' gulp dist\tCreate a redistribuable package',
        '\nAvailable options:',
        ' --platforms=<platform>',
        '\tArguments: ' + availablePlatforms + ',all',
        '\tExample:   `grunt build --platforms=all`',
        '\nUse `gulp --tasks` to show the task dependency tree of gulpfile.js\n'
    ].join('\n'));
});

// download and compile nwjs
gulp.task('nwjs', () => {
    const nwOptions = {
        files: ['./app/**', './package.json', './README.md', './node_modules/**'],
        buildDir: releasesDir,
        appName: pkJson.name,
        appVersion: pkJson.version,
        zip: false,
        version: nwVersion,
        flavor: flavor,
        platforms: parsePlatforms()
    };

    // windows-only (or wine): replace icon & VersionInfo1.res
    if (currentPlatform().indexOf('win') !== -1) {
        nwOptions.winIco = pkJson.icon;
        nwOptions.winVersionString = {
            Comments: pkJson.description,
            CompanyName: pkJson.homepage,
            FileDescription: pkJson.releaseName,
            FileVersion: pkJson.version,
            InternalName: pkJson.name,
            OriginalFilename: pkJson.name + '.exe',
            ProductName: pkJson.releaseName,
            ProductVersion: pkJson.version
        };
    }

    const nw = new nwBuilder(nwOptions).on('log', console.log);

    return nw.build();
});

// compile nsis installer
gulp.task('nsis', () => {
    return Promise.all(parsePlatforms().map((platform) => {

        // nsis is for win only
        if (platform.match(/osx|linux/) !== null) {
            console.log('No `nsis` task for', platform);
            return null;
        }

        return new Promise((resolve, reject) => {
            console.log('Packaging nsis for: %s', platform);

            // spawn isn't exec
            const makensis = process.platform === 'win32' ? 'makensis.exe' : 'makensis';

            const child = spawn(makensis, [
                '-DARCH=' + platform,
                '-DOUTDIR=' + path.join(process.cwd(), releasesDir),
                'dist/win-installer.nsi'
            ]);

            // display log only on failed build
            const nsisLogs = [];
            child.stdout.on('data', (buf) => {
                nsisLogs.push(buf.toString());
            });

            child.on('close', (exitCode) => {
                if (!exitCode) {
                    console.log('%s nsis packaged in', platform, path.join(process.cwd(), releasesDir));
                } else {
                    if (nsisLogs.length) {
                        console.log(nsisLogs.join('\n'));
                    }
                    console.log('%s failed to package nsis', platform);
                }
                resolve();
            });

            child.on('error', (error) => {
                console.log(error);
                console.log(platform + ' failed to package nsis');
                resolve();
            });
        });
    })).catch(console.log);
});

// compile debian packages
gulp.task('deb', () => {
    return Promise.all(parsePlatforms().map((platform) => {

        // deb is for linux only
        if (platform.match(/osx|win/) !== null) {
            console.log('No `deb` task for:', platform);
            return null;
        }
        if (currentPlatform().indexOf('linux') === -1) {
            console.log('Packaging deb is only possible on linux');
            return null;
        }

        return new Promise((resolve, reject) => {
            console.log('Packaging deb for: %s', platform);

            const child = spawn('bash', [
                'dist/deb-maker.sh',
                platform,
                pkJson.name,
                pkJson.releaseName,
                pkJson.version,
                releasesDir
            ]);

            // display log only on failed build
            const debLogs = [];
            child.stdout.on('data', (buf) => {
                debLogs.push(buf.toString());
            });
            child.stderr.on('data', (buf) => {
                debLogs.push(buf.toString());
            });

            child.on('close', (exitCode) => {
                if (!exitCode) {
                    console.log('%s deb packaged in', platform, path.join(process.cwd(), releasesDir));
                } else {
                    if (debLogs.length) {
                        console.log(debLogs.join('\n'));
                    }
                    console.log('%s failed to package deb', platform);
                }
                resolve();
            });

            child.on('error', (error) => {
                console.log(error);
                console.log('%s failed to package deb', platform);
                resolve();
            });
        });
    })).catch(console.log);
});

// package in tgz (win) or in xz (unix)
gulp.task('compress', () => {
    return Promise.all(parsePlatforms().map((platform) => {

        // don't package win, use nsis
        if (platform.indexOf('win') !== -1) {
            console.log('No `compress` task for:', platform);
            return null;
        }

        return new Promise((resolve, reject) => {
            console.log('Packaging tar for: %s', platform);

            const sources = path.join(releasesDir, pkJson.name, platform);

            // compress with gulp on windows
            if (currentPlatform().indexOf('win') !== -1) {

                return gulp.src(sources + '/**')
                    .pipe(glp.tar(pkJson.name + '-' + pkJson.version + '_' + platform + '.tar'))
                    .pipe(glp.gzip())
                    .pipe(gulp.dest(releasesDir))
                    .on('end', () => {
                        console.log('%s tar packaged in %s', platform, path.join(process.cwd(), releasesDir));
                        resolve();
                    });

            // compress with tar on unix*
            } else {

                // using the right directory
                const platformCwd = platform.indexOf('linux') !== -1 ? '.' : pkJson.name + '.app';

                // list of commands
                const commands = [
                    'cd ' + sources,
                    'tar --exclude-vcs -c ' + platformCwd + ' | $(command -v pxz || command -v xz) -T8 -7 > "' + path.join(process.cwd(), releasesDir, pkJson.name + '-' + pkJson.version + '_' + platform + '.tar.xz') + '"',
                    'echo "' + platform + ' tar packaged in ' + path.join(process.cwd(), releasesDir) + '" || echo "' + platform + ' failed to package tar"'
                ].join(' && ');

                exec(commands, (error, stdout, stderr) => {
                    if (error || stderr) {
                        console.log(error || stderr);
                        console.log('%s failed to package tar', platform);
                        resolve();
                    } else {
                        console.log(stdout.replace('\n', ''));
                        resolve();
                    }
                });
            }
        });
    })).catch(console.log);
});

// create portable app
gulp.task('portable', () => {
    return Promise.all(parsePlatforms().map((platform) => {

        // portable is for win only (linux is tgz)
        if (platform.match(/osx|linux/) !== null) {
            console.log('No `portable` task for', platform);
            return null;
        }

        return new Promise((resolve, reject) => {
            console.log('Packaging portable for: %s', platform);

            // copy & zip files (include osu.json for portable settings)
            gulp.src([path.join(releasesDir, pkJson.name, platform) + '/**', 'dist/osu.json'])
                .pipe(glp.zip(pkJson.name + '-' + pkJson.version + '-win32-portable.zip'))
                .pipe(gulp.dest(releasesDir))
                .on('end', () => {
                    resolve();
                });
        });
    }));
});

// clean mediainfo-wrapper
gulp.task('clean:mediainfo', () => {
    return Promise.all(parsePlatforms().map((platform) => {
        console.log('clean:mediainfo', platform);
        const sources = path.join(releasesDir, pkJson.name, platform);
        return del([
            platform !== 'win32' ? path.join(sources, 'node_modules/mediainfo-wrapper/lib/win32') : '',
            platform !== 'osx64' ? path.join(sources, 'node_modules/mediainfo-wrapper/lib/osx64') : '',
            platform !== 'linux32' ? path.join(sources, 'node_modules/mediainfo-wrapper/lib/linux32') : '',
            platform !== 'linux64' ? path.join(sources, 'node_modules/mediainfo-wrapper/lib/linux64') : '',
            path.join(sources, pkJson.name + '.app/Contents/Resources/app.nw/node_modules/mediainfo-wrapper/lib/win32'),  
            path.join(sources, pkJson.name + '.app/Contents/Resources/app.nw/node_modules/mediainfo-wrapper/lib/linux32'),  
            path.join(sources, pkJson.name + '.app/Contents/Resources/app.nw/node_modules/mediainfo-wrapper/lib/linux64'),  
        ].filter(n => n));
    }));
});

// remove unused node_modules
gulp.task('npm:modclean', () => {
    const mc = new modClean();
    return mc.clean().then(r => {
        console.log('ModClean: %s files/folders removed', r.deleted.length);
    }).catch(console.log);
});

// npm prune the build/<platform>/ folder (to remove devDeps)
gulp.task('build:prune', () => {
    return Promise.all(parsePlatforms().map((platform) => {
        const dirname = path.join(releasesDir, pkJson.name, platform);
        return new Promise((resolve, reject) => {
            exec('cd "' + dirname + '" && npm prune', (error, stdout, stderr) => {
                if (error || stderr) {
                    console.log('`npm prune` failed for %s\n', platform);
                    console.log(stderr || error);
                    console.log('\n\ncontinuing anyway...\n');
                    resolve();
                } else {
                    console.log(stdout);
                    resolve();
                }
            });
        });
    }));
});

// check entire sources for potential coding issues (tweak in .jshintrc)
gulp.task('jshint', () => {
    return gulp.src(['gulpfile.js', 'app/js/**/*.js', 'app/js/**/*.js', '!app/js/vendor/*.js'])
        .pipe(glp.jshint('.jshintrc'))
        .pipe(glp.jshint.reporter('jshint-stylish'))
        .pipe(glp.jshint.reporter('fail'));
});

// build app from sources
gulp.task('build', gulp.series('npm:modclean', 'nwjs', 'clean:mediainfo', 'clean:nwjs', 'build:prune'));


// create redistribuable packages
gulp.task('dist', gulp.series('build', 'compress', 'deb', 'nsis', 'portable'));

// test for travis
gulp.task('test', gulp.series('jshint', 'build'));
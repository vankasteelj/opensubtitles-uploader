import gulp from 'gulp'
import glp from 'gulp-load-plugins'
import nwbuild from 'nw-builder'
import { deleteAsync } from 'del'
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path'
import { exec, spawn} from 'child_process'
import { clean } from 'clean-modules';
import { getPlatform, getArchitecture } from './app/js/vendor/system.js'
import pkJson from './package.json' with { type: 'json' };

/******** 
 * setup *
 ********/
const nwVersion = '0.106.1',
    flavor = 'sdk',
    availablePlatforms = ['linux', 'win', 'osx'],
    releasesDir = 'build';

const argv = yargs(hideBin(process.argv)).parse();
const currentPlatform = () => { return getPlatform(process.platform) };
const currentArchitecture = () => { return getArchitecture(process.arch)}

/***********
 *  custom  *
 ***********/
// returns an array of platforms that should be built
const parsePlatforms = () => {
  const requestedPlatforms = (argv.platforms || currentPlatform()).split(',');
  const validPlatforms = [];

  for (const p of requestedPlatforms) {
    if (availablePlatforms.includes(p)) validPlatforms.push(p);
  }

  // for osx and win, 32-bits works on 64, if needed
  if (!availablePlatforms.includes('win64') && requestedPlatforms.includes('win64')) {
    validPlatforms.push('win32');
  }
  if (!availablePlatforms.includes('osx64') && requestedPlatforms.includes('osx64')) {
    validPlatforms.push('osx32');
  }

  // remove duplicates (your old code didn't actually remove them)
  const uniqueValidPlatforms = [...new Set(validPlatforms)];

  return requestedPlatforms[0] === 'all' ? availablePlatforms : uniqueValidPlatforms;
};


/************* 
 * gulp tasks *
 *************/
// start app in development
gulp.task('run', () => {
  return new Promise((resolve, reject) => {
    const platforms = parsePlatforms();

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return reject(
        new Error(
          `No valid platform resolved.\n` +
          `Requested: ${(yargs?.argv?.platforms ?? '(auto)')}\n` +
          `Available: ${availablePlatforms.join(', ')}\n` +
          `Tip: log currentPlatform() to see what it returns.`
        )
      );
    }
    // Based on platform, create path to nw in bin
    let platform = platforms[0];
    let bin = path.join('cache', `nwjs-${flavor}-v${nwVersion}-${currentPlatform()}-${currentArchitecture()}`);

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
        return reject(new Error(`Unsupported platform: ${platform}`));
    }

    console.log('Running %s from cache', platform);

    const child = spawn(bin, ['.', '--development']);

    child.stderr.on('data', (buf) => console.log(buf.toString()));

    child.on('close', (exitCode) => {
      console.log('%s exited with code %d', pkJson.name, exitCode);
      resolve();
    });

    child.on('error', (error) => {
      if (error.code === 'ENOENT') {
        console.log(
          '%s is not available in cache. Try running `gulp build` beforehand',
          platform
        );
      }
      reject(error);
    });
  });
});

// remove unused libraries
gulp.task('clean:nwjs', () => {
    return Promise.all(parsePlatforms().map((platform) => {
        let dirname = path.join(releasesDir, pkJson.name, platform);
        return deleteAsync([
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
gulp.task('nwjs', async () => {
    const nwOptions = {
        srcDir: "./app/** package.json ./README.md ./node_modules/**", 
        outDir: path.join(releasesDir, pkJson.name, currentPlatform()),
        cacheDir: "./cache",
        app: {
        name: pkJson.name,
        icon: pkJson.icon,
        company: pkJson.author.name,
        fileDescription: pkJson.description,
        productName: pkJson.releaseName,
        legalCopyright: pkJson.license,
        },
        version: "stable",
        zip: false,
        flavor: flavor,
        mode: "build",
        platform: currentPlatform(),
        arch: currentArchitecture(),
    };
    // // windows-only (or wine): replace icon & VersionInfo1.res
    // if (currentPlatform().indexOf('win') !== -1) {
    //     nwOptions.app = {
    //         icon: pkJson.icon,
    //         comments: pkJson.description,
    //         company: pkJson.homepage,
    //         fileDescription: pkJson.releaseName,
    //         fileVersion: pkJson.version,
    //         internalName: pkJson.name,
    //         originalFilename: pkJson.name + '.exe',
    //         productName: pkJson.releaseName,
    //         productVersion: pkJson.version
    //     };
    // }
  await nwbuild(nwOptions);
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
        return deleteAsync([
            platform !== 'win' ? path.join(sources, 'node_modules/mediainfo-wrapper/lib/win32') : '',
            platform !== 'osx' ? path.join(sources, 'node_modules/mediainfo-wrapper/lib/osx64') : '',
            platform !== 'linux' ? path.join(sources, 'node_modules/mediainfo-wrapper/lib/linux32') : '',
            path.join(sources, pkJson.name + '.app/Contents/Resources/app.nw/node_modules/mediainfo-wrapper/lib/win32'),  
            path.join(sources, pkJson.name + '.app/Contents/Resources/app.nw/node_modules/mediainfo-wrapper/lib/linux32'),  
            path.join(sources, pkJson.name + '.app/Contents/Resources/app.nw/node_modules/mediainfo-wrapper/lib/linux64'),  
        ].filter(n => n));
    }));
});

// remove unused node_modules
gulp.task('npm:clean_modules', () => {
  return clean()
    .then((r) => {
      // clean-modules returns a result object; count removed items defensively
      const removedCount =
        (Array.isArray(r?.removedFiles) ? r.removedFiles.length : 0) +
        (Array.isArray(r?.removedDirectories) ? r.removedDirectories.length : 0) +
        (Array.isArray(r?.removedEmptyDirs) ? r.removedEmptyDirs.length : 0) +
        (Array.isArray(r?.removed) ? r.removed.length : 0);

      console.log('Clean Modules: %s files/folders removed', removedCount);
    })
    .catch(console.log);
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
gulp.task('build', gulp.series('npm:clean_modules', 'nwjs', 'clean:mediainfo', 'clean:nwjs', 'build:prune'));

// create redistribuable packages
gulp.task('dist', gulp.series('build', 'compress', 'deb', 'nsis', 'portable'));

// test for travis
gulp.task('test', gulp.series('jshint', 'build'));
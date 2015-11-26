var parseBuildPlatforms = function (argumentPlatform) {
    var inputPlatforms = argumentPlatform || process.platform + ";" + process.arch;
    inputPlatforms = inputPlatforms
        .replace('darwin', 'osx')
        .replace(/;ia|;x|;arm/, "");

    var buildAll = /^all$/.test(inputPlatforms);

    var buildPlatforms = {
        osx64: /osx/.test(inputPlatforms) || buildAll,
        win32: /win/.test(inputPlatforms) || buildAll,
        linux32: /linux32/.test(inputPlatforms) || buildAll,
        linux64: /linux64/.test(inputPlatforms) || buildAll
    };

    return buildPlatforms;
};

module.exports = function(grunt) {
    "use strict";

    var buildPlatforms = parseBuildPlatforms(grunt.option('platforms'));
    var pkgJson = grunt.file.readJSON('package.json');

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('setup', [
        'nwjs'
    ]);
    grunt.registerTask('dev', function () {
        var start = parseBuildPlatforms();
        if (start.win32) {
            grunt.task.run('exec:win32');
        } else if (start.osx64) {
            grunt.task.run('exec:osx64');
        } else if (start.linux32) {
            grunt.task.run('exec:linux32');
        } else if (start.linux64) {
            grunt.task.run('exec:linux64');
        } else {
            grunt.log.writeln('OS not supported.');
        }
    });

    grunt.initConfig({
        app_name: pkgJson.name,
        app_version: pkgJson.version,
        nwjs: {
            options: {
                version: '0.12.3',
                build_dir: './builds',
                cache_dir: './builds/cache',
                macZip: buildPlatforms.win32,
                osx64: buildPlatforms.osx64,
                win32: buildPlatforms.win32,
                linux32: buildPlatforms.linux32,
                linux64: buildPlatforms.linux64
            },
            src: ['./package.json'] //that's a fake, I only want the binaries
        },
        exec: {
            win32: {
                cmd: '"builds/cache/<%= nwjs.options.version %>/win32/nw.exe" .'
            },
            osx64: {
                cmd: 'builds/cache/<%= nwjs.options.version %>/osx64/nwjs.app/Contents/MacOS/nwjs .'
            },
            linux32: {
                cmd: '"builds/cache/<%= nwjs.options.version %>/linux32/nw" .'
            },
            linux64: {
                cmd: '"builds/cache/<%= nwjs.options.version %>/linux64/nw" .'
            }
        }
    });
};
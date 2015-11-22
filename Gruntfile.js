module.exports = function (grunt) {
    "use strict";

    var pkgJson = grunt.file.readJSON('package.json');
    var currentVersion = pkgJson.version;

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', [
        'shell:copydeps'
    ]);

    grunt.initConfig({
        shell: {
            copydeps: {
                command: function () {
                    return [
                        'cp ./node_modules/jquery/dist/jquery.min.js js/vendor/jquery.js'
                    ].join(' && ');
                }
            }
        }
    });
};
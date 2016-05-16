'use strict';

console.info('Opening app...');

// important variables used in the app
var gui = require('nw.gui');
var win = gui.Window.get();
var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;
var https = require('https');
var crypt = require('crypto');

var i18n = require('i18n');
var openSubtitles = require('opensubtitles-api');
var mi = require('mediainfo-wrapper');
var detectLang = require('detect-lang');
var Trakt = require('trakt.tv');
var trakt = new Trakt({
    client_id: '1b267c94143610fe422532f9b91c858771f33427b1669610b5f802cee8518ea6'
});

var OSLANGS = require('./js/utils/os-lang.json');
var PKJSON = require('../package.json');
var USERAGENT = 'OpenSubtitles-Uploader v' + PKJSON.version;
var OS;

// setup window's content and start the app
gui.start = function () {
    return new Promise(function (resolve, reject) {
        try {
            // Set up everything
            Boot.load();

            // if started with gulp, open devtools
            if (gui.App.argv.indexOf('--development') !== -1) {
                console.debug('Running in development');
                win.showDevTools();
            }

            console.info('Application ready');
            setTimeout(resolve, 200);
        } catch (err) {
            // if things go south on startup, just display devtools and log error
            console.error(err);
            win.showDevTools();
            reject(err);
        }
    });
};

// if app is already running, inject file if used 'open with'
gui.App.on('open', function (cmd) {
    var file;
    if (process.platform.match('win32')) {
        file = cmd.split('"');
        file = file[file.length - 2];
    } else {
        file = cmd.split(' /');
        file = file[file.length - 1];
        file = '/' + file;
    }

    if (file) {
        Files.loadFile(file);
    }
});
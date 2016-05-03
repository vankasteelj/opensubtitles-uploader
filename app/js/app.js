console.info('Opening app...');

// important variables used in the app
var gui = require('nw.gui'),
    win = gui.Window.get(),
    path = require('path'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    https = require('https'),
    crypt = require('crypto'),

    Promise = require('bluebird'),
    i18n = require('i18n'),
    OpenSubtitles = require('opensubtitles-api'),
    mi = require('mediainfo-wrapper'),
    detectLang = require('detect-lang'),

    osLangs = require('./js/utils/os-lang.json'),
    pkJson = require('../package.json'),
    version = pkJson.version,
    USERAGENT = 'OpenSubtitles-Uploader v' + version,
    OS;

// setup window's content and start the app
gui.start = function () {
    return new Promise(function (resolve, reject) {
        try {
            // Set up everything
            boot.load();

            // if started with gulp, open devtools
            if (gui.App.argv.indexOf('--development') !== -1) {
                console.debug('running in development');
                win.showDevTools();
            }

            console.info('Application ready');
            setTimeout(resolve, 200);
        } catch (e) {
            // if things go south on startup, just display devtools and log error
            console.error(e);
            win.showDevTools();
            reject();
        }
    });
};
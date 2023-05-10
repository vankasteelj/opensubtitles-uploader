'use strict';

console.time('Application ready');
console.info('Opening app...');

// important variables used in the app
const gui = require('nw.gui');
const win = gui.Window.get();
const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;
const https = require('https');
const crypt = require('crypto');
const got = require('got');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // force ipv4 use for nodejs (see: https://forum.opensubtitles.org/viewtopic.php?f=8&t=17963)

const i18n = require('i18n');
const openSubtitles = require('opensubtitles-api');
const mi = require('mediainfo-wrapper');
const detectLang = require('detect-lang');

const OSLANGS = require('./js/utils/os-lang.json');
const PKJSON = require('../package.json');
const USERAGENT = 'OpenSubtitles-Uploader v' + PKJSON.version;

let OS;

// setup window's content and start the app
gui.start = () => {
    return new Promise((resolve, reject) => {
        try {
            // Set up everything
            Boot.load();

            // if started with gulp, open devtools
            if (gui.App.argv.indexOf('--development') !== -1) {
                console.debug('Running in development');
                win.showDevTools();
            }

            console.timeEnd('Application ready');
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
gui.App.on('open', (cmd) => {
    let file;
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
'use strict';

var Misc = {

    // AUTO or USERINTERACTION: open url in browser
    openExternal: function (link) {
        gui.Shell.openExternal(link);
    },

    // USERINTERACTION: open imdb link in browser
    openImdb: function () {
        var id = $('#imdb-info').attr('imdbid');
        if (id) {
            Misc.openExternal('http://www.imdb.com/title/' + id);
        }
    },

    // USERINTERACTION: restart app (used by Keyboard.setupShortcuts)
    restartApp: function () {
        var argv = gui.App.fullArgv;
        var CWD = process.cwd();

        argv.push(CWD);
        spawn(process.execPath, argv, {
            cwd: CWD,
            detached: true,
            stdio: ['ignore', 'ignore', 'ignore']
        }).unref();
        gui.App.quit();
    },

    // AUTO: build the right click menu(s) on demand
    contextMenu: function (cutLabel, copyLabel, pasteLabel, field) {
        var menu = new gui.Menu();
        var clipboard = gui.Clipboard.get();

        var cut = new gui.MenuItem({
            label: cutLabel,
            click: function () {
                document.execCommand('cut');
            }
        });

        var copy = new gui.MenuItem({
            label: copyLabel,
            click: function () {
                // on readonly fields, execCommand doesn't work
                if ($('#' + field).attr('readonly') && Misc.getSelection($('#' + field)[0]) === null) {
                    clipboard.set($('#' + field).val());
                } else {
                    document.execCommand('copy');
                }
            }
        });

        var paste = new gui.MenuItem({
            label: pasteLabel,
            click: function () {
                document.execCommand('paste');
            }
        });

        if (cutLabel) {
            menu.append(cut);
        }
        if (copyLabel) {
            menu.append(copy);
        }
        if (pasteLabel) {
            menu.append(paste);
        }

        return menu;
    },

    // AUTO: get active selection (used by Misc.contextMenu)
    getSelection: function (textbox) {
        var selectedText = null;
        var activeElement = document.activeElement;

        if (activeElement && (activeElement.tagName.toLowerCase() === 'textarea' || (activeElement.tagName.toLowerCase() === 'input' && activeElement.type.toLowerCase() === 'text')) && activeElement === textbox) {
            var startIndex = textbox.selectionStart;
            var endIndex = textbox.selectionEnd;

            if (endIndex - startIndex > 0) {
                var text = textbox.value;
                selectedText = text.substring(textbox.selectionStart, textbox.selectionEnd);
            }
        }

        return selectedText;
    },

    // STARTUP: check updates on app start, based on upstream git package.json
    checkUpdates: function () {
        // on start, set update text if not updated
        if (localStorage.availableUpdate && localStorage.availableUpdate !== '' && localStorage.availableUpdate > PKJSON.version) {
            $('#notification').html(i18n.__('New version available, download %s now!', '<a onClick="Misc.openExternal(\'' + localStorage.availableUpdateUrl + '\')">v' + localStorage.availableUpdate + '</a>'));
        }

        // only check every 7 days
        if (parseInt(localStorage.lastUpdateCheck) + 604800000 > Date.now()) {
            return;
        }

        localStorage.lastUpdateCheck = Date.now();

        // fetch remote package.json
        var url = 'https://raw.githubusercontent.com/vankasteelj/opensubtitles-uploader/master/package.json';
        https.get(url, function (res) {
            var body = '';

            res.on('data', function (chunk) {
                body += chunk.toString();
            });

            res.on('end', function () {
                var avail_version = JSON.parse(body).version;
                var releasesUrl = JSON.parse(body).releases;

                if (avail_version > PKJSON.version) {
                    localStorage.availableUpdate = avail_version;
                    localStorage.availableUpdateUrl = releasesUrl;
                    console.info('Update %s available:', avail_version, releasesUrl);
                    $('#notification').html(i18n.__('New version available, download %s now!', '<a onClick="Misc.openExternal(\'' + localStorage.availableUpdateUrl + '\')">v' + localStorage.availableUpdate + '</a>'));
                } else {
                    localStorage.availableUpdate = '';
                    localStorage.availableUpdateUrl = '';
                    console.debug('No update available');
                }
            });
        }).on('error', function (e) {
            console.error('Unable to look for updates', e);
        });
    },

    // AUTO: function to always return 2 digits, adding leading 0 if needed
    pad: function (n) {
        return n < 10 ? '0' + n : n;
    },

    // AUTO: search trakt for an image
    traktLookup: function (id) {

        Misc.isSearchingTrakt = true;
        console.info('Looking on trakt.tv for a fanart...');

        return new Promise(function (resolve, reject) {
            trakt.search({
                id_type: 'imdb',
                id: id
            }).then(function (res) {
                var found = null;
                for (var i in res) {
                    if (res[i].type.match(/movie|show/i)) {
                        console.debug('Trakt response:', res);
                        found = res[i][res[i].type].images.fanart.medium;
                        break;
                    }
                }

                if (found) {
                    resolve(found);
                } else {
                    throw 'trakt sent back no result';
                }
            }).catch(function (error) {
                if (Misc.TmpMetadata) {
                    trakt.search({
                        query: Misc.TmpMetadata.title.replace(/\W/g, '-'),
                        extended: 'images'
                    }).then(function (res) {
                        var found = null;
                        for (var i in res) {
                            if (res[i].type.match(/movie|show/i)) {
                                console.debug('Trakt response:', res[i]);
                                found = res[i][res[i].type].images.fanart.medium;
                                break;
                            }
                        }

                        if (found) {
                            resolve(found);
                        } else {
                            throw 'trakt sent back no result';
                        }
                    }).catch(function (error) {
                        console.warn('Unable to get trakt image:', error);
                        resolve(null);
                    });
                } else {
                    console.warn('Unable to get trakt image:', error);
                    resolve(null);
                }
            });
        });
    },

    // AUTO: global value set while waiting for trakt response
    isSearchingTrakt: false,

    // AUTO: global jquery values to save with Misc.saveState()
    states: {
        value: {
            '#video-file-path': false,
            '#moviefilename': false,
            '#moviehash': false,
            '#moviebytesize': false,
            '#imdbid': false,
            '#movieaka': false,
            '#moviereleasename': false,
            '#moviefps': false,
            '#movietimems': false,
            '#movieframes': false,
            '#subtitle-file-path': false,
            '#subfilename': false,
            '#subhash': false,
            '#subtranslator': false,
            '#subauthorcomment': false,
            '#sublanguageid': false
        },
        checked: {
            '#highdefinition': false,
            '#hearingimpaired': false,
            '#automatictranslation': false,
            '#foreignpartsonly': false
        },
        title: {
            '#imdb-info': false
        }
    },

    // AUTO: store data before reloading app
    saveState: function () {
        var states = {};
        // save states
        for (var prop in Misc.states) {
            states[prop] = {};
            for (var id in Misc.states[prop]) {
                states[prop][id] = $(id).prop(prop);
            }
        }
        localStorage.states = JSON.stringify(states);

        // save img
        var imgUrl = $('#main-video-img').css('background-image').replace(/url\(|\)/g, '');
        if (imgUrl && imgUrl !== 'none') {
            localStorage['main-video-img'] = imgUrl;
        }
    },

    // STARTUP: restore state of the app, when reloading
    restoreState: function () {
        var states = JSON.parse(localStorage.states);
        for (var prop in states) {
            for (var id in states[prop]) {
                $(id).prop(prop, states[prop][id]);
            }
        }
        Interface.displayPlaceholder(localStorage['main-video-img']);
    }
};
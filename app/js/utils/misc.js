'use strict';

const Misc = {

    // AUTO or USERINTERACTION: open url in browser
    openExternal: (link) => gui.Shell.openExternal(link),

    // USERINTERACTION: open imdb link in browser
    openImdb: (id = $('#imdb-info').attr('imdbid')) => {
        if (id) {
            Misc.openExternal('http://www.imdb.com/title/' + id);
        }
    },

    // USERINTERACTION: restart app (used by Keyboard.setupShortcuts)
    restartApp: () => {
        const argv = gui.App.fullArgv;
        const CWD = process.cwd();

        argv.push(CWD);
        spawn(process.execPath, argv, {
            cwd: CWD,
            detached: true,
            stdio: ['ignore', 'ignore', 'ignore']
        }).unref();
        gui.App.quit();
    },

    // AUTO: build the right click menu(s) on demand
    contextMenu: (cutLabel, copyLabel, pasteLabel, field) => {
        const menu = new gui.Menu();
        const clipboard = gui.Clipboard.get();

        const cut = new gui.MenuItem({
            label: cutLabel,
            click: () => document.execCommand('cut')
        });

        const copy = new gui.MenuItem({
            label: copyLabel,
            click: () => {
                // on readonly fields, execCommand doesn't work
                if ($('#' + field).attr('readonly') && Misc.getSelection($('#' + field)[0]) === null) {
                    clipboard.set($('#' + field).val());
                } else {
                    document.execCommand('copy');
                }
            }
        });

        const paste = new gui.MenuItem({
            label: pasteLabel,
            click: () => document.execCommand('paste')
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
    getSelection: (textbox) => {
        let selectedText = null;
        const activeElement = document.activeElement;

        if (activeElement && (activeElement.tagName.toLowerCase() === 'textarea' || (activeElement.tagName.toLowerCase() === 'input' && activeElement.type.toLowerCase() === 'text')) && activeElement === textbox) {
            const startIndex = textbox.selectionStart;
            const endIndex = textbox.selectionEnd;

            if (endIndex - startIndex > 0) {
                const text = textbox.value;
                selectedText = text.substring(textbox.selectionStart, textbox.selectionEnd);
            }
        }

        return selectedText;
    },

    // AUTO: function to always return 2 digits, adding leading 0 if needed
    pad: (n) => n < 10 ? '0' + n : n,

    // AUTO: search online for an image
    imageLookup: (id) => {

        Misc.isSearchingImage = true;
        console.info('Looking online for a fanart...');

        return new Promise((resolve, reject) => {
            got('https://api.themoviedb.org/3/find/' + id + '?api_key=27075282e39eea76bd9626ee5d3e767b&external_source=imdb_id', {
                json: true,
                headers: {
                    'content-type': 'application/json'
                }
            }).then((res) => {        
                let image;
                const url = 'https://image.tmdb.org/t/p/';
                const size = 'w1280';
                if (res.body && res.body.movie_results && res.body.movie_results[0] && res.body.movie_results[0].backdrop_path) {
                    image = res.body.movie_results[0].backdrop_path;
                } else if (res.body && res.body.tv_results && res.body.tv_results[0] && res.body.tv_results[0].backdrop_path) {
                    image = res.body.tv_results[0].backdrop_path;
                } else {
                    throw 'Image not found';
                }
                resolve(url+size+image);
            }).catch((error) => {
                if (Misc.TmpMetadata) {
                    got('https://api.themoviedb.org/3/search/multi?api_key=27075282e39eea76bd9626ee5d3e767b&query=' + Misc.TmpMetadata.title.replace(/\W/g, ' '), {
                        json:true, 
                        headers:{
                            'content-type': 'application/json'
                        }
                    }).then((res) => {
                        let image;
                        const url = 'https://image.tmdb.org/t/p/';
                        const size = 'w1280';
                        if (res.body && res.body.results && res.body.results[0] && res.body.results[0].backdrop_path) {
                            image = res.body.results[0].backdrop_path;
                        } else {
                            throw 'Image not found';
                        }
                        resolve(url+size+image);
                    }).catch((err) => {
                        console.warn('Unable to get image:', err);
                        resolve(null);
                    });
                } else {
                    console.warn('Unable to get image:', error);
                    resolve(null);
                }
            });
        });
    },

    // AUTO: global value set while waiting for a response
    isSearchingImage: false,

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
    saveState: () => {
        const states = {};
        // save states
        for (let prop in Misc.states) {
            states[prop] = {};
            for (let id in Misc.states[prop]) {
                states[prop][id] = $(id).prop(prop);
            }
        }
        localStorage.states = JSON.stringify(states);

        // save img
        const imgUrl = $('#main-video-img').css('background-image').replace(/url\(|\)/g, '');
        if (imgUrl && imgUrl !== 'none') {
            localStorage['main-video-img'] = imgUrl;
        }

        // save settings popup state
        if ($('#settings-popup').is(':visible')) {
            localStorage['settings-popup'] = true;
        }
    },

    // STARTUP: restore state of the app, when reloading
    restoreState: () => {
        const states = JSON.parse(localStorage.states);
        for (let prop in states) {
            for (let id in states[prop]) {
                $(id).prop(prop, states[prop][id]);
            }
        }

        if (localStorage['settings-popup']) {
            Interface.settingsPopup();
        }

        Interface.displayPlaceholder(localStorage['main-video-img']);
    },

    // AUTO: checks if the element is visible (for scrolling)
    elementInViewport: (container, element) => {
        if (element.length === 0) {
            return;
        }
        const $container = $(container);
        const $el = $(element);

        const docViewTop = $container.offset().top;
        const docViewBottom = docViewTop + $container.height();

        const elemTop = $el.offset().top;
        const elemBottom = elemTop + $el.height();

        return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom) && (elemBottom <= docViewBottom) && (elemTop >= docViewTop));
    }
};
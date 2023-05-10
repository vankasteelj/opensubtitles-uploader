const Boot = {

    // STARTUP: load app: ui,settings,features
    load: () => {
        Boot.checkPortable();               // is it a portable version?
        Localization.setupLocalization();   // localize
        Themes.loadTheme();                 // display theme
        Boot.setupSettings();               // setup settings popup
        OsActions.verifyLogin();            // check OS login
        Boot.checkVisible();                // nwjs window position
        Boot.setupInputs();                 // browse button
        Boot.setupRightClicks();            // right click menus
        Keyboard.setupShortcuts();          // keyboard shortcuts
        Interface.setupImdbFocus();         // imdb field event
        Update.checkUpdates();              // update
        Boot.setupLangDropdown();           // sub language dropdown
        Interface.restoreLocks();           // locked fields
        Boot.setupTooltips();               // tooltips
        Boot.setupVersion();                // version number
        DragDrop.setup();                   // setup drag&drop
        Boot.checkReload();                 // are there values to restore?
        Boot.trakt();                       // startup trakt

        // on app open, load file if used 'open with'
        Files.loadFile(gui.App.argv.slice(-1).pop());
    },

    // STARTUP: builds right click menu
    setupRightClicks: () => {
        const inputs = $('input[type=text], textarea');
        inputs.each((i) => {
            // right click event
            inputs[i].addEventListener('contextmenu', (ev) => {
                // force stop default rightclick event
                ev.preventDefault();
                let menu;

                if ($(inputs[i]).attr('readonly')) {
                    // copy only on readonly fields
                    if (ev.target.value !== '') {
                        menu = Misc.contextMenu(null, i18n.__('Copy'), null, ev.target.id);
                    } else {
                        return;
                    }
                } else {
                    // cut-copy-paste on other
                    menu = Misc.contextMenu(i18n.__('Cut'), i18n.__('Copy'), i18n.__('Paste'), ev.target.id);
                }
                // show our custom menu
                menu.popup(ev.x, ev.y);
                return false;
            }, false);
        });
    },

    // STARTUP: lang dropdown in subtitles section
    setupLangDropdown: () => {
        // 'none' is default
        $('#sublanguageid').append('<option value="">' + i18n.__('None') + '</option>');

        // build html
        let langs = '';
        for (let key in OSLANGS) {
            langs += '<option value="' + OSLANGS[key].code + '">' + key + (OSLANGS[key].native ? ` (${(OSLANGS[key].native)})` : '') + '</option>';
        }

        // inject html (new fields) into dropdown
        $('#sublanguageid').append(langs);
    },

    // STARTUP: browse button on click events and drag&drop
    setupInputs: () => {
        // video hidden input
        document.querySelector('#video-file-path-hidden').addEventListener('change', (evt) => {
            const file = $('#video-file-path-hidden')[0].files[0];
            window.ondrop({
                dataTransfer: {
                    files: [file]
                },
                preventDefault: () => {}
            });
        }, false);

        // subtitle hidden input
        document.querySelector('#subtitle-file-path-hidden').addEventListener('change', (evt) => {
            const file = $('#subtitle-file-path-hidden')[0].files[0];
            window.ondrop({
                dataTransfer: {
                    files: [file]
                },
                preventDefault: () => {}
            });
        }, false);

        // any file hidden input
        document.querySelector('#file-path-hidden').addEventListener('change', (evt) => {
            window.ondrop({
                dataTransfer: {
                    files: $('#file-path-hidden')[0].files
                },
                preventDefault: () => {}
            });
        }, false);
        
        // paste imdb id input
        document.querySelector('#imdbid').addEventListener('paste', (evt) => {
            OsActions.imdbMetadataPasted = true;
        }, false);

        // supported file types for "browse" window
        $('#video-file-path-hidden').attr('accept', Files.supported.video.join());
        $('#subtitle-file-path-hidden').attr('accept', Files.supported.subtitle.join());
    },

    // STARTUP: nwjs sometimes can be out of the screen
    checkVisible: (options) => {
        const screen = window.screen;
        const defaultWidth = PKJSON.window.width;
        const defaultHeight = PKJSON.window.height;

        // check stored settings or use package.json values
        const width = parseInt(localStorage.width ? localStorage.width : defaultWidth);
        const height = parseInt(localStorage.height ? localStorage.height : defaultHeight);
        let x = parseInt(localStorage.posX ? localStorage.posX : -1);
        let y = parseInt(localStorage.posY ? localStorage.posY : -1);

        // reset x
        if (x < 0 || (x + width) > screen.width) {
            x = Math.round((screen.availWidth - width) / 2);
        }

        // reset y
        if (y < 0 || (y + height) > screen.height) {
            y = Math.round((screen.availHeight - height) / 2);
        }

        // move nwjs in sight
        win.moveTo(x, y);

        // remember positionning
        win.on('move', (x, y) => {
            if (localStorage && x && y) {
                localStorage.posX = Math.round(x);
                localStorage.posY = Math.round(y);
            }
        });
    },

    // STARTUP: if app is portable, load settings from osu.json and write back on exit
    checkPortable: () => {
        // check if app is portable
        if (!fs.existsSync('./osu.json')) {
            return;
        }

        // load settings
        const settings = require('../osu.json');
        console.info('Portable application, loading settings from `osu.json`', settings);

        // import settings
        for (let s in settings) {
            localStorage.setItem(s, settings[s]);
        }

        // on close, write settings back to file
        win.on('close', () => {
            try { // failsafe
                fs.writeFileSync('./osu.json', JSON.stringify(localStorage));
            } catch (e) {}
            win.close(true);
        });
    },

    // STARTUP: checks if the app needs to reset cached values
    checkReload: () => {
        if (!localStorage.states) {
            return;
        }
        Misc.restoreState();
        localStorage.removeItem('main-video-img');
        localStorage.removeItem('settings-popup');
        localStorage.removeItem('states');
    },

    // STARTUP: set up tooltips
    setupTooltips: () => {
        $('.tooltipped').tooltip({
            'show': {
                duration: 500,
                delay: 400
            },
            'hide': 500
        });
    },

    // STARTUP: set up version number in bottom-right corner
    setupVersion: () => $('.version').text(PKJSON.version),

    // STARTUP: set up values in settings popup
    setupSettings: () => {
        // SSL usage state
        OsActions.setupSSL();

        // autoupdate
        Update.setupCheckbox();

        // theme dropdown
        Themes.setupDropdown();

        // lang dropdown
        Localization.setupDropdown();
    },

    trakt: () => {
        TRAKT = new Trakt({
            client_id: '1b267c94143610fe422532f9b91c858771f33427b1669610b5f802cee8518ea6',
            client_secret: btoa('km·Õ·9ß½5ß^|õ­·÷½ýmÖøëV·Ýï[ëÍ´ïß_×w4k\x97üyÞ{{\x86üõÝ\x9B')
        });
    }
};
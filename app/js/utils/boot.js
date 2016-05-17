var Boot = {

    // STARTUP: load app: ui,settings,features
    load: function () {
        Boot.checkPortable();               // is it a portable version?
        Localization.setupLocalization();   // localize
        Boot.setupTheme();                  // theme
        OsActions.verifyLogin();            // check OS login
        Boot.checkVisible();                // nwjs window position
        Boot.setupInputs();                 // browse button
        Boot.setupRightClicks();            // right click menus
        Keyboard.setupShortcuts();          // keyboard shortcuts
        Interface.setupImdbFocus();         // imdb field event
        Localization.setupLocaleFlags();    // language dropdown
        Misc.checkUpdates();                // update
        Boot.setupLangDropdown();           // sub language dropdown
        Interface.restoreLocks();           // locked fields
        Boot.setupTooltips();               // tooltips
        Boot.setupVersion();                // version number
        DragDrop.setup();                   // setup drag&drop
        Boot.checkReload();                 // are there values to restore?

        // on app open, load file if used 'open with'
        Files.loadFile(gui.App.argv.slice(-1).pop());
    },

    // STARTUP: checks which theme user prefers, defaults to light, then injects css theme file and changes button color accordingly
    setupTheme: function () {
        // which theme to use?
        var theme = localStorage && localStorage.theme ? localStorage.theme : 'light';
        // inject the css file
        document.getElementById('theme').href = 'css/themes/' + theme.toLowerCase() + '.css';
        // store setting
        localStorage.theme = theme;
        // button color
        $('#switch-theme').css('color', theme === 'light' ? '#323a45' : '#f5f7fa');
    },

    // STARTUP: builds right click menu
    setupRightClicks: function () {
        var inputs = $('input[type=text], textarea');
        inputs.each(function (i) {
            // right click event
            inputs[i].addEventListener('contextmenu', function (ev) {
                // force stop default rightclick event
                ev.preventDefault();
                var menu;

                if ($(inputs[i]).attr('readonly')) {
                    // copy only on readonly fields
                    if (ev.target.value !== '') {
                        menu = new Misc.contextMenu(null, i18n.__('Copy'), null, ev.target.id);
                    } else {
                        return;
                    }
                } else {
                    // cut-copy-paste on other
                    menu = new Misc.contextMenu(i18n.__('Cut'), i18n.__('Copy'), i18n.__('Paste'), ev.target.id);
                }
                // show our custom menu
                menu.popup(ev.x, ev.y);
                return false;
            }, false);
        });
    },

    // STARTUP: lang dropdown in subtitles section
    setupLangDropdown: function () {
        // 'none' is default
        $('#sublanguageid').append('<option value="">' + i18n.__('None') + '</option>');

        // build html
        var langs = '';
        for (var key in OSLANGS) {
            langs += '<option value="' + OSLANGS[key].code + '">' + key + '</option>';
        }

        // inject html (new fields) into dropdown
        $('#sublanguageid').append(langs);
    },

    // STARTUP: browse button on click events and drag&drop
    setupInputs: function () {
        // video hidden input
        document.querySelector('#video-file-path-hidden').addEventListener('change', function (evt) {
            var file = $('#video-file-path-hidden')[0].files[0];
            window.ondrop({
                dataTransfer: {
                    files: [file]
                },
                preventDefault: function () {}
            });
        }, false);

        // subtitle hidden input
        document.querySelector('#subtitle-file-path-hidden').addEventListener('change', function (evt) {
            var file = $('#subtitle-file-path-hidden')[0].files[0];
            window.ondrop({
                dataTransfer: {
                    files: [file]
                },
                preventDefault: function () {}
            });
        }, false);

        // supported file types for "browse" window
        $('#video-file-path-hidden').attr('accept', Files.supported.video.join());
        $('#subtitle-file-path-hidden').attr('accept', Files.supported.subtitle.join());
    },

    // STARTUP: nwjs sometimes can be out of the screen
    checkVisible: function (options) {
        var screen = window.screen;
        var defaultWidth = PKJSON.window.width;
        var defaultHeight = PKJSON.window.height;

        // check stored settings or use package.json values
        var width = parseInt(localStorage.width ? localStorage.width : defaultWidth);
        var height = parseInt(localStorage.height ? localStorage.height : defaultHeight);
        var x = parseInt(localStorage.posX ? localStorage.posX : -1);
        var y = parseInt(localStorage.posY ? localStorage.posY : -1);

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
        win.on('move', function (x, y) {
            if (localStorage && x && y) {
                localStorage.posX = Math.round(x);
                localStorage.posY = Math.round(y);
            }
        });
    },

    // STARTUP: if app is portable, load settings from osu.json and write back on exit
    checkPortable: function () {
        // check if app is portable
        if (!fs.existsSync('./osu.json')) {
            return;
        }

        // load settings
        var settings = require('../osu.json');
        console.info('Portable application, loading settings from `osu.json`', settings);

        // import settings
        for (var s in settings) {
            localStorage.setItem(s, settings[s]);
        }

        // on close, write settings back to file
        win.on('close', function () {
            try { // failsafe
                fs.writeFileSync('./osu.json', JSON.stringify(localStorage));
            } catch (e) {}
            win.close('true');
        });
    },

    // STARTUP: checks if the app needs to reset cached values
    checkReload: function () {
        if (!localStorage.states) {
            return;
        }
        Misc.restoreState();
        localStorage.removeItem('main-video-img');
        localStorage.removeItem('states');
    },

    // STARTUP: set up tooltips
    setupTooltips: function () {
        $('.tooltipped').tooltip({
            'show': {
                duration: 500,
                delay: 400
            },
            'hide': 500
        });
    },

    // STARTUP: set up version number in bottom-right corner
    setupVersion: function () {
        $('.version').text('v' + PKJSON.version + ' - ');
    }
};
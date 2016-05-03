var boot = {

    // STARTUP: load app: ui,settings,features
    load: function () {
            boot.checkPortable();               // is it a portable version?
            localization.setupLocalization();   // localize
            boot.setupTheme();                  // theme
            opensubtitles.verifyLogin();        // check OS login
            boot.checkVisible();                // nwjs window position
            boot.setupInputs();                 // browse button
            boot.setupRightClicks();            // right click menus
            keyboard.setupShortcuts();          // keyboard shortcuts
            interface.setupImdbFocus();         // imdb field event
            localization.setupLocaleFlags();    // language dropdown
            misc.checkUpdates();                // update
            boot.setupLangDropdown();           // sub language dropdown
            interface.restoreLocks();           // locked fields
            boot.setupTooltips();               // tooltips
            boot.setupVersion();                // version number
            dragdrop.setup();                   // setup drag&drop
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
                // copy only on readonly fields
                if ($(inputs[i]).attr('readonly')) {
                    if (ev.target.value !== '') {
                        menu = new misc.contextMenu(null, i18n.__('Copy'), null, ev.target.id);
                    } else {
                        return;
                    }
                // cut-copy-paste on other
                } else {
                    menu = new misc.contextMenu(i18n.__('Cut'), i18n.__('Copy'), i18n.__('Paste'), ev.target.id);
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
        for (var key in osLangs) {
            langs += '<option value="' + osLangs[key].code + '">' + key + '</option>';
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
        $('#video-file-path-hidden').attr('accept', files.supported.video.join());
        $('#subtitle-file-path-hidden').attr('accept', files.supported.subtitle.join());
    },

    // STARTUP: nwjs sometimes can be out of the screen
    checkVisible: function (options) {
        var screen = window.screen;
        var defaultWidth = pkJson.window.width;
        var defaultHeight = pkJson.window.height;

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
        if (!fs.existsSync('./osu.json')) return;

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
        $('.version').text('v' + version + ' - ');
    }
};
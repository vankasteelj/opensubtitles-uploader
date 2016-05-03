var misc = {

    // AUTO or USERINTERACTION: open url in browser
    openExternal: function (link) {
        gui.Shell.openExternal(link);
    },

    // USERINTERACTION: open imdb link in browser
    openImdb: function () {
        var id = $('#imdb-info').attr('imdbid');
        if (id) misc.openExternal('http://www.imdb.com/title/' + id);
    },

    // USERINTERACTION: restart app (used by keyboard.setupShortcuts)
    restartApp: function () {
        var argv = gui.App.fullArgv,
            CWD = process.cwd();

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
        var menu = new gui.Menu(),
            clipboard = gui.Clipboard.get(),

            cut = new gui.MenuItem({
                label: cutLabel,
                click: function () {
                    document.execCommand('cut');
                }
            }),

            copy = new gui.MenuItem({
                label: copyLabel,
                click: function () {
                    // on readonly fields, execCommand doesn't work
                    if ($('#' + field).attr('readonly') && misc.getSelection($('#' + field)[0]) === null) {
                        clipboard.set($('#' + field).val());
                    } else {
                        document.execCommand('copy');
                    }
                }
            }),

            paste = new gui.MenuItem({
                label: pasteLabel,
                click: function () {
                    document.execCommand('paste');
                }
            });

        if (cutLabel) menu.append(cut);
        if (copyLabel) menu.append(copy);
        if (pasteLabel) menu.append(paste);

        return menu;
    },

    // AUTO: get active selection (used by misc.contextMenu)
    getSelection: function (textbox) {
        var selectedText = null;
        var activeElement = document.activeElement;

        if (activeElement && (activeElement.tagName.toLowerCase() == "textarea" || (activeElement.tagName.toLowerCase() == "input" && activeElement.type.toLowerCase() == "text")) && activeElement === textbox) {
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
        if (localStorage.availableUpdate && localStorage.availableUpdate !== '' && localStorage.availableUpdate > version) {
            $('#notification').html(i18n.__('New version available, download %s now!', '<a onClick="misc.openExternal(\'' + localStorage.availableUpdateUrl + '\')">v' + localStorage.availableUpdate + '</a>'));
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

                if (avail_version > version) {
                    localStorage.availableUpdate = avail_version;
                    localStorage.availableUpdateUrl = releasesUrl;
                    console.info('Update %s available:', avail_version, releasesUrl);
                    $('#notification').html(i18n.__('New version available, download %s now!', '<a onClick="misc.openExternal(\'' + localStorage.availableUpdateUrl + '\')">v' + localStorage.availableUpdate + '</a>'));
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
    }
};
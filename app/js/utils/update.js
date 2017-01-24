'use strict';

const Update = {
    // AUTO: setup auto-update checkbox
    setupCheckbox: () => {
        localStorage.autoUpdate = localStorage.autoUpdate === undefined ? true : localStorage.autoUpdate;
        $('#app-update').prop('checked', JSON.parse(localStorage.autoUpdate)).on('click', () => {
            const isActive = JSON.parse(localStorage.autoUpdate);
            localStorage.autoUpdate = !isActive;
            $('#app-update').prop('checked', !isActive);

            if (isActive) {
                $('#notification').hide();
            } else {
                Update.checkUpdates();
            }
        });
    },

    // STARTUP: check updates on app start, based on upstream git package.json
    checkUpdates: () => {
        // user chose not to be notified
        if (!JSON.parse(localStorage.autoUpdate)) {
            return;
        }

        // on start, set update text if not updated
        if (localStorage.availableUpdate && localStorage.availableUpdate > PKJSON.version) {
            Interface.modal(i18n.__('New version available, download %s now!', '<a onClick="Misc.openExternal(\'' + localStorage.availableUpdateUrl + '\')">v' + localStorage.availableUpdate + '</a>'), 'yes', 'no');
            // on click 'yes'
            $('.modal-yes').on('click', (e) => {
                Misc.openExternal(localStorage.availableUpdateUrl);
                win.close(true);
            });
            // on click 'no'
            $('.modal-no').on('click', (e) => {
                Interface.reset('modal');
            });
        }

        // only check every 7 days
        if (parseInt(localStorage.lastUpdateCheck) + 604800000 > Date.now()) {
            return;
        }

        localStorage.lastUpdateCheck = Date.now();

        // fetch remote package.json
        const url = 'https://raw.githubusercontent.com/vankasteelj/opensubtitles-uploader/master/package.json';
        https.get(url, (res) => {
            const body = '';

            res.on('data', (chunk) => {
                body += chunk.toString();
            });

            res.on('end', () => {
                const avail_version = JSON.parse(body).version;
                const releasesUrl = JSON.parse(body).releases;

                if (avail_version > PKJSON.version) {
                    localStorage.availableUpdate = avail_version;
                    localStorage.availableUpdateUrl = releasesUrl;
                    console.info('Update %s available:', avail_version, releasesUrl);

                    Interface.modal(i18n.__('New version available, download %s now!', '<a onClick="Misc.openExternal(\'' + localStorage.availableUpdateUrl + '\')">v' + localStorage.availableUpdate + '</a>'), 'yes', 'no');
                    // on click 'yes'
                    $('.modal-yes').on('click', (e) => {
                        Misc.openExternal(localStorage.availableUpdateUrl);
                        win.close(true);
                    });
                    // on click 'no'
                    $('.modal-no').on('click', (e) => {
                        Interface.reset('modal');
                    });

                } else {
                    localStorage.removeItem('availableUpdate');
                    localStorage.removeItem('availableUpdateUrl');
                    console.debug('No update available');
                }
            });
        }).on('error', (e) => {
            console.error('Unable to look for updates', e);
        });
    },
};
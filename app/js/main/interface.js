var interface = {

    // USERINTERACTION: switch between light/dark themes
    switchTheme: function () {
        // switch stored setting on click
        localStorage.theme = !localStorage || (localStorage && localStorage.theme === 'dark') ? 'light' : 'dark';
        // reload to let setupTheme do the job
        win.reload();
    },

    // USERINTERACTION: on "browse" button click, invoke hidden input action
    browse: function (type) {
        console.info('Opening File Browser');
        var input = document.querySelector('#' + type + '-file-path-hidden');
        input.click();
    },

    // USERINTERACTION: adds video file to main interface after analyzis
    add_video: function (file, multidrop) {
        console.info('Adding new video!');
        // show spinner
        $('#main-video-shadow').show().css('opacity', '1');

        var info = {};
        // extract info form video file
        OS.extractInfo(file).then(function (data) {
            // cache results
            info = {
                moviefilename: path.basename(file),
                moviebytesize: data.moviebytesize,
                moviehash: data.moviehash,
                quality: files.extractQuality(path.basename(file))
            };
            // try to find imdb match in OS api
            return OS.identify(file);
        }).then(function (data) {
            // cache results
            if (data.metadata && data.metadata.imdbid) {
                info.metadata = data.metadata;
                info.imdbid = data.metadata.imdbid;
            }
            // get mediainfo data on the file
            return files.mediainfo(file);
        }).then(function (metadata) {
            // fill visible interface with cached data
            interface.reset('video');

            // 1st column with OS data
            $('#video-file-path').val(file);
            $('#moviefilename').val(info.moviefilename);
            $('#moviebytesize').val(info.moviebytesize);
            $('#moviehash').val(info.moviehash);
            if (info.quality && info.quality.match(/720|1080/i)) {
                $('#highdefinition').prop('checked', true);
            }

            // 2nd column with MediaInfo data
            $('#movietimems').val(metadata.duration ? metadata.duration.toString().split('.')[0] : undefined);
            $('#moviefps').val(metadata.frame_rate);
            $('#movieframes').val(metadata.frame_count);

            // extra: HD is hard to autodetect, check again with MediaInfo data
            $('#highdefinition').prop('checked', (metadata.height >= 720 || (metadata.width >= 1280 && metadata.height >= 536))); // cut cinebar can be down to 536px


            // check IMBB data
            $('.search-imdb i').addClass('fa-circle-o-notch fa-spin').removeClass('fa-search'); // display spinner for little imdb button
            if (info.metadata && info.imdbid) {
                // OS.identify gave title & imdb id
                var title = '',
                    d = info.metadata;
                if (d.episode_title) {
                    title += d.title + ' S' + misc.pad(d.season) + 'E' + misc.pad(d.episode) + ', ' + d.episode_title + ' (' + d.year + ')';
                } else {
                    title += d.title + ' (' + d.year + ')';
                }
                interface.imdbFromSearch(info.imdbid, title);
            } else {
                // OS.identify gave imdb only, grab title from API
                if (info.imdbid) {
                    opensubtitles.imdbMetadata(info.imdbid);
                } else {
                    // not found with OS.identify, trying harder
                    OS.login().then(function (token) {
                        return OS.api.GuessMovieFromString(token, [info.moviefilename]);
                    }).then(function (res) {
                        if (res.data && res.data[info.moviefilename] && res.data[info.moviefilename]['BestGuess']) {
                            // OS.api.GuessMovieFromString got info!
                            var d = res.data[info.moviefilename]['BestGuess'],
                                id = d['IMDBEpisode'] || d['IDMovieIMDB'];
                            opensubtitles.imdbMetadata(id);
                        } else {
                            // nothing was found, remove spin and leave field empty
                            $('.search-imdb i').addClass('fa-search').removeClass('fa-circle-o-notch fa-spin');
                        }
                    });
                }
            }

            // auto-detect matching subtitle if the user didn't drop both video+text files
            if (!multidrop) {
                // Hack RegExp, required for special chars
                RegExp.escape = function (s) {
                    return String(s).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
                };
                // read directory video is from, looking for sub
                fs.readdir(path.dirname(file), function (err, f) {
                    if (err) return;
                    for (var i = 0; i < f.length; i++) {
                        if (f[i].slice(0, f[i].length - path.extname(f[i]).length).match(RegExp.escape(path.basename(file).slice(0, path.basename(file).length - path.extname(file).length))) && files.detectFileType(f[i]) === 'subtitle') {
                            // if match found, load it :) 
                            console.info('Matching subtitle detected');
                            interface['add_subtitle'](path.join(path.dirname(file), f[i]));
                            break;
                        }
                    }
                });
            }

            // we're done here, spinner can go rest
            $('#main-video-shadow').css('opacity', '0').hide();
        }).catch(function (err) {
            // something terrible happened during the info extraction process
            interface.reset('video');
            // hide spinner
            $('#main-video-shadow').css('opacity', '0').hide();
            // notify the error to user
            if (err.body && err.body.match(/50(3|6)/)) {
                notify.snack(i18n.__('Video cannot be imported because OpenSubtitles could not be reached. Is it online?'), 4500);
            } else {
                notify.snack(i18n.__('Unknown OpenSubtitles related error, please retry later or report the issue'), 4500);
            }
            console.error(err);
        });
    },

    // AUTO: displays logged-in user
    logged: function () {
        console.info('Logged in!');
        $('#not-logged').hide();
        $('#logged').show();
        $('#logged-as .username').text(localStorage.os_user);
    },

    // USERINTERACTION: log out
    logout: function () {
        console.info('Logged out!');
        $('#login-username').val(localStorage.os_user);
        localStorage.removeItem('os_user');
        localStorage.removeItem('os_pw');
        $('#logged').hide();
        $('#not-logged').show();
    },

    animate: function (el, cl, duration) {
        $(el).addClass(cl).delay(duration).queue(function () {
            $(el).removeClass(cl).dequeue();
        });
    },

    // USERINTERACTION: adds subtitle file to main interface after analyzis
    add_subtitle: function (file, multidrop) {
        console.info('Adding new subtitle!');
        interface.reset('subtitle');
        $('#subtitle-file-path').val(file);
        $('#subfilename').val(path.basename(file));
        // grab md5 hash
        OS.computeMD5(file).then(function (data) {
            $('#subhash').val(data);
        });
        // try to detect lang of the subtitle
        files.detectSubLang();
    },

    // AUTO or USERINTERACTION: resets the interface, erasing values
    reset: function (type) {
        if (type) console.debug('Clear form:', type);
        switch (type) {
            case 'video':
                $('#video-file-path').val('');
                $('#video-file-path-hidden').val('');
                $('#moviefilename').val('');
                $('#moviehash').val('');
                $('#moviebytesize').val('');
                $('#imdbid').val('');
                $('#movieaka').val('');
                $('#moviereleasename').val('');
                $('#moviefps').val('');
                $('#movietimems').val('');
                $('#movieframes').val('');

                $('#highdefinition').prop('checked', false);
                $('#imdb-info').attr('title', '').hide();
                $('#main-video').css('border-color', '');
                if ($('#upload-popup').css('display') === 'block') interface.reset('modal');
                break;
            case 'subtitle':
                $('#subtitle-file-path').val('');
                $('#subtitle-file-path-hidden').val('');
                $('#subfilename').val('');
                $('#subhash').val('');
                $('#subauthorcomment').val('');
                $('#subtranslator').val('');

                $('#hearingimpaired').prop('checked', false);
                $('#automatictranslation').prop('checked', false);

                $('#sublanguageid').val('');
                $('#main-subtitle').css('border-color', '');
                if ($('#upload-popup').css('display') === 'block') interface.reset('modal');
                interface.restoreLocks();
                break;
            case 'search':
                $('#search-text').val('');
                $('#search-result').html('');
                break;
            case 'modal':
                $('#modal-content').html('');
                $('#modal-buttons > div').removeClass('left right').hide();
                $('#upload-popup').css('opacity', 0).hide();
                $('#modal-buttons .modal-open').attr('data-url', '');
                $('#button-upload i').removeClass('fa-check fa-quote-left fa-close').addClass('fa-cloud-upload');
                break;
            default:
                // blank sheet, remove everything
                interface.reset('video');
                interface.reset('subtitle');
                interface.reset('modal');
                interface.reset('search');
        }
    },

    // STARTUP or AUTO: restore the 'locks' settings
    restoreLocks: function () {
        var subauthorcomment = localStorage['lock-subauthorcomment'];
        var subtranslator = localStorage['lock-subtranslator'];
        if (subauthorcomment) {
            $('#subauthorcomment').val(subauthorcomment).prop('readonly', true);
            $('#lock-subauthorcomment').addClass('fa-lock').removeClass('fa-unlock');
        }
        if (subtranslator) {
            $('#subtranslator').val(subtranslator).prop('readonly', true);
            $('#lock-subtranslator').addClass('fa-lock').removeClass('fa-unlock');
        }
    },

    // NOTIFY: displays popup to user, with action buttons
    modal: function (text, btright, btleft) {
        // load the notification text
        $('#modal-content').html(text);
        // add buttons
        $('#modal-buttons .modal-' + btleft).addClass('left').show();
        $('#modal-buttons .modal-' + btright).addClass('right').show();
        // display built popup
        $('#upload-popup').show().css('opacity', 1);
    },

    // NOTIFY: show/hide "uploading" spinner
    spinner: function (show) {
        if (show) {
            $('#upload-modal').hide();
            $('#upload-popup').show().css('opacity', 1);
            $('#upload-spin').show();
        } else {
            $('#upload-spin').hide();
            $('#upload-popup').css('opacity', 0).hide();
            $('#upload-modal').show();
        }
    },

    // USERINTERACTION: open imdb search popup (actually using OS api)
    searchPopup: function () {
        console.debug('Opening IMDB search popup');
        // close popup on click elsewhere
        $(document).bind('mouseup', interface.leavePopup);

        var begin_title = [],
            clean_title = [],
            count = 0,
            toPush = 0,
            title = files.clearName($('#moviefilename').val()).split(' ');

        for (var t in title) {
            if (!title[t].match(/^(the|an|19\d{2}|20\d{2}|a|of|in)$/i)) {
                clean_title.push(title[t]);
                toPush++;
            }
        }
        for (var u in clean_title) {
            if (count < (toPush > 5 ? 4 : toPush - 1)) {
                begin_title.push(clean_title[u]);
                count++;
            }
        }
        $('#search-popup').show().css('opacity', 1);
        $('#search-text').val(begin_title.join(' '));
        $('#search-text').focus();
    },
    
    // USERINTERACTION or AUTO: close imdb search popup
    leavePopup: function (e) {
        if (!$('#search').is(e.target) && $('#search').has(e.target).length === 0) {
            console.debug('Closing IMDB search popup');
            // hide popup
            $('#search-popup').css('opacity', 0).hide();
            $('#search-result').hide();
            // reset default popup view
            $('#search').css({
                height: '20px',
                top: 'calc(50% - 80px)'
            });
            interface.reset('search');
            // remove the onclick event defined in searchPopup()
            $(document).unbind('mouseup', interface.leavePopup);
        }
    },

    // USERINTERACTION or AUTO: on click a result from imdb search popup, inject imdb id, tooltip text and close popup
    imdbFromSearch: function (id, title) {
        console.debug('Adding IMDB id to main form');
        
        // add leading 'tt'
        id = id > 9999999 ? id : 'tt' + id.toString().replace('tt', ''); // id over 9999999 is not imdb, but custom OS id

        // display the value
        $('#imdbid').val(id);
        $('#imdb-info').attr('title', 'IMDB: ' + title).attr('imdbid', id).show();

        // hide spinner for little imdb button, shown in add_video() and imdb udpate
        $('.search-imdb i').addClass('fa-search').removeClass('fa-circle-o-notch fa-spin');

        // close popup
        interface.leavePopup({});
    },

    // STARTUP: checks imdbid field for manual changes, then verify if new ID is valid
    setupImdbFocus: function () {
        var imdbFocusVal = false;
        $('#imdbid').focus(function (e) {
            // on focus, cache previous value
            imdbFocusVal = e.target.value;
        }).focusout(function (e) {
            // if new value is different, then a manual change was made
            if (e.target.value !== imdbFocusVal) {
                // invalidate cache
                imdbFocusVal = false;
                // check new value
                opensubtitles.imdbMetadata(e.target.value);
            }
        });
    },

    // USERINTERACTION: on 'lock icon' click, stores or cleans field value
    toggleSave: function (el) {
        var lockId = $(el).attr('id'),
            fieldId = lockId.substr(5);
        // if a value was stored
        if (localStorage[lockId] !== undefined) {
            $(el).addClass('fa-unlock').removeClass('fa-lock');
            document.getElementById(fieldId).removeAttribute('readonly');
            localStorage.removeItem(lockId);
            console.debug('%s disabled', lockId);
        // nothing was stored yet
        } else {
            var val = $('#' + fieldId).val();
            if (val) { // sometimes val can be '' empty string
                $(el).addClass('fa-lock').removeClass('fa-unlock');
                document.getElementById(fieldId).setAttribute('readonly', true);
                localStorage[lockId] = val;
                console.debug('%s enabled, storing \'%s\'', lockId, localStorage[lockId]);
            }
        }
    }
};
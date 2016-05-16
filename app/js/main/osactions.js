'use strict';

var OsActions = {

    // USERINTERACTION: log to OS and store creds
    login: function () {
        // use MD5 password to somewhat protect it, waiting for OS to have oauth
        var password = crypt.createHash('MD5').update($('#login-password').val()).digest('hex');
        var username = $('#login-username').val();

        // d41d8.. is '' empty string
        if (!username || password === 'd41d8cd98f00b204e9800998ecf8427e') {
            console.warn('OsActions.login() -> no password/username');
            if (!username) {
                Interface.animate($('#login-username'), 'warning', 1750);
            }
            if (password === 'd41d8cd98f00b204e9800998ecf8427e') {
                Interface.animate($('#login-password'), 'warning', 1750);
            }
            Interface.animate($('#button-login'), 'buzz', 1000);
            return;
        } else {
            console.debug('Logging in opensubtitles.org API');

            // spawn OS object
            OS = new openSubtitles({
                useragent: USERAGENT,
                ssl: true,
                username: username,
                password: password,
            });

            // actual login
            OS.api.LogIn(username, password, 'en', USERAGENT).then(function (response) {
                var infos = response.data;
                var token = response.token;

                if (token && infos) {
                    // store values for reuse
                    localStorage.os_id = infos.IDUser;
                    localStorage.os_rank = infos.UserRank;
                    localStorage.os_refreshed = Date.now();
                    localStorage.os_user = username;
                    localStorage.os_pw = password;

                    console.info('User information:', infos);

                    // logging success
                    Interface.logged();
                } else {
                    throw '401 Unauthorized';
                }
            }).catch(function (err) {
                console.error('OsActions.login()', err);

                // cache current html
                var original = $('#not-logged').html();
                // user-friendly error if possible
                var display_err = err === '401 Unauthorized' ? i18n.__('Wrong username or password') : (err.message || err);

                // overly complicated jquery uglyness to display error, then restore cached html
                $('#not-logged').html('<div id="logged"><span class="username warning">' + display_err + '</span><i class="icon icon-login i18n tooltipped buzz" id="button-login" onClick="OsActions.login()" title="Log in"></i>').delay(1850).queue(function () {
                    $('#not-logged').html(original);
                    $('#login-username').val(username);
                    $('#not-logged').dequeue();
                });
            });
        }
    },

    // STARTUP: fetches user info every 7 days, triggered by Interface.logged();
    refreshInfo: function () {
        OS.api.LogIn(localStorage.os_user, localStorage.os_pw, 'en', USERAGENT).then(function (response) {
            if (response.status.match(/200/)) {
                console.info('Refreshed user information:', response.data);
                localStorage.os_id = response.data.IDUser;
                localStorage.os_rank = response.data.UserRank;
                localStorage.os_refreshed = Date.now();
                Interface.logged();
            } else {
                throw 'Opensubtitles responded with non-200 status, relogging might fix'
            }
        }).catch(function (error) {
            console.error('Unable to refresh user information', error);
            Interface.logout();
        });
    },

    // STARTUP: check if user was previously logged, fires up OS module accordingly
    verifyLogin: function () {
        OS = new openSubtitles({
            useragent: USERAGENT,
            ssl: true
        });

        if (localStorage.os_user && localStorage.os_pw) {
            OS.credentials.username = localStorage.os_user;
            OS.credentials.password = localStorage.os_pw;
            Interface.logged();
        }
    },

    // USERINTERACTION: search imdb id through OS api, display results (search imdb popup)
    searchImdb: function () {
        // don't search without query
        if ($('#search-text').val() === '') {
            Interface.animate('#button-search', 'buzz', 1000);
            Interface.animate($('#search-text'), 'warning', 1750);
            return;
        }

        console.debug('Searching IMDB through opensubtitles API...');
        // display spinner
        $('#button-search').addClass('fa-circle-o-notch fa-spin').removeClass('fa-search');
        // erase content on new search (does nothing on 1st search)
        $('#search-result').html('');

        OS.login().then(function (token) {
            return OS.api.SearchMoviesOnIMDB(token, $('#search-text').val());
        }).then(function (response) {
            console.debug('Search Movies on IMDB response:', response);

            // sometimes response comes but without data
            if (response && response.status.match(/200/) && response.data && response.data.length > 1) {
                $('#search').animate({
                    height: '250px',
                    top: '140px'
                }, 300);
                $('#search-result').show();

                // add each possible movie/show/episode to answers
                var res = response.data;
                for (var i = 0; i < res.length; i++) {
                    if (!res[i].id) {
                        return;
                    }

                    // add element to list
                    $('#search-result').append('<li class="result-item" onClick="OsActions.imdbMetadata(\'' + res[i].id + '\')">' + res[i].title.replace(/\-$/, '') + '</li>');
                }

            } else {
                throw 'Opensubtitles.SearchMoviesOnIMDB() error, no details';
            }

            // hide spinner
            $('#button-search').addClass('fa-search').removeClass('fa-circle-o-notch fa-spin');
        }).catch(function (err) {
            console.error('SearchMoviesOnIMDB', err);
            $('#search').animate({
                height: '80px',
                top: '200px'
            }, 300);

            // display not found message on error
            $('#search-result').append('<li style="text-align:center;padding-right:20px;list-style:none;">' + i18n.__('Not found') + '</li>');
            $('#search-result').show();

            // hide spinner
            $('#button-search').addClass('fa-search').removeClass('fa-circle-o-notch fa-spin');
        });
    },

    // AUTO: grab metadata from OS based on imdb id
    imdbMetadata: function (id) {
        // close popup if open
        Interface.leavePopup({});

        // reset img
        $('#main-video-img').css('background-image', 'none').hide().css('opacity', '0');
        $('#main-video .input-file, #main-video .reset').removeClass('white-ph');
        $('#main-video-placeholder').css('background', 'transparent');

        // sometimes, ID is not an imdb id
        if (id > 9999999) {
            console.debug('OsActions.imdbMetadata(): %s is not a valid imdb id', id);
            // add os id
            $('#imdbid').val(id);
            $('#imdb-info').hide();
            return;
        }

        OS.login().then(function (token) {
            var imdbid = parseInt(id.toString().replace('tt', ''));

            // sometimes imdb could not be a number (and the user could write anything in there, we don't wanna spam the api with useless reqs)
            if (isNaN(imdbid)) {
                throw 'Wrong IMDB id';
            } else {
                // show spinner
                $('.search-imdb i').addClass('fa-circle-o-notch fa-spin').removeClass('fa-search');
                // search online
                return OS.api.GetIMDBMovieDetails(token, imdbid);
            }
        }).then(function (response) {
            // again, sometimes the response comes without data
            if (response && response.status.match(/200/) && typeof response.data === 'object') {
                console.info('Imdb Metadata:', response.data);
                var text = '';
                if (response.data.kind === 'episode') {
                    text += response.data.title.split('"')[1];
                    text += ' S' + Misc.pad(response.data.season) + 'E' + Misc.pad(response.data.episode);
                    text += ' - ' + response.data.title.split('"')[2];
                    text += ' (' + response.data.year + ')';
                    Misc.TmpMetadata = {
                        title: response.data.title.split('"')[1],
                        episode: response.data.episode,
                        season: response.data.season
                    };
                } else {
                    text += response.data.title;
                    text += ' (' + response.data.year + ')';
                }
                Interface.imdbFromSearch(response.data.id, text);
            } else {
                throw 'Unknown OpenSubtitles related error, please retry later or report the issue';
            }
        }).catch(function (e) {
            console.error(e);

            // hide spinner
            $('.search-imdb i').addClass('fa-search').removeClass('fa-circle-o-notch fa-spin');

            // reset imdb field
            $('#imdbid').val('');
            $('#imdb-info').hide();

            // notify
            var error = e.message || e;
            if (error.match('Unknown XML-RPC tag')) {
                error = 'OpenSubtitles is temporarily unavailable, please retry in a little while';
            } else if (error.match(/imdb id/i)) {
                error = 'Wrong IMDB id';
            } else {
                error = 'Something went wrong :(';
            }
            Notify.snack(i18n.__(error), 3500);
        });
    },

    // cache: prevents double upload
    isUploading: false,

    // USERINTERACTION: checks prerequisites before uploading
    verify: function () {
        // that's right, you can't upload the same sub twice by clicking twice, learnt that the hard way
        if (OsActions.isUploading) {
            return;
        }

        Interface.reset('modal');

        // checks prerequisites
        var required = ['#subtitle-file-path'];
        var missing = 0;
        for (var r in required) {
            if ($(required[r]).val() === '') {
                missing++;
                Interface.animate($(required[r]), 'warning', 1750);
            }
        }
        // alert user if prerequisites aren't met
        if (missing > 0) {
            Interface.animate('#button-upload', 'buzz', 1000);
            return;
        }

        // OSS suggestion, to better the database quality
        if ($('#imdbid').val() === '') {
            Interface.modal(i18n.__('You haven\'t specified an IMDB id for the video file. It is highly recommended to do so, to correctly categorize the subtitle and make it easy to download.'), 'edit', 'upload');
        } else {
            OsActions.upload();
        }
    },

    // AUTO or USERINTERACTION: upload subs
    upload: function () {
        // that's right, you can't upload the same sub twice by clicking twice, learnt that the hard way
        if (OsActions.isUploading) {
            return;
        }

        Interface.reset('modal');

        var obj_data = {
            path: $('#video-file-path').val(),
            subpath: $('#subtitle-file-path').val()
        };

        // load optionnal options in the request
        var optionnal = [
            '#sublanguageid',
            '#imdbid',
            '#highdefinition',
            '#hearingimpaired',
            '#moviereleasename',
            '#movieaka',
            '#moviefps',
            '#movieframes',
            '#movietimems',
            '#automatictranslation',
            '#foreignpartsonly',
            '#subauthorcomment',
            '#subtranslator'
         ];
        for (var o in optionnal) {
            if ($(optionnal[o]).val() !== '' && $(optionnal[o]).val() !== 'on') {
                obj_data[optionnal[o].replace('#', '')] = $(optionnal[o]).val();
            } else if ($(optionnal[o]).prop('checked')) {
                obj_data[optionnal[o].replace('#', '')] = true;
            }
        }

        console.debug('Trying to upload subtitle...');
        OsActions.isUploading = true;

        // button pulsing & spinner showing
        $('#button-upload i, #button-upload span').addClass('pulse');
        Interface.spinner(true);

        // upload flow
        OS.upload(obj_data).then(function (response) {
            // upload done, remove spinner & pulse icon
            OsActions.isUploading = false;
            Interface.spinner(false);
            $('#button-upload i, #button-upload span').removeClass('pulse');

            // check if post request was successfull
            if (response && response.status.match(/200/)) {
                if (response.alreadyindb === 1) {
                    // req success, but sub was already in DB
                    console.info('Subtitle already in opensubtitle\'s db');

                    var d = response.data;

                    // build modal according to response details. somewhat fragile code.
                    Interface.modal(i18n.__('Subtitle was already present in the database') + '.<br><li>' + (d.HashWasAlreadyInDb === 0 ? i18n.__('The hash has been added!') : i18n.__('The hash too...')) + '</li><li>' + (d.MoviefilenameWasAlreadyInDb === 0 ? i18n.__('The file name has been added!') : i18n.__('The file name too...')) + '</li>', 'ok');

                    // orange for success but not uploaded
                    $('#modal-line').css('background', '#e69500');

                    // icon button update
                    $('#button-upload i').removeClass('fa-cloud-upload').addClass('fa-quote-left');

                } else {
                    // sub was uploaded! yeay
                    console.info('Subtitle successfully uploaded!');

                    // if an url was passed, give user possibility of opening browser
                    if (response.data && response.data !== '') {
                        $('#modal-buttons .modal-open').attr('data-url', response.data);
                        Interface.modal(i18n.__('Subtitle was successfully uploaded!'), 'ok', 'open');
                    } else {
                        Interface.modal(i18n.__('Subtitle was successfully uploaded!'), 'ok');
                    }

                    // green for success
                    $('#modal-line').css('background', '#008c32');

                    // icon button update
                    $('#button-upload i').removeClass('fa-cloud-upload').addClass('fa-check');
                }
            } else {
                throw 'Something went wrong';
            }

        }).catch(function (err) {
            // def not uploading anymore...
            OsActions.isUploading = false;
            Interface.spinner(false);
            $('#button-upload i, #button-upload span').removeClass('pulse');

            console.error(err);

            // try to give user a friendly explaination of what went wrong
            var error;
            if ((err.body && err.body.match(/503/i)) || (err.code === 'ETIMEDOUT')) {
                error = 'OpenSubtitles is temporarily unavailable, please retry in a little while';
            } else if (err.body && err.body.match(/506/i)) {
                error = 'OpenSubtitles is under maintenance, please retry in a few hours';
            } else if (err.message && err.message.match(/402/i)) {
                error = 'The subtitle has invalid format, review it before uploading to OpenSubtitles (try removing URL that might be considered as advertising for a third party website)';
            } else {
                error = 'Something went wrong :(';
            }

            // build error modal
            Interface.modal(i18n.__(error), 'ok', 'retry');

            // red for failure. and blood. mostly blood.
            $('#modal-line').css('background', '#e60000');

            // icon button update
            $('#button-upload i').removeClass('fa-cloud-upload').addClass('fa-close');
        });
    }
};
var opensubtitles = {

    // USERINTERACTION: log to OS and store creds
    login: function () {
        // use MD5 password to somewhat protect it, waiting for OS to have oauth
        var password = crypt.createHash('MD5').update($('#login-password').val()).digest('hex');
        var username = $('#login-username').val();

        // d41d8.. is '' empty string
        if (!username || password === 'd41d8cd98f00b204e9800998ecf8427e') {
            console.warn('opensubtitles.login() -> no password/username');
            if (!username) {
                interface.animate($('#login-username'), 'warning', 1750);
            }
            if (password === 'd41d8cd98f00b204e9800998ecf8427e') {
                interface.animate($('#login-password'), 'warning', 1750);
            }
            interface.animate($('#button-login'), 'buzz', 1000);
            return;
        } else {
            console.debug('Logging in opensubtitles.org API');

            // spawn OS object
            OS = new OpenSubtitles({
                useragent: USERAGENT,
                ssl: true,
                username: username,
                password: password,
            });

            // store token, username & pw for reuse
            OS.login().then(function (token) {
                if (token) {
                    localStorage.os_user = username;
                    localStorage.os_pw = password;
                    interface.logged();
                } else {
                    throw 'Unknown error';
                }
            }).catch(function (err) {
                console.error('opensubtitles.login()', err);

                // cache current html
                var original = $('#not-logged').html();
                // user-friendly error if possible
                var display_err = err === '401 Unauthorized' ? i18n.__('Wrong username or password') : (err.message || err);

                // overly complicated jquery uglyness to display error, then restore cached html
                $('#not-logged').html('<div id="logged-as" style="color: #e60000">' + display_err + '</div>' + '<div id="button-login" onClick="opensubtitles.login()" class="button light buzz">' + i18n.__('Log in') + '</div>').delay(1850).queue(function () {
                    $('#not-logged').html(original);
                    $('#login-username').val(username);
                    $('#not-logged').dequeue();
                });
            });
        }
    },

    // STARTUP: check if user was previously logged, fires up OS module accordingly
    verifyLogin: function () {
        var auth = {
            useragent: USERAGENT,
            ssl: true
        };

        if (localStorage.os_user && localStorage.os_pw) {
            auth.username = localStorage.os_user;
            auth.password = localStorage.os_pw;
            interface.logged();
        }

        OS = new OpenSubtitles(auth);
    },

    // USERINTERACTION: search imdb id through OS api, display results (search imdb popup)
    searchImdb: function () {
        // don't search without query
        if ($('#search-text').val() === '') {
            interface.animate('#button-search', 'buzz', 1000);
            interface.animate($('#search-text'), 'warning', 1750);
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
                    if (!res[i].id) return;
                    $('#search-result').append('<li class="result-item" onClick="opensubtitles.imdbMetadata(' + res[i].id + ')">' + res[i].title.replace(/\-$/, '') + '</li>');
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
                console.debug('Imdb Metadata:', response.data);
                var text = '';
                if (response.data.kind === 'episode') {
                    text += response.data.title.split('"')[1];
                    text += ' S' + misc.pad(response.data.season) + 'E' + misc.pad(response.data.episode);
                    text += ' - ' + response.data.title.split('"')[2];
                    text += ' (' + response.data.year + ')';
                } else {
                    text += response.data.title;
                    text += ' (' + response.data.year + ')';
                }
                interface.imdbFromSearch(response.data.id, text);
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
            notify.snack(i18n.__(e.message || e), 3500);
        });
    },

    // cache: prevents double upload
    isUploading: false,

    // USERINTERACTION: checks prerequisites before uploading
    verify: function () {
        // that's right, you can't upload the same sub twice by clicking twice, learnt that the hard way
        if (opensubtitles.isUploading) {
            return;
        }

        interface.reset('modal');

        // checks prerequisites
        var required = ['#video-file-path', '#subtitle-file-path'];
        var missing = 0;
        for (var r in required) {
            if ($(required[r]).val() === '') {
                missing++;
                interface.animate($(required[r]), 'warning', 1750);
            }
        }
        // alert user if prerequisites aren't met
        if (missing > 0) {
            interface.animate('#button-upload', 'buzz', 1000);
            return;
        }

        // OSS suggestion, to better the database quality
        if ($('#imdbid').val() === '') {
            interface.modal(i18n.__('You haven\'t specified an IMDB id for the video file. It is highly recommended to do so, for correctly categorize the subtitle and make it easy to download.'), 'edit', 'upload');
        } else {
            opensubtitles.upload();
        }
    },

    // AUTO or USERINTERACTION: upload subs
    upload: function () {
        // that's right, you can't upload the same sub twice by clicking twice, learnt that the hard way
        if (opensubtitles.isUploading) {
            return;
        }

        interface.reset('modal');

        var obj_data = {
            path: $('#video-file-path').val(),
            subpath: $('#subtitle-file-path').val()
        }

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
        opensubtitles.isUploading = true;

        // button pulsing & spinner showing
        $('#button-upload i, #button-upload span').addClass('pulse');
        interface.spinner(true);

        // upload flow
        OS.upload(obj_data).then(function (response) {
            // upload done, remove spinner & pulse icon
            opensubtitles.isUploading = false;
            interface.spinner(false);
            $('#button-upload i, #button-upload span').removeClass('pulse');

            // check if post request was successfull
            if (response && response.status.match(/200/)) {
                // req success, but sub was already in DB
                if (response.alreadyindb === 1) {
                    console.debug('Subtitle already in opensubtitle\'s db');
                    var d = response.data;

                    // build modal according to response details. somewhat fragile code.
                    interface.modal(i18n.__('Subtitle was already present in the database') + '.<br><li>' + (d.HashWasAlreadyInDb === 0 ? i18n.__('The hash has been added!') : i18n.__('The hash too...')) + '</li><li>' + (d.MoviefilenameWasAlreadyInDb === 0 ? i18n.__('The file name has been added!') : i18n.__('The file name too...')) + '</li>', 'ok');

                    // orange for success but not uploaded
                    $('#modal-line').css('background', '#e69500');

                    // icon button update
                    $('#button-upload i').removeClass('fa-cloud-upload').addClass('fa-quote-left');

                // sub was uploaded! yeay
                } else {
                    console.debug('Subtitle successfully uploaded!');

                    // if an url was passed, give user possibility of opening browser
                    if (response.data && response.data !== '') {
                        $('#modal-buttons .modal-open').attr('data-url', response.data);
                        interface.modal(i18n.__('Subtitle was successfully uploaded!'), 'ok', 'open');
                    } else {
                        interface.modal(i18n.__('Subtitle was successfully uploaded!'), 'ok');
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
            opensubtitles.isUploading = false;
            interface.spinner(false);
            $('#button-upload i, #button-upload span').removeClass('pulse');

            console.error(err);

            // try to give user a friendly explaination of what went wrong
            var error;
            if (err.body && err.body.match(/503/i)) {
                error = 'OpenSubtitles is temporarily unavailable, please retry in a little while';
            } else if (err.body && err.body.match(/506/i)) {
                error = 'OpenSubtitles is under maintenance, please retry in a few hours';
            } else if (err.message && err.message.match(/402/i)) {
                error = 'The subtitle has invalid format, review it before uploading to OpenSubtitles (try removing URL that might be considered as advertising for a third party website)';
            } else {
                error = 'Something went wrong :(';
            }

            // build error modal
            interface.modal(i18n.__(error), 'ok', 'retry');

            // red for failure. and blood. mostly blood.
            $('#modal-line').css('background', '#e60000');

            // icon button update
            $('#button-upload i').removeClass('fa-cloud-upload').addClass('fa-close');
        });
    }
};
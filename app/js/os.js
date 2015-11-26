var USERAGENT = 'OSTestUserAgent';
var OS;

var OpenSubtitles = require('opensubtitles-api');

var opensubtitles = {
    login: function () {
        var username = $('#login-username').val();
        var password = require('crypto').createHash('MD5').update($('#login-password').val()).digest('hex');
        if (!username || password === 'd41d8cd98f00b204e9800998ecf8427e') {
            console.debug('opensubtitles.login() -> no password/username');
            if (!username) {
                misc.animate($('#login-username'), 'warning', 1750);
            }
            if (password === 'd41d8cd98f00b204e9800998ecf8427e') {
                misc.animate($('#login-password'), 'warning', 1750);
            }
            misc.animate($('#button-login'), 'buzz', 1000);
            return;
        } else {
            OS = new OpenSubtitles({
                useragent: USERAGENT,
                ssl: true,
                username: username,
                password: password,
            });
            OS.login().then(function (token) {
                if (token) {
                    localStorage.os_user = username;
                    localStorage.os_pw = password;
                    opensubtitles.logged();
                } else {
                    throw new Error('Unknown error');
                }
            }).catch(function (err) {
                console.error('opensubtitles.login()', err);
                var original = $('#not-logged').html();
                var display_err = err === '401 Unauthorized' ? 'Wrong username or password' : (err.message || err);
                $('#not-logged').html('<div id="logged-as" style="color: #e60000">' + display_err + '</div>' + '<div id="button-login" onClick="opensubtitles.login()" class="button light buzz">Login</div>').delay(1850).queue(function () {
                    $('#not-logged').html(original);
                    $('#login-username').val(username);
                    $('#not-logged').dequeue();
                });
            });
        }
    },
    verify_login: function () {
        var auth = {
            useragent: USERAGENT,
            ssl: true
        };

        if (localStorage.os_user && localStorage.os_pw) {
            auth.username = localStorage.os_user;
            auth.password = localStorage.os_pw;
            opensubtitles.logged();
        }

        OS = new OpenSubtitles(auth);
    },
    logged: function () {
        $('#not-logged').hide();
        $('#logged').show();
        $('#logged-as').text('Logged in as %username%'.replace('%username%', localStorage.os_user));
    },
    logout: function () {
        $('#login-username').val(localStorage.os_user);
        localStorage.removeItem('os_user');
        localStorage.removeItem('os_pw');
        $('#logged').hide();
        $('#not-logged').show();
    },
    search_imdb: function () {
        if ($('#search-text').val() === '') {
            misc.animate('#button-search', 'buzz', 1000);
            misc.animate($('#search-text'), 'warning', 1750);
            return;
        }
        $('#search-result').html('');
        OS.login().then(function (token) {
            return OS.api.SearchMoviesOnIMDB(token, $('#search-text').val());
        }).then(function (response) {
            if (response && response.status.match(/200/) && response.data && response.data.length > 0) {
                $('#search').animate({
                    height: '250px',
                    top: '140px'
                }, 300);
                $('#search-result').show();
                var res = response.data;
                for (var i = 0; i < res.length; i++) {
                    if (!res[i].id) return;
                    $('#search-result').append('<li class="result-item" onClick="interface.imdb_fromsearch(' + res[i].id + ')">' + res[i].title + '</li>')
                }
            } else {
                throw new Error('Opensubtitles.SearchMoviesOnIMDB() error, no details')
            }
        }).catch(function (err) {
            console.error(err);
        });
    },
    upload: function () {
        interface.reset('upload');
        var required = ['#video-file-path', '#subtitle-file-path'];
        var missing = 0;
        for (var r in required) {
            if ($(required[r]).val() === '') {
                missing++;
                misc.animate($(required[r]), 'warning', 1750);
            }
        }
        if (missing > 0) {
            misc.animate('#button-upload', 'buzz', 1000);
            return;
        }

        var obj_data = {
            path: $('#video-file-path').val(),
            subpath: $('#subtitle-file-path').val()
        }

        var optionnal = ['#sublanguageid',
            '#imdbid',
            '#highdefinition',
            '#hearingimpaired',
            '#moviereleasename',
            '#movieaka',
            '#moviefps',
            '#movieframes',
            '#movietimems',
            '#automatictranslation',
            '#subauthorcomment'
         ];
        for (var o in optionnal) {
            if ($(optionnal[o]).val() !== '' && $(optionnal[o]).val() !== 'on') {
                obj_data[optionnal[o].replace('#', '')] = $(optionnal[o]).val();
            } else if ($(optionnal[o]).prop('checked')) {
                obj_data[optionnal[o].replace('#', '')] = true;
            }
        }
        OS.upload(obj_data).then(function (response) {
            console.log(response);
            
            if (response && response.status.match(/200/)) {
                if (response.alreadyindb === 1) {
                    var d = response.data;
                    $('#upload-partial').html('Subtitle was already present in the database.<br><li>The hash %hash%</li>'.replace('%hash%', d.HashWasAlreadyInDb === 0 ? 'has been added!':'too...'));
                    $('#upload-partial').append('<li>The file name %filename%</li>'.replace('%filename%', d.MoviefilenameWasAlreadyInDb === 0 ? 'has been added!':'too...'));
                    $('#button-upload').addClass('partial');
                    $('#upload-partial').show();
                } else {
                    $('#button-upload').addClass('success');
                    $('#upload-success').show();
                }
            } else {
                throw 'Something went wrong';
            }
        }).catch(function(err) {
            console.error(err);
            $('#button-upload').addClass('fail');
            $('#upload-fail').show();
        });
    }
};
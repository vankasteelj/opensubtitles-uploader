var USERAGENT = 'OSTestUserAgent';
var OS;

var OpenSubtitles = require('opensubtitles-api');

var opensubtitles = {
    login: function() {
        var username = $('#login-username').val();
        var password = require('crypto').createHash('MD5').update($('#login-password').val()).digest('hex');
        if (!username || password === 'd41d8cd98f00b204e9800998ecf8427e') {
            console.debug('opensubtitles.login() -> no password/username');
            if (!username) {
                animate($('#login-username'), 'red', 1750);
            }
            if (password === 'd41d8cd98f00b204e9800998ecf8427e') {
                animate($('#login-password'), 'red', 1750);
            }
            animate($('#button-login'), 'buzz', 1000);
            return;
        } else {
            OS = new OpenSubtitles({
                useragent: USERAGENT,
                ssl: true,
                username: username,
                password: password,
            });
            OS.login().then(function(token) {
                if (token) {
                    localStorage.os_user = username;
                    localStorage.os_pw = password;
                    opensubtitles.logged();
                } else {
                    throw new Error('Unknown error');
                }
            }).catch(function(err) {
                console.error('opensubtitles.login()', err);
                var original = $('#not-logged').html();
                var display_err = err === '401 Unauthorized' ? 'Wrong username or password' : (err.message || err);
                $('#not-logged').html('<div id="logged-as" style="color:red">' + display_err + '</div>' + '<div id="button-login" onClick="opensubtitles.login()" class="button light buzz">Login</div>').delay(1850).queue(function() {
                    $('#not-logged').html(original);
                    $('#login-username').val(username);
                    $('#not-logged').dequeue();
                });
            });
        }
    },
    verify_login: function() {
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
    logged: function() {
        $('#not-logged').hide();
        $('#logged').show();
        $('#logged-as').text($('#logged-as').text().replace('%username%', localStorage.os_user));
    },
    logout: function() {
        $('#login-username').val(localStorage.os_user);
        localStorage.removeItem('os_user');
        localStorage.removeItem('os_pw');
        $('#logged').hide();
        $('#not-logged').show();
    }
};
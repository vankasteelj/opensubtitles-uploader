'use strict';

var Keyboard = {

    // STARTUP: setup keyboard shortcuts
    setupShortcuts: function () {
        document.addEventListener('keypress', function (key) {
            if (key.charCode === 13) {
                Keyboard.keyEnter(key.target.id);
            } else if (key.ctrlKey && key.charCode === 4) {
                gui.Window.get().showDevTools();
            } else if (key.ctrlKey && key.charCode === 18) {
                Misc.restartApp();
            }
        });
        document.addEventListener('keyup', function (key) {
            if (key.keyCode === 27) {
                $('#search-popup').css('opacity', 0).hide();
                Interface.reset('search');
            }
        });
    },

    // AUTO: when user presses 'enter', triggered from Keyboard.setupShortcuts()
    keyEnter: function (id) {
        // comment can have multiple lines, so ignore it
        if (!id || id === 'subauthorcomment') {
            return;

        // login fields is user trying to log in, enter means 'login now'
        } else if (id === 'login-username' || id === 'login-password') {
            $('#button-login').click();

        // enter on search bar starts the search
        } else if (id === 'search-text') {
            $('#button-search').click();

        // enter on other inputs behaves like tab key
        } else {
            var inputs = $(':input');
            var nextInput = inputs.get(inputs.index(document.activeElement) + 1);

            if (nextInput) {
                nextInput.focus();
            }
        }
    },
};
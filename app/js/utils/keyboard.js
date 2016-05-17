'use strict';

var Keyboard = {

    // STARTUP: setup keyboard shortcuts
    setupShortcuts: function () {
        document.addEventListener('keypress', function (key) {
            if (key.charCode === 13) {
                Keyboard.keyEnter(key.target.id);
            } else if (key.keyCode === 27) {
                $('#search-popup').css('opacity', 0).hide();
                Interface.reset('search');
            } else if (key.ctrlKey && key.charCode === 4) {
                gui.Window.get().showDevTools();
            } else if (key.ctrlKey && key.charCode === 18) {
                Misc.restartApp();
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

        // enter on checkboxes toggles the state
        } else if ($('#'+id).attr('type') === 'checkbox') {
            $('#'+id).prop('checked', !$('#'+id).prop('checked'));

        // enter on other inputs behaves like tab key
        } else {
            Keyboard.selectNextInput();
        }
    },

    // select next valid input
    selectNextInput: function () {
        var inputs = $(':input');
        var actualIndex = inputs.index(document.activeElement);

        function next(index) {
            var nextInput = inputs.get(index + 1);

            if (nextInput) {
                // if element is invisible or readonly, skip to next
                if (!$(nextInput).is(':visible') || $(nextInput).attr('readonly')) {
                    next(index + 1);
                } else {
                    nextInput.focus();
                }
            }
        }

        next(actualIndex);
    }
};
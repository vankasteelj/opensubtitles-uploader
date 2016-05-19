'use strict'
var Themes = {
    availableThemes: ['light', 'dark'],
    defaultTheme: 'light',

    // STARTUP: build dropdown menu for changing app theme
    setupDropdown: function () {
        // build dropdown
        for (var name in Themes.availableThemes) {
            // insert element in dropdown
            var theme = Themes.availableThemes[name];
            $('#app-theme').append('<option value="'+theme+'">'+theme+'</option>');
            
            // select if active
            if (theme === localStorage.theme) {
                $('#app-theme').val(theme);
            }
        }

        // on dropdown click, change lang
        $('#app-theme').on('change', function (e) {
            // store new lang
            localStorage.theme = e.target.value;
            // reload to use new lang
            Misc.saveState();
            win.reload();
        });
    },

    // STARTUP: checks which theme user prefers then injects css theme file
    loadTheme: function () {
        // which theme to use?
        var theme = localStorage && localStorage.theme ? localStorage.theme : Themes.defaultTheme;
        // inject the css file
        document.getElementById('theme').href = 'css/themes/' + theme.toLowerCase() + '.css';
        // store setting
        localStorage.theme = theme;
    },
};
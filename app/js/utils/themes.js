'use strict';

const Themes = {
    availableThemes: ['light', 'dark'],
    defaultTheme: 'dark',

    // STARTUP: build dropdown menu for changing app theme
    setupDropdown: () => {
        // build dropdown
        for (let name in Themes.availableThemes) {
            // insert element in dropdown
            const theme = Themes.availableThemes[name];
            $('#app-theme').append('<option value="'+theme+'">'+theme+'</option>');
            
            // select if active
            if (theme === localStorage.theme) {
                $('#app-theme').val(theme);
            }
        }

        // on dropdown click, change lang
        $('#app-theme').on('change', (e) => {
            // store new lang
            localStorage.theme = e.target.value;
            // reload to use new lang
            Misc.saveState();
            win.reload();
        });
    },

    // STARTUP: checks which theme user prefers then injects css theme file
    loadTheme: () => {
        // which theme to use?
        const theme = localStorage && localStorage.theme ? localStorage.theme : Themes.defaultTheme;
        // inject the css file
        document.getElementById('theme').href = 'css/themes/' + theme.toLowerCase() + '.css';
        // store setting
        localStorage.theme = theme;
    },
};
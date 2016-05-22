'use strict';

var Localization = {

    // cache
    availableLocales: ['en', 'fr', 'es', 'nl', 'fi', 'pl', 'pt', 'pt-br', 'ro', 'sk'],
    detectedLocale: false,

    // STARTUP: load i18n and set locales, then localize app
    setupLocalization: function () {
        // find if one of the available locales is the same as user environment
        Localization.detectLocale();

        // init i18n engine
        i18n.configure({
            defaultLocale: Localization.detectedLocale,
            locales: Localization.availableLocales,
            directory: './app/localization',
            updateFiles: false
        });

        // set lang to stored or detected one
        i18n.setLocale(localStorage.locale || Localization.detectedLocale);

        // localize HTML
        Localization.localizeApp();
    },

    // AUTO: autodetect lang based on OS information
    detectLocale: function () {
        // The full OS language (with localization, like 'en-uk')
        var pureLanguage = navigator.language.toLowerCase();
        // The global language name (without localization, like 'en')
        var baseLanguage = navigator.language.toLowerCase().slice(0, 2);

        if ($.inArray(pureLanguage, Localization.availableLocales) !== -1) {
            Localization.detectedLocale = pureLanguage;
        } else if ($.inArray(baseLanguage, Localization.availableLocales) !== -1) {
            Localization.detectedLocale = baseLanguage;
        } else {
            Localization.detectedLocale = 'en';
        }
    },

    // AUTO: translate the HTML based on <i18n> tags and .i18n classes
    localizeApp: function () {
        console.info('Using locale:', i18n.getLocale());

        var t = document.getElementsByTagName('i18n');
        var c = document.getElementsByClassName('i18n');

        for (var i = 0; i < t.length; i++) {
            if (t[i].innerText) {
                t[i].innerText = i18n.__(t[i].innerText);
            }
        }
        for (var j = 0; j < c.length; j++) {
            if (c[j].title) {
                c[j].title = i18n.__(c[j].title);
            }
            if (c[j].placeholder) {
                c[j].placeholder = i18n.__(c[j].placeholder);
            }
        }
    },

    // STARTUP: build dropdown menu for changing app localization
    setupDropdown: function () {
        // build dropdown
        for (var lang in Localization.availableLocales) {
            // find OSLANGS entry
            var osEntry;
            for (var i in OSLANGS) {
                if (OSLANGS[i].iso6391 === Localization.availableLocales[lang]) {
                    osEntry = OSLANGS[i];
                    break;
                }
            }

            // insert element in dropdown
            $('#app-language').append('<option value="'+osEntry.iso6391+'">'+osEntry.native+'</option>');
            
            // select if active
            if (osEntry.iso6391 === i18n.getLocale()) {
                $('#app-language').val(osEntry.iso6391);
            }
        }

        // on dropdown click, change lang
        $('#app-language').on('change', function (e) {
            // store new lang
            localStorage.locale = e.target.value;
            // reload to use new lang
            Misc.saveState();
            win.reload();
        });
    },
};
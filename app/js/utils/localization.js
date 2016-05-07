var localization = {

    // cache
    availableLocales: ['en', 'fr', 'nl', 'pl', 'ro', 'sk'],
    detectedLocale: false,

    // STARTUP: load i18n and set locales, then localize app
    setupLocalization: function () {
        // find if one of the available locales is the same as user environment
        localization.detectLocale();

        // init i18n engine
        i18n.configure({
            defaultLocale: localization.detectedLocale,
            locales: localization.availableLocales,
            directory: './app/localization'
        });

        // set lang to stored or detected one
        i18n.setLocale(localStorage.locale || localization.detectedLocale);

        // localize HTML
        localization.localizeApp();
    },

    // AUTO: autodetect lang based on OS information
    detectLocale: function () {
        // The full OS language (with localization, like 'en-uk')
        var pureLanguage = navigator.language.toLowerCase();
        // The global language name (without localization, like 'en')
        var baseLanguage = navigator.language.toLowerCase().slice(0, 2);

        var detected;
        if ($.inArray(pureLanguage, localization.availableLocales) !== -1) {
            detected = pureLanguage;
        } else if ($.inArray(baseLanguage, localization.availableLocales) !== -1) {
            detected = baseLanguage;
        } else {
            detected = 'en';
        }
        // cache it
        localization.detectedLocale = detected;
    },

    // AUTO: translate the HTML based on <i18n> tags and .i18n classes
    localizeApp: function () {
        console.info('Using locale:', i18n.getLocale());

        var t = document.getElementsByTagName('i18n');
        var c = document.getElementsByClassName('i18n');
        for (var i = 0; i < t.length; i++) {
            t[i].innerText = i18n.__(t[i].innerText);
        }
        for (var j = 0; j < c.length; j++) {
            c[j].title = i18n.__(c[j].title);
            c[j].placeholder = i18n.__(c[j].placeholder);
        }
    },

    // STARTUP: build dropdown menu for changing app localization
    setupLocaleFlags: function () {
        // default lang is the shown flag
        $('.dropdown dt a span').html('<img class="flag" src="images/flags/' + i18n.getLocale() + '.png"/>');

        // build dropdown
        for (var lang in localization.availableLocales) {
            // build html element
            var el = '<li><a><img class="flag tooltipped i18n" src="images/flags/' + localization.availableLocales[lang] + '.png" title="' + require('./localization/' + localization.availableLocales[lang] + '.json').currentLang + '"/><span class="value">' + localization.availableLocales[lang] + '</span></a></li>';
            // insert element in dropdown
            $('#app-locale ul').append(el);
        }

        // open dropdown on click
        $('.dropdown dt a').click(function () {
            $('.dropdown dd ul').toggle();
        });

        // on dropdown's flag click, change lang
        $('.dropdown dd ul li a').click(function () {
            // store new lang
            localStorage.locale = $(this).find('span.value').html();
            // reload to use new lang
            win.reload();
        });

        // hide dropdown if click elsewhere
        $(document).bind('click', function (e) {
            if (!$(e.target).parents().hasClass('dropdown')) {
                $('.dropdown dd ul').hide();
            }
        });
    },
};
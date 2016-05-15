'use strict';

var Localization = {

    // cache
    availableLocales: ['en', 'fr', 'nl', 'pl', 'pt', 'ro', 'sk'],
    detectedLocale: false,

    // STARTUP: load i18n and set locales, then localize app
    setupLocalization: function () {
        // find if one of the available locales is the same as user environment
        Localization.detectLocale();

        // init i18n engine
        i18n.configure({
            defaultLocale: Localization.detectedLocale,
            locales: Localization.availableLocales,
            directory: './app/localization'
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
        for (var lang in Localization.availableLocales) {
            // insert element in dropdown
            $('#app-locale ul').append('<li><a><img class="flag tooltipped i18n" src="images/flags/' + Localization.availableLocales[lang] + '.png" title="' + require('./localization/' + Localization.availableLocales[lang] + '.json').currentLang + '"/><span class="value">' + Localization.availableLocales[lang] + '</span></a></li>');
        }

        // open/close dropdown on click
        $('.dropdown dt a').click(function () {
            // show/hide dropdown
            $('.dropdown dd ul').toggle();
            // change arrow's position
            $(this).toggleClass('rotatecarret');
        });

        // on dropdown's flag click, change lang
        $('.dropdown dd ul li a').click(function () {
            // store new lang
            localStorage.locale = $(this).find('span.value').html();
            // reload to use new lang
            Misc.saveState();
            win.reload();
        });

        // hide dropdown if click elsewhere
        $(document).bind('click', function (e) {
            if (!$(e.target).parents().hasClass('dropdown')) {
                // hide dropdown
                $('.dropdown dd ul').hide();
                // set arrow downside (default)
                $('.dropdown dt a').removeClass('rotatecarret');
            }
        });
    },
};
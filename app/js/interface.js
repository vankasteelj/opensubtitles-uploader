var interface = {
    setup: function () {
        return new Promise(function (resolve, reject) {
            try {
                misc.checkPortable();
                misc.setupLocalization();
                interface.setupTheme();
                opensubtitles.verify_login();
                interface.check_visible();
                interface.setupInputs();
                interface.setupLangDropdown();
                interface.setupRightClicks();
                misc.keyboardShortcuts();
                interface.restoreLocks();
                interface.setupImdbFocus();
                interface.setupLocaleFlags();
                $('.tooltipped').tooltip({
                    'show': {duration: 500, delay: 400},
                    'hide': 500
                });
                $('.version').text('v' + version + ' - ');
                misc.checkUpdates();
                
                console.info('Application ready');
                setTimeout(resolve, 200);
            } catch(e) {
                console.error(e);
                win.showDevTools();
                reject();
            }
        });
    },
    switchTheme: function () {
        if (!localStorage || (localStorage && localStorage.theme === 'dark')) {
             localStorage.theme = 'light';
        } else {
             localStorage.theme = 'dark';
        }
        win.reload();
    },
    selectTheme: function (theme) {
        document.getElementById('theme').href = 'css/themes/'+ theme.toLowerCase() + '.css';
        localStorage.theme = theme;
        $('#switch-theme').css('color', theme === 'light' ? '#323a45' : '#f5f7fa');
    },
    setupTheme: function () {
        var theme = localStorage && localStorage.theme ? localStorage.theme : 'light';
        interface.selectTheme(theme);
    },
    setupRightClicks: function () {
        var inputs = $('input[type=text], textarea');
        inputs.each(function (i) {
            inputs[i].addEventListener('contextmenu', function(ev) {
                ev.preventDefault();
                var menu;
                if ($(inputs[i]).attr('readonly')) {
                    if (ev.target.value !== '') {
                        menu = new interface.context_Menu(null, i18n.__('Copy'), null, ev.target.id);
                    } else {
                        return;
                    }
                } else {
                    menu = new interface.context_Menu(i18n.__('Cut'), i18n.__('Copy'), i18n.__('Paste'), ev.target.id);
                }
                menu.popup(ev.x, ev.y);
                return false;
            }, false);
        });
    },
    setupLangDropdown: function () {
        $('#sublanguageid').append('<option value="">'+ i18n.__ ('None') + '</option>');
        var os_langs = require('./js/os-lang.json');

        var langs = '';
        for(var key in os_langs) {
            langs += '<option value="'+os_langs[key].code+'">'+key+'</option>';
        }
        $('#sublanguageid').append(langs);
    },
    setupInputs: function () {
        document.querySelector('#video-file-path-hidden').addEventListener('change', function(evt) {
            var file = $('#video-file-path-hidden')[0].files[0];
            window.ondrop({
                dataTransfer: {
                    files: [file]
                },
                preventDefault: function() {}
            });
        }, false);
        document.querySelector('#subtitle-file-path-hidden').addEventListener('change', function(evt) {
            var file = $('#subtitle-file-path-hidden')[0].files[0];
            window.ondrop({
                dataTransfer: {
                    files: [file]
                },
                preventDefault: function() {}
            });
        }, false);

        $('#video-file-path-hidden').attr('accept', misc.supportedTypes.video.join());
        $('#subtitle-file-path-hidden').attr('accept', misc.supportedTypes.subtitle.join());
    },
    setupImdbFocus: function () {
        var imdbFocusVal = false;
        $('#imdbid').focus(function (e) {
            imdbFocusVal = e.target.value;
        }).focusout(function (e) {
            if (e.target.value !== imdbFocusVal) {
                imdbFocusVal = false;
                opensubtitles.imdb_metadata(e.target.value);
            }
        });
    },
    setupLocaleFlags: function () {
        $('.dropdown dt a span').html('<img class="flag" src="images/flags/'+ i18n.getLocale() +'.png"/>');

        for (var lang in misc.availableLocales) {
            var el = '<li><a><img class="flag" src="images/flags/'+ misc.availableLocales[lang] +'.png"/><span class="value">'+ misc.availableLocales[lang] +'</span></a></li>';
            $('#app-locale ul').append(el);
        }

        $('.dropdown dt a').click(function() {
            $('.dropdown dd ul').toggle();
        });

        $('.dropdown dd ul li a').click(function() {
            var text = $(this).html();
            $('.dropdown dt a span').html(text);
            $('.dropdown dd ul').hide();
            localStorage.locale = getSelectedValue('app-locale');
            win.reload();
        });

        function getSelectedValue(id) {
            return $('#' + id).find('dt a span.value').html();
        }

        $(document).bind('click', function(e) {
            var $clicked = $(e.target);
            if (! $clicked.parents().hasClass('dropdown'))
                $('.dropdown dd ul').hide();
        });
    },
    browse: function(type) {
        console.info('Opening File Browser');
        var input = document.querySelector('#' + type + '-file-path-hidden');
        input.click();
    },
    check_visible: function(options) {
        var screen = window.screen;
        var defaultWidth = require('../package.json').window.width;
        var defaultHeight = require('../package.json').window.height;

        var width = parseInt(localStorage.width ? localStorage.width : defaultWidth);
        var height = parseInt(localStorage.height ? localStorage.height : defaultHeight);
        var x = parseInt(localStorage.posX ? localStorage.posX : -1);
        var y = parseInt(localStorage.posY ? localStorage.posY : -1);

        // reset x
        if (x < 0 || (x + width) > screen.width) {
            x = Math.round((screen.availWidth - width) / 2);
        }

        // reset y
        if (y < 0 || (y + height) > screen.height) {
            y = Math.round((screen.availHeight - height) / 2);
        }

        win.moveTo(x, y);
    },
    add_video: function (file, multidrop) {
        console.info('Adding new video!');
        $('#main-video-shadow').show().css('opacity', '1')

        var info = {};
        OS.extractInfo(file).then(function (data) {
            info = {
                moviefilename: path.basename(file),
                moviebytesize: data.moviebytesize,
                moviehash: data.moviehash,
                quality: misc.extractQuality(path.basename(file))
            };
            return OS.identify(file);
        }).then(function (data) {
            if (data.metadata && data.metadata.imdbid) {
                info.metadata = data.metadata;
                info.imdbid = data.metadata.imdbid;
            }
            return interface.mediainfo(file);
        }).then(function (metadata) {
            interface.reset('video');
            $('#video-file-path').val(file);
            $('#moviefilename').val(info.moviefilename);
            $('#moviebytesize').val(info.moviebytesize);
            $('#moviehash').val(info.moviehash);
            if (info.quality && info.quality.match(/720|1080/i)) $('#highdefinition').prop('checked', true);

            $('#movietimems').val(metadata.duration ? metadata.duration.toString().split('.')[0] : undefined);
            $('#moviefps').val(metadata.frame_rate);
            $('#movieframes').val(metadata.frame_count);
            $('#highdefinition').prop('checked', (metadata.height >= 720 || (metadata.width >= 1280 && metadata.height >= 536))); // cut cinebar can be down to 536px

            $('.search-imdb i').addClass('fa-circle-o-notch fa-spin').removeClass('fa-search');
            if (info.metadata && info.imdbid) {
                var title = '', d = info.metadata;
                if (d.episode_title) {
                    title += d.title + ' S' + misc.pad(d.season) + 'E' + misc.pad(d.episode) + ', ' + d.episode_title + ' (' + d.year + ')';
                } else {
                    title += d.title + ' (' + d.year + ')';
                }
                interface.imdb_fromsearch(info.imdbid, title);
            } else {
                if (info.imdbid) {
                    opensubtitles.imdb_metadata(info.imdbid);
                } else {
                    OS.login().then(function (token) {
                        return OS.api.GuessMovieFromString(token, [info.moviefilename]);
                    }).then(function (res) {
                        if (res.data && res.data[info.moviefilename] && res.data[info.moviefilename]['BestGuess']) {
                            var d = res.data[info.moviefilename]['BestGuess'], id = d['IMDBEpisode'] || d['IDMovieIMDB'];
                            opensubtitles.imdb_metadata(id);
                        } else {
                            $('.search-imdb i').addClass('fa-search').removeClass('fa-circle-o-notch fa-spin');
                        }
                    });
                }
            }

            // auto-detect matching subtitle
            if (!multidrop) {
                RegExp.escape = function(s){ // required for special chars
                    return String(s).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
                };
                fs.readdir(path.dirname(file), function (err, f) {
                    if (err) return;
                    for (var i = 0; i < f.length; i++) {
                        if (f[i].slice(0, f[i].length - path.extname(f[i]).length).match(RegExp.escape(path.basename(file).slice(0, path.basename(file).length - path.extname(file).length))) && misc.fileType(f[i]) === 'subtitle') {
                            console.info('Matching subtitle detected');
                            interface['add_subtitle'](path.join(path.dirname(file), f[i]));
                            break;
                        }
                    }
                });
            }

            $('#main-video-shadow').css('opacity', '0').hide();
        }).catch(function(err) {
            interface.reset('video');
            $('#main-video-shadow').css('opacity', '0').hide();
            if (err.body && err.body.match(/50(3|6)/)) {
                misc.notifySnack(i18n.__('Video cannot be imported because OpenSubtitles could not be reached. Is it online?'), 4500);
            } else {
                misc.notifySnack(i18n.__('Unknown OpenSubtitles related error, please retry later or report the issue'), 4500);
            }
            console.error(err);
        });
    },
    add_subtitle: function (file, multidrop) {
        console.info('Adding new subtitle!');
        interface.reset('subtitle');
        $('#subtitle-file-path').val(file);
        $('#subfilename').val(path.basename(file));
        OS.computeMD5(file).then(function (data) {
            $('#subhash').val(data);
        });
        misc.detect_lang();
    },
    reset: function (type) {
        if (type) console.debug('Clear form:', type);
        switch (type) {
            case 'video':
                $('#video-file-path').val('');
                $('#video-file-path-hidden').val('');
                $('#moviefilename').val('');
                $('#moviehash').val('');
                $('#moviebytesize').val('');
                $('#imdbid').val('');
                $('#movieaka').val('');
                $('#moviereleasename').val('');
                $('#moviefps').val('');
                $('#movietimems').val('');
                $('#movieframes').val('');

                $('#highdefinition').prop('checked', false);
                $('#imdb-info').attr('title', '').hide();
                $('#main-video').css('border-color', '');
                if ($('#upload-popup').css('display') === 'block') interface.reset('modal');
                break;
            case 'subtitle':
                $('#subtitle-file-path').val('');
                $('#subtitle-file-path-hidden').val('');
                $('#subfilename').val('');
                $('#subhash').val('');
                $('#subauthorcomment').val('');
                $('#subtranslator').val('');

                $('#hearingimpaired').prop('checked', false);
                $('#automatictranslation').prop('checked', false);

                $('#sublanguageid').val('');
                $('#main-subtitle').css('border-color', '');
                if ($('#upload-popup').css('display') === 'block') interface.reset('modal');
                interface.restoreLocks();
                break;
            case 'search':
                $('#search-text').val('');
                $('#search-result').html('');
                break;
            case 'modal':
                $('#modal-content').html('');
                $('#modal-buttons > div').removeClass('left right').hide();
                $('#upload-popup').css('opacity', 0).hide();
                $('#modal-buttons .modal-open').attr('data-url', '');
                $('#button-upload i').removeClass('fa-check fa-quote-left fa-close').addClass('fa-cloud-upload');
                break;
            default:
                interface.reset('video');
                interface.reset('subtitle');
                interface.reset('modal');
                interface.reset('search');
        }
    },
    modal: function (text, btright, btleft) {
        $('#modal-content').html(text);
        $('#modal-buttons .modal-'+btleft).addClass('left').show();
        $('#modal-buttons .modal-'+btright).addClass('right').show();
        $('#upload-popup').show().css('opacity', 1);
    },
    spinner: function (show) {
        if (show) {
            $('#upload-modal').hide();
            $('#upload-popup').show().css('opacity', 1);
            $('#upload-spin').show();
        } else {
            $('#upload-spin').hide();
            $('#upload-popup').css('opacity', 0).hide();
            $('#upload-modal').show();            
        }
    },
    searchPopup: function () {
        console.debug('Opening IMDB search popup');
        $(document).bind('mouseup', interface.leavePopup);

        var begin_title = [],
            clean_title = [],
            count = 0,
            toPush = 0,
            title = misc.clearName($('#moviefilename').val()).split(' ');

        for (var t in title) {
            if (!title[t].match(/^(the|an|19\d{2}|20\d{2}|a|of|in)$/i)) {
                clean_title.push(title[t]);
                toPush++;
            }
        }
        for (var u in clean_title) {
            if (count < (toPush > 5 ? 4 : toPush - 1) ) {
                begin_title.push(clean_title[u]);
                count++;
            }
        }
        $('#search-popup').show().css('opacity', 1);
        $('#search-text').val(begin_title.join(' '));
        $('#search-text').focus();
    },
    leavePopup: function (e) {
        var container = $('#search');
        if (!container.is(e.target) && container.has(e.target).length === 0) {
            console.debug('Closing IMDB search popup');
            $('#search-popup').css('opacity', 0).hide();
            $('#search-result').hide();
            $('#search').css({
                height: '20px',
                top: 'calc(50% - 80px)'
            });
            interface.reset('search');
            $(document).unbind('mouseup', interface.leavePopup);
        }
    },
    imdb_fromsearch: function (id, title) {
        console.debug('Adding IMDB id to main form');
        id = id > 9999999 ? id : 'tt'+id.toString().replace('tt','');
        $('#imdbid').val(id);
        $('#imdb-info').attr('title', 'IMDB: ' + title).attr('imdbid', id).show();
        $('.search-imdb i').addClass('fa-search').removeClass('fa-circle-o-notch fa-spin');
        interface.leavePopup({});
    },
    mediainfo: function (file) {
        return new Promise(function (resolve, reject) {
            var info = {};
            require('mediainfo-wrapper')(file).then(function (md) {
                if (md && md[0]) {
                    console.info('MediaInfo data:', md[0]);
                    // do we have video track?
                    if (md[0].video) {
                        var video = md[0].video[0], x;
                        
                        // duration
                        info.duration = md[0].general.duration ? (
                            md[0].general.duration[0].split(':').length > 1 ? (
                                x = md[0].general.duration[0].split(':'), 
                                x[0]*(1000*60*60) + x[1]*(1000*60) + x[2]*(1000)
                            ) : (
                                md[0].general.duration[0]
                            )
                        ) : ( 
                            video.duration ? (
                                video.duration[0].split(':').length > 1 ? (
                                    x = video.duration[0].split(':'), 
                                    x[0]*(1000*60*60) + x[1]*(1000*60) + x[2]*(1000)
                                ) : (
                                    video.duration[0]
                                )
                            ) : (
                                undefined
                            )
                        );

                        // others
                        info.frame_count = video.frame_count ? (
                            video.frame_count[0]
                        ) : (
                            video.number_of_frames ? (
                                video.number_of_frames[0]
                            ) : (
                                undefined
                            )
                        );
                        info.height = video.height ? video.height[0] : undefined;
                        info.width = video.width ? video.width[0] : undefined;

                        // framerate
                        info.frame_rate = video.frame_rate ? (
                            video.frame_rate[0]
                        ) : (
                            (info.frame_count && info.duration) ? (
                                x = (info.frame_count[0] / (info.duration[0]/1000)).toFixed(3),
                                x.match(/23\.9|24\.0|25\.0|29\.9|30\.0/) ? (
                                    x.match(/23\.97/) ? (
                                        '23.976' // round
                                    ) : (
                                        x
                                    )
                                ) : (
                                    undefined
                                )
                            ) : (
                                video.original_frame_rate ? (
                                    video.original_frame_rate[0]
                                ) : (
                                    undefined
                                )
                            )
                        );
                    }
                }
                resolve(info);
            }).catch(function (err) {
                // bypass error on mediainfo, it happens
                console.error('MediaInfo detection failed, continuing...', err);
                resolve(info);
            });
        });
    },
    keyEnter: function (id) {
        if (!id || id === 'subauthorcomment') {
            return;
        } else if (id === 'login-username' || id === 'login-password') {
            $('#button-login').click();
        } else if (id === 'search-text') {
            $('#button-search').click();
        } else {
            var inputs = $(':input');
            var nextInput = inputs.get(inputs.index(document.activeElement) + 1);
            if (nextInput) {
                nextInput.focus();
            }
        }
    },
    context_Menu: function (cutLabel, copyLabel, pasteLabel, field) {
        var menu = new gui.Menu(),
            clipboard = gui.Clipboard.get(),

            cut = new gui.MenuItem({
                label: cutLabel,
                click: function () {
                    document.execCommand('cut');
                }
            }),

            copy = new gui.MenuItem({
                label: copyLabel,
                click: function () {
                    if ($('#' + field).attr('readonly') && misc.getSelection($('#' + field)[0]) === null) {
                        clipboard.set($('#' + field).val());
                    } else {
                        document.execCommand('copy');
                    }
                }
            }),

            paste = new gui.MenuItem({
                label: pasteLabel,
                click: function () {
                    document.execCommand('paste');
                }
            });

        if (cutLabel) menu.append(cut);
        if (copyLabel) menu.append(copy);
        if (pasteLabel) menu.append(paste);

        return menu;
    },
    toggleSave: function (el) {
        var id = $(el).attr('id');
        if (localStorage[id] !== '$false' && localStorage[id] !== undefined) {
            $(el).addClass('fa-unlock').removeClass('fa-lock');
            localStorage[id] = '$false';
            console.debug('%s disabled', id);
        } else {
            $(el).addClass('fa-lock').removeClass('fa-unlock');
            localStorage[id] = $('#' + id.substr(5)).val();
            console.debug('%s enabled, storing \'%s\'', id, localStorage[id]);
        }
    },
    restoreLocks: function () {
        var subauthorcomment = localStorage['lock-subauthorcomment'] || '$false';
        var subtranslator = localStorage['lock-subtranslator'] || '$false';
        if (subauthorcomment !== '$false') {
            $('#subauthorcomment').val(subauthorcomment);
            $('#lock-subauthorcomment').addClass('fa-lock').removeClass('fa-unlock');
        }
        if (subtranslator !== '$false') {
            $('#subtranslator').val(subtranslator);
            $('#lock-subtranslator').addClass('fa-lock').removeClass('fa-unlock');
        }
    }
};

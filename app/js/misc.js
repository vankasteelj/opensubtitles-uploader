/*
 * important variables used in the app
 */
var gui = require('nw.gui'),
    win = gui.Window.get(),
    data_path = gui.App.dataPath,
    path = require('path');

var misc = {
    supportedTypes: {
        video: ['.3g2', '.3gp', '.3gp2', '.3gpp', '.60d', '.ajp', '.asf', '.asx', '.avchd', '.avi', '.bik', '.bix', '.box', '.cam', '.dat', '.divx', '.dmf', '.dv', '.dvr-ms', '.evo', '.flc', '.fli', '.flic', '.flv', '.flx', '.gvi', '.gvp', '.h264', '.m1v', '.m2p', '.m2ts', '.m2v', '.m4e', '.m4v', '.mjp', '.mjpeg', '.mjpg', '.mkv', '.moov', '.mov', '.movhd', '.movie', '.movx', '.mp4', '.mpe', '.mpeg', '.mpg', '.mpv', '.mpv2', '.mxf', '.nsv', '.nut', '.ogg', '.ogm', '.omf', '.ps', '.qt', '.ram', '.rm', '.rmvb', '.swf', '.ts', '.vfw', '.vid', '.video', '.viv', '.vivo', '.vob', '.vro', '.wm', '.wmv', '.wmx', '.wrap', '.wvx', '.wx', '.x264', '.xvid'],
        subtitle: ['.srt', '.sub', '.smi', '.txt', '.ssa', '.ass', '.mpl']
    },
    fileType: function (file) {
        var ext = path.extname(file).toLowerCase();
        if (misc.supportedTypes.video.indexOf(ext) > -1) {
            return 'video';
        } else if (misc.supportedTypes.subtitle.indexOf(ext) > -1) {
            return 'subtitle';
        } else {
            return null;
        }
    },
    animate: function (el, cl, duration) {
        $(el).addClass(cl).delay(duration).queue(function () {
            $(el).removeClass(cl).dequeue();
        });
    },
    extractQuality: function (title) {
        console.info('Detecting quality...');
        if (title.match(/720[pix]/i) && !title.match(/dvdrip|dvd\Wrip/i)) {
            return '720p';
        }
        if (title.match(/1080[pix]/i)) {
            return '1080p';
        }
        return false;
    },
    clearName: function (name) {
        var title = path.parse(name).name;
        return title
            .replace(/(400|480|720|1080)[pix]/gi, '') // quality clean
            .replace(/[xh]26\d|hevc|xvid|divx/gi, '') // codecs
            .replace(/bluray|bdrip|brrip|dsr|dvdrip|dvd\Wrip|hdtv|\Wts\W|telesync|\Wcam\W/gi, '') // source
            .replace(/\Wextended\W|\Wproper/ig, '') // specials
            .replace(/[\.]/g, ' ') // has '.'
            .replace(/^\[.*\]/, '') // starts with brackets
            .replace(/\[(\w|\d)+\]/g, '') // remove brackets
            .replace(/\((\w|\d)+\)/g, '') // remove parenthesis
            .replace(/_/g, ' ') // has '_'
            .replace(/-/g, ' ') // has '-'
            .replace(/\-$/, '') // ends with '-'
            .replace(/\s.$/, '') // ends with ' '
            .replace(/^\./, '') // starts with '.'
            .replace(/^\-/, '') // starts with '-'
            .replace(/ +/g, ' '); // has multiple spaces
    },
    detect_lang: function () {
        var sub = $('#subtitle-file-path').val();
        if (!sub || sub == '') {
            misc.animate($('#subtitle-file-path'), 'warning', 1750);
            return;
        }
        console.info('Detecting subtitle language...');
        $('.tooltipped').tooltip('close');
        $('.detect-lang i').addClass('fa-circle-o-notch fa-spin').removeClass('fa-magic');
        require('detect-lang')(sub).then(function (data) {
            if (data && data.probability > 45 && (data.iso6392 || data.bibliographic)) {
                $('#sublanguageid').val((data.iso6392 || data.bibliographic))
            } else {
                console.error(data);
                throw 'not conclusive enough';
            }
            $('.detect-lang i').addClass('fa-magic').removeClass('fa-circle-o-notch fa-spin')
        }).catch(function (err) {
            $('.detect-lang i').addClass('fa-magic').removeClass('fa-circle-o-notch fa-spin');
            console.error('misc.detect_lang() error:', err);
        });
    },
    openExternal: function (link) {
        gui.Shell.openExternal(link);
    },
    openImdb: function () {
        var id = $('#imdb-info').attr('imdbid');
        if (id) misc.openExternal('http://www.imdb.com/title/' + id);
    },
    restartApp: function () {
        var argv = gui.App.fullArgv,
            CWD = process.cwd();

        argv.push(CWD);
        require('child_process').spawn(process.execPath, argv, {
            cwd: CWD,
            detached: true,
            stdio: ['ignore', 'ignore', 'ignore']
        }).unref();
        gui.App.quit();
    },
    keyboardShortcuts: function () {
        document.addEventListener("keypress", function (key) {
            if (key.charCode === 13) {
                interface.keyEnter(key.target.id);
            } else if (key.ctrlKey && key.charCode === 4) {
                gui.Window.get().showDevTools();
            } else if (key.ctrlKey && key.charCode === 18) {
                misc.restartApp();
            }
        });
        document.addEventListener("keyup", function (key) {
            if (key.keyCode === 27) {
                $('#search-popup').css('opacity', 0).hide();
                interface.reset('search');
            }
        });
    },
    getSelection: function (textbox) {
        var selectedText = null;
        var activeElement = document.activeElement;

        if (activeElement && (activeElement.tagName.toLowerCase() == "textarea" || (activeElement.tagName.toLowerCase() == "input" && activeElement.type.toLowerCase() == "text")) && activeElement === textbox) {
            var startIndex = textbox.selectionStart;
            var endIndex = textbox.selectionEnd;

            if (endIndex - startIndex > 0) {
                var text = textbox.value;
                selectedText = text.substring(textbox.selectionStart, textbox.selectionEnd);
            }
        }

        return selectedText;
    },
    checkUpdates: function () {
        // set update text if not updated
        if (localStorage.availableUpdate && localStorage.availableUpdate !== '' && localStorage.availableUpdate > version) {
            $('#notification').html('New version available, download <a onClick="misc.openExternal(\'' + localStorage.availableUpdateUrl + '\')">v' + localStorage.availableUpdate + '</a> now!');
        }

        // only check every 7 days
        if (parseInt(localStorage.lastUpdateCheck) + 604800000 > Date.now()) {
            return;
        }

        localStorage.lastUpdateCheck = Date.now();

        // fetch remote package.json
        var url = 'https://raw.githubusercontent.com/vankasteelj/opensubtitles-uploader/master/package.json';
        require('https').get(url, function (res) {
            var body = '';

            res.on('data', function (chunk) {
                body += chunk.toString();
            });

            res.on('end', function () {
                var avail_version = JSON.parse(body).version;
                var releasesUrl = JSON.parse(body).releases;

                if (avail_version > version) {
                    localStorage.availableUpdate = avail_version;
                    localStorage.availableUpdateUrl = releaseUrl;
                    console.info('Update %s available:', avail_version, releasesUrl);
                    $('#notification').html('New version available, download <a onClick="misc.openExternal(' + localStorage.availableUpdateUrl + ')">v' + localStorage.availableUpdate + '</a> now!');
                } else {
                    localStorage.availableUpdate = '';
                    localStorage.availableUpdateUrl = '';
                    console.debug('No update available');
                }
            });
        }).on('error', function (e) {
            console.error(e);
        });
    }
};


/*
 * remember positionning
 */
win.on('move', function (x, y) {
    localStorage.posX = Math.round(x);
    localStorage.posY = Math.round(y);
});


/*
 * drag & drop
 */
window.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.stopPropagation();
}, false);
window.addEventListener('dragstart', function (e) {
    e.preventDefault();
    e.stopPropagation();
}, false);
window.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
}, false);

window.ondragenter = function (e) {
    $('#drop-mask').show();
    var showDrag = true;
    var timeout = -1;
    $('#drop-mask').on('dragenter',
        function (e) {
            misc.type = misc.fileType(e.originalEvent.dataTransfer.files[0].name);
            if (misc.type) {
                $('#main-' + misc.type).css('border-color', '#4A6B8A');
            }
        }.bind(this));
    $('#drop-mask').on('dragover',
        function (e) {
            var showDrag = true;
        });

    $('#drop-mask').on('dragleave',
        function (e) {
            var showDrag = false;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                if (!showDrag) {
                    $('#main-' + misc.type).css('border-color', '');
                    misc.type = null;
                }
            }, 10);
        });
};
window.ondrop = function (e) {
    e.preventDefault();
    $('#drop-mask').hide();

    var file = e.dataTransfer.files[0];
    var type = misc.fileType(file.path);
    if (type) {
        $('#main-' + type).css('border-color', '');
        win.focus();
        console.debug('New File:', type, 'dropped');
        interface['add_' + type](file.path);
        if ($('#search-popup').css('display') == 'block') interface.leavePopup({});
    } else {
        console.debug('Dropped file is not supported');
    }

    return false;
};
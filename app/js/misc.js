/*
 * important variables used in the app
 */
var gui = require('nw.gui'),
    win = gui.Window.get(),
    data_path = gui.App.dataPath,
    path = require('path');

var supportedTypes = {
    video: ['.3g2', '.3gp', '.3gp2', '.3gpp', '.60d', '.ajp', '.asf', '.asx', '.avchd', '.avi', '.bik', '.bix', '.box', '.cam', '.dat', '.divx', '.dmf', '.dv', '.dvr-ms', '.evo', '.flc', '.fli', '.flic', '.flv', '.flx', '.gvi', '.gvp', '.h264', '.m1v', '.m2p', '.m2ts', '.m2v', '.m4e', '.m4v', '.mjp', '.mjpeg', '.mjpg', '.mkv', '.moov', '.mov', '.movhd', '.movie', '.movx', '.mp4', '.mpe', '.mpeg', '.mpg', '.mpv', '.mpv2', '.mxf', '.nsv', '.nut', '.ogg', '.ogm', '.omf', '.ps', '.qt', '.ram', '.rm', '.rmvb', '.swf', '.ts', '.vfw', '.vid', '.video', '.viv', '.vivo', '.vob', '.vro', '.wm', '.wmv', '.wmx', '.wrap', '.wvx', '.wx', '.x264', '.xvid'],
    subtitle: ['.srt', '.sub', '.smi', '.txt', '.ssa', '.ass', '.mpl']
}

/*
 * jquery hack to add/remove class easely (let's say animate)
 */
var animate = function(el, cl, duration) {
    $(el).addClass(cl).delay(duration).queue(function() {
        $(el).removeClass(cl).dequeue();
    });
};

/*
 * remember positionning
 */
win.on('move', function(x, y) {
    localStorage.posX = Math.round(x);
    localStorage.posY = Math.round(y);
});

/*
 * is that an accepted file?
 */
var fileType = function(file) {
    var ext = path.extname(file).toLowerCase();
    if (supportedTypes.video.indexOf(ext) > -1) {
        return 'video';
    } else if (supportedTypes.subtitle.indexOf(ext) > -1) {
        return 'subtitle';
    } else {
        return null;
    }
};

/*
 * drag & drop
 */
window.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
}, false);
window.addEventListener('dragstart', function(e) {
    e.preventDefault();
    e.stopPropagation();
}, false);
window.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
}, false);

window.ondragenter = function(e) {
    $('#drop-mask').show();
    var showDrag = true;
    var timeout = -1;
    $('#drop-mask').on('dragenter',
        function(e) {
            console.debug('Drag initialized');
        });
    $('#drop-mask').on('dragover',
        function(e) {
            var showDrag = true;
        });

    $('#drop-mask').on('dragleave',
        function(e) {
            var showDrag = false;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                if (!showDrag) {
                    console.debug('Drag aborted');
                    $('#drop-mask').hide();
                }
            }, 100);
        });
};
window.ondrop = function(e) {
    e.preventDefault();
    $('#drop-mask').hide();

    var file = e.dataTransfer.files[0];

    var type = fileType(file.path);
    if (type) {
        console.debug(type, 'dropped');
        interface['add_' + type](file.path);
    } else {
        console.debug('Dropped file is not supported');
    }

    return false;
};

/*
 * Search for quality
 */
var extractQuality = function (title) {
    // 480p
    if (title.match(/480[pix]/i)) {
        return '480p';
    }
    // 720p
    if (title.match(/720[pix]/i) && !title.match(/dvdrip|dvd\Wrip/i)) {
        return '720p';
    }
    // 1080p
    if (title.match(/1080[pix]/i)) {
        return '1080p';
    }

    // not found, trying harder
    if (title.match(/DSR|DVDRIP|DVD\WRIP/i)) {
        return '480p';
    }
    if (title.match(/hdtv/i) && !title.match(/720[pix]/i)) {
        return '480p';
    }
    return false;
};

var clearName = function (name) {
    var title = path.parse(name).name;
    return title
        .replace(/(400|480|720|1080)[pix]/gi, '') // quality clean
        .replace(/[xh]26\d|hevc/gi, '') // codecs
        .replace(/bluray|bdrip|brrip|dsr|dvdrip|dvd\Wrip|hdtv|\Wts\W|telesync|\Wcam\W/gi, '') // source
        .replace(/[\.]/g, ' ') // has '.'
        .replace(/^\[.*\]/, '') // starts with brackets
        .replace(/\[^\w \]+/g, '') // remove brackets
        .replace(/ +/g, ' ') // has multiple spaces
        .replace(/_/g, ' ') // has '_'
        .replace(/\-$/, '') // ends with '-'
        .replace(/\s.$/, '') // ends with ' '
        .replace(/^\./, '') // starts with '.'
        .replace(/^\-/, '') // starts with '-'
};
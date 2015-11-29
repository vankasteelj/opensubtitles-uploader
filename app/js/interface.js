var interface = {
    browse: function(type) {
        var input = document.querySelector('#' + type + '-file-path-hidden');
        input.addEventListener('change', function(evt) {
            var file = $('#' + type + '-file-path-hidden')[0].files[0];
            window.ondrop({
                dataTransfer: {
                    files: [file]
                },
                preventDefault: function() {}
            });
        }, false);
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

        // reset x when the screen width is smaller than the window x-position + the window width
        if (x < 0 || (x + width) > screen.width) {
            console.info('Window out of view, recentering x-pos');
            x = Math.round((screen.availWidth - width) / 2);
        }

        // reset y when the screen height is smaller than the window y-position + the window height
        if (y < 0 || (y + height) > screen.height) {
            console.info('Window out of view, recentering y-pos');
            y = Math.round((screen.availHeight - height) / 2);
        }

        win.moveTo(x, y);
    },
    add_video: function (file) {
        $('#main-video-shadow').show().css('opacity', '1')

        var info = {};
        OS.extractInfo(file).then(function (data) {
            info = {
                moviefilename: path.basename(file),
                moviebytesize: data.moviebytesize,
                moviehash: data.moviehash,
                quality: misc.extractQuality(path.basename(file))
            }
        }).then(function () {
            return OS.identify(file);
        }).then(function (data) {
            console.log(data);
            if (data.metadata && data.metadata.imdbid) info.imdbid = data.metadata.imdbid;
            return interface.mediainfo(file);
        }).then(function (args) {
            interface.reset('video');
            if (args && args.length === 5) {
                $('#movietimems').val(args[0]);
                $('#moviefps').val(args[3]);
                $('#movieframes').val(args[4]);
                if (args[2] >= 720) $('#highdefinition').prop('checked', true);
            }
            $('#video-file-path').val(file);
            $('#moviefilename').val(info.moviefilename);
            $('#moviebytesize').val(info.moviebytesize);
            $('#moviehash').val(info.moviehash);
            if (info.quality && info.quality.match(/720|1080/i)) $('#highdefinition').prop('checked', true);
            if (info.imdbid) $('#imdbid').val(info.imdbid);
            $('#main-video-shadow').css('opacity', '0').hide();
        }).catch(function(err) {
            interface.reset('video');
            $('#main-video-shadow').css('opacity', '0').hide();
            console.error(err);
        });
    },
    add_subtitle: function (file) {
        interface.reset('subtitle');
        $('#subtitle-file-path').val(file);
        $('#subfilename').val(path.basename(file));
        OS.computeMD5(file).then(function (data) {
            $('#subhash').val(data);
        });
    },
    reset: function (type) {
        switch (type) {
            case 'video':
                $('#video-file-path').val('');
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
                interface.reset('upload');
                break;
            case 'subtitle':
                $('#subtitle-file-path').val('');
                $('#subfilename').val('');
                $('#subhash').val('');
                $('#subauthorcomment').val('');

                $('#hearingimpaired').prop('checked', false);
                $('#automatictranslation').prop('checked', false);

                $('#sublanguageid').val('');
                interface.reset('upload');
                break;
            case 'search':
                $('#search-text').val('');
                $('#search-result').html('');
                break;
            case 'upload':
                $('#button-upload').removeClass('success partial fail');
                $('#upload-result .result').html('');
                $('#button-upload i').removeClass('fa-check fa-quote-left fa-close').addClass('fa-cloud-upload');
                $('#upload-result').hide();
                break;
            default:
                interface.reset('video');
                interface.reset('subtitle');
                interface.reset('search');
                interface.reset('upload');
        }
    },
    searchPopup: function () {
        $(document).bind('mouseup', interface.leavePopup);

        var begin_title = [], count = 0, title = misc.clearName($('#moviefilename').val()).split(' ');
        for (var t in title) {
            if (title[t].match(/^(the|an|19\d{2}|20\d{2}|a|of|in)$/i) === null && count < 3 ) {
                begin_title.push(title[t]);
                count++;
            }
        }
        $('#search-popup').show().css('opacity', 1);
        $('#search-text').val(begin_title.join(' '));
    },
    leavePopup: function (e) {
        var container = $('#search');
        if (!container.is(e.target) && container.has(e.target).length === 0) {
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
    imdb_fromsearch: function (id) {
        id = id > 9999999 ? id : 'tt'+id;
        $('#imdbid').val(id);
        interface.leavePopup({});
    },
    mediainfo: function (file) {
        return new Promise(function (resolve, reject) {
            var cmd;
            if (process.platform === 'win32') {
                cmd = '"' + process.cwd() + '/mi-win32/mi.exe" --Inform=Video;::%Duration%::%Width%::%Height%::%FrameRate%::%FrameCount%' + ' "' + file + '"';
            } else if (process.platform === 'linux') {
                var arch = process.arch.match(/64/) ? '64' : '32';
                cmd = 'LD_LIBRARY_PATH='+ process.cwd() + '/mi-linux'+ arch +'/' + ' ' + process.cwd() + '/mi-linux' + arch + '/mi --Inform="Video;::%Duration%::%Width%::%Height%::%FrameRate%::%FrameCount%"' + ' "' + file + '"';
            } else {
                resolve(false);
            }

            require('child_process').exec(cmd,  function (error, stdout, stderr) {
                if (error !== null || stderr !== '') {
                    console.error('MediaInfo exec error:', (error || stderr));
                    resolve(false);
                } else {
                    var args = stdout.replace('::','').replace('\n','').split('::');
                    resolve(args);
                }
            });
        });
    }
};

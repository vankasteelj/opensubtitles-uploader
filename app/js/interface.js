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
        interface.reset('video');
        $('#video-file-path').val(file);
        OS.extractInfo(file).then(function (data) {
            $('#moviefilename').val(path.basename(file));
            $('#moviebytesize').val(data.moviebytesize);
            $('#moviehash').val(data.moviehash);
            var quality = extractQuality(path.basename(file));
            if (quality && quality.match(/720|1080/i)) $('#highdefinition').prop('checked', true);
        }).catch(function(err) {
            console.error(err);
        });
        OS.identify(file).then(function (data) {
            if (data.metadata && data.metadata.imdbid) $('#movieimdbid').val(data.metadata.imdbid);
        }).catch(function(err) {
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
                $('#movieimdbid').val('');
                $('#movieaka').val('');
                $('#moviereleasename').val('');
                $('#moviefps').val('');
                $('#movietimems').val('');
                $('#movieframes').val('');

                $('#highdefinition').prop('checked', false);
                break;
            case 'subtitle':
                $('#subtitle-file-path').val('');
                $('#subfilename').val('');
                $('#subhash').val('');
                $('#subauthorcomment').val('');

                $('#hearingimpaired').prop('checked', false);
                $('#automatictranslation').prop('checked', false);

                $('#sublanguageid') //todo
                break;
            default:
                interface.reset('video');
                interface.reset('subtitle');
        }
    },
    searchPopup: function () {
        function leavePopup(e) {
            var container = $('#search');
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                $('#search-popup').hide();
                $(document).unbind('mouseup', leavePopup);
            }
        }
        $(document).bind('mouseup', leavePopup);

        var title = clearName($('#moviefilename').val());
        $('#search-popup').show();
    }
};
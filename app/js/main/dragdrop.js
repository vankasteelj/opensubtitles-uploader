var dragdrop = {

    // AUTO: turns array of files into an object with only 1 video and 1 sub file
    analyzeDrop: function (_files) {
        var f = {};
        for (var i = 0; i < _files.length; i++) {
            // find first video
            if (!f.video && files.detectFileType(_files[i].path) === 'video') f.video = _files[i];

            // find first subtitle
            if (!f.subtitle && files.detectFileType(_files[i].path) === 'subtitle') f.subtitle = _files[i];

            // exit the loop once we have both
            if (f.subtitle && f.video) break;
        }
        return f;
    },

    // AUTO: on drop, notify of incompatible file or redirect file(s) to correct functions
    handleDrop: function (_files) {
        // analyzeDrop sent back empty object
        if (Object.keys(_files).length === 0) {
            console.debug('Dropped file is not supported');
            notify.snack(i18n.__('Dropped file is not supported'));
        }

        // pass video and/or sub to main function interface.add_video|add_subtitle
        for (type in _files) {
            // hide drag highlight defined in dragdrop.setup
            $('.section-file').css('border-color', '');

            // bring window on top
            win.focus();

            // add to main function
            console.debug('New File:', type, 'dropped');
            interface['add_' + type](_files[type].path, Object.keys(_files).length === 2);

            // close popups if needed
            if ($('#search-popup').css('display') == 'block') interface.leavePopup({});
            if ($('#upload-popup').css('display') == 'block') interface.reset('modal');
        }
    },

    // STARTUP: manage drag & drop
    setup: function () {
        // disable default drag&drop events
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

        // when dragging over the app, display it in a user-friendly manner
        window.ondragenter = function (e) {
            $('#drop-mask').show();
            var showDrag = true;
            var timeout = -1;

            $('#drop-mask').on('dragenter', function (e) {
                // cache files for a second
                dragdrop.files = [];

                // highlight video or sub interface part based on file extension
                for (var f in e.originalEvent.dataTransfer.files) {
                    dragdrop.files[f] = files.detectFileType(e.originalEvent.dataTransfer.files[f].name);
                    if (dragdrop.files[f]) {
                        $('#main-' + dragdrop.files[f]).css('border-color', ($('.light').css('background-color') || 'rgb(222, 83, 98)'));
                    }
                }
            }.bind(this));

            $('#drop-mask').on('dragover', function (e) {
                var showDrag = true;
            });

            $('#drop-mask').on('dragleave', function (e) {
                var showDrag = false;
                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    if (!showDrag) {
                        // clean highlights
                        $('.section-file').css('border-color', '');
                    }
                }, 10);
            });
        };

        // when dropping file(s), loads it/them in
        window.ondrop = function (e) {
            e.preventDefault();
            $('#drop-mask').hide();

            // analyze then load file(s)
            dragdrop.handleDrop(dragdrop.analyzeDrop(e.dataTransfer.files));

            return false;
        };
    }
};
var files = {

    // cache: supported extension for each type of file
    supported: {
        video: ['.3g2', '.3gp', '.3gp2', '.3gpp', '.60d', '.ajp', '.asf', '.asx', '.avchd', '.avi', '.bik', '.bix', '.box', '.cam', '.dat', '.divx', '.dmf', '.dv', '.dvr-ms', '.evo', '.flc', '.fli', '.flic', '.flv', '.flx', '.gvi', '.gvp', '.h264', '.m1v', '.m2p', '.m2ts', '.m2v', '.m4e', '.m4v', '.mjp', '.mjpeg', '.mjpg', '.mkv', '.moov', '.mov', '.movhd', '.movie', '.movx', '.mp4', '.mpe', '.mpeg', '.mpg', '.mpv', '.mpv2', '.mxf', '.nsv', '.nut', '.ogg', '.ogm', '.omf', '.ps', '.qt', '.ram', '.rm', '.rmvb', '.swf', '.ts', '.vfw', '.vid', '.video', '.viv', '.vivo', '.vob', '.vro', '.wm', '.wmv', '.wmx', '.wrap', '.wvx', '.wx', '.x264', '.xvid'],
        subtitle: ['.srt', '.sub', '.smi', '.txt', '.ssa', '.ass', '.mpl']
    },

    // AUTO: detect file type based on its extension
    detectFileType: function (file) {
        var ext = path.extname(file).toLowerCase();
        if (files.supported.video.indexOf(ext) > -1) {
            return 'video';
        } else if (files.supported.subtitle.indexOf(ext) > -1) {
            return 'subtitle';
        } else {
            return null;
        }
    },

    // AUTO: try to guess if video is HD or not, based on name. Failsafe for mediainfo
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

    // AUTO: clears filename of common unneeded words or char
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

    // USERINTERACTION or AUTO: auto-detect subtitle lang based on npm detect-lang
    detectSubLang: function () {
        var sub = $('#subtitle-file-path').val();

        // don't run without subs, even on click
        if (!sub || sub == '') {
            interface.animate($('#subtitle-file-path'), 'warning', 1750);
            return;
        }
        console.info('Detecting subtitle language...');
        $('.tooltipped').tooltip('close');

        // spinner
        $('.detect-lang i').addClass('fa-circle-o-notch fa-spin').removeClass('fa-magic');

        detectLang(sub).then(function (data) {
            // app accepts down to 35% of probability for a lang, based on various tests with multiple lang subs
            if (data && data.probability > 35 && (data.iso6392 || data.bibliographic)) {
                $('#sublanguageid').val((data.iso6392 || data.bibliographic));
                console.info('Detected:', data.iso6392 || data.bibliographic);
            } else {
                console.error(data);
                throw 'not conclusive enough';
            }
            // hide spinner
            $('.detect-lang i').addClass('fa-magic').removeClass('fa-circle-o-notch fa-spin');
        }).catch(function (err) {
            // hide spinner
            $('.detect-lang i').addClass('fa-magic').removeClass('fa-circle-o-notch fa-spin');

            // notify
            notify.snack(i18n.__('Language testing unconclusive, automatic detection failed'), 3800);
            console.error('files.detectSubLang() error:', err);
        });
    },

    // AUTO: spawn mediainfo binaries, grab info about video file and analyze them
    mediainfo: function (file) {
        return new Promise(function (resolve, reject) {
            var info = {};
            mi(file).then(function (md) {
                if (md && md[0]) {
                    console.info('MediaInfo data:', md[0]);
                    // do we have video track?
                    if (md[0].video) {
                        var video = md[0].video[0];

                        // duration
                        if (md[0].general.duration) {
                            var x = md[0].general.duration[0].split(':');
                            if (x.length > 1) {
                                info.duration = x[0] * (1000 * 60 * 60) + x[1] * (1000 * 60) + x[2] * (1000);
                            } else {
                                info.duration = md[0].general.duration[0];
                            }
                        } else {
                            if (video.duration) {
                                var x = video.duration[0].split(':');
                                if (x.length > 1) {
                                    info.duration = x[0] * (1000 * 60 * 60) + x[1] * (1000 * 60) + x[2] * (1000);
                                } else {
                                    info.duration = video.duration[0];
                                }
                            }
                        }

                        // total nb of frames
                        if (video.frame_count) {
                            info.frame_count = video.frame_count[0];
                        } else {
                            if (video.number_of_frames) {
                                info.frame_count = video.number_of_frames[0];
                            }
                        }

                        // height/width
                        if (video.height) {
                            info.height = video.height[0];
                        }
                        if (video.width) {
                            info.width = video.width[0];
                        }

                        // framerate
                        if (video.frame_rate) {
                            info.frame_rate = video.frame_rate[0];
                        } else {
                            if (video.original_frame_rate) {
                                info.frame_rate = video.original_frame_rate[0];
                            } else {
                                if (info.frame_count && info.duration) {
                                    var x = (info.frame_count[0] / (info.duration[0] / 1000)).toFixed(3);
                                    if (x.match(/23\.9|24\.0|25\.0|29\.9|30\.0/)) {
                                        if (x.match(/23\.97/)) {
                                            info.frame_rate = '23.976';
                                        } else {
                                            info.frame_rate = x;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                resolve(info);
            }).catch(function (err) {
                // bypass error on mediainfo, it happens and isnt mandatory
                console.error('MediaInfo detection failed, continuing...', err);
                resolve(info);
            });
        });
    },
};
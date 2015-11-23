var ua = navigator.userAgent;
if (ua.match(/firefox/i) !== null) {
    $('.input-file').css('position', 'relative');
    $('#subtitle-file-path').css('margin-left', '7px');
    $('#video-file-path').css('margin-left', '20px');
    $('#main-video .special-required').css('margin-top', '5px');
    $('#main-video .metadata').css('height', '108px');
    $('.metadata .title').css('margin-top', '-29px');
    $('#main-subtitle .special-required').css('margin-top', '10px');
    $('#main-subtitle .col-right input').css('margin-right', '130px');
}
'use strict';

var Notify = {
    // is there but isn't used anymore
    bottom: function (message, duration, anim, animduration) {
        if (!duration) {
            duration = 2500;
        }

        $('#notification').html(message).delay(0).queue(function () {
            if (anim && animduration) {
                Interface.animate('#notification', anim, animduration);
            }
            $('#notification').dequeue();
        }).delay(duration).queue(function () {
            $('#notification').html('').dequeue();
        });
    },

    // top-right notification sliding
    snack: function (message, duration) {
        if (!duration) {
            duration = 2500;
        }

        $('#notification-snack').html(message).show().addClass('slideNotification').delay(duration).queue(function () {
            $('#notification-snack').html('').hide('fast').removeClass('slideNotification').dequeue();
        });
    }
};
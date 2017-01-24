'use strict';

const Notify = {
    // is there but isn't used anymore
    bottom: (message, duration = 2500, anim, animduration) => {
        $('#notification').html(message).delay(0).queue(() => {
            if (anim && animduration) {
                Interface.animate('#notification', anim, animduration);
            }
            $('#notification').dequeue();
        }).delay(duration).queue(() => $('#notification').html('').dequeue());
    },

    // top-right notification sliding
    snack: (message, duration = 2500) => {
        $('#notification-snack')
            .html(message)
            .show()
            .addClass('slideNotification')
            .delay(duration)
            .queue(() => $('#notification-snack').html('').hide('fast').removeClass('slideNotification').dequeue());
    }, 

    // request attention when in bg
    requestAttention: () => {
        if (document.hasFocus()) {
            return;
        }

        win.requestAttention(true);
        win.once('focus', () => win.requestAttention(false));
    }
};
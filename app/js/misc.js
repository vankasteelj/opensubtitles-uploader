var animate = function (el, cl, duration) {
    $(el).addClass(cl).delay(duration).queue(function () {
        $(el).removeClass(cl).dequeue();
    });
};
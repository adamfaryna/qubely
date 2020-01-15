function isElementInViewport(el) {
    var rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

(function ($) {
    $('.qubely-block-pie-progress').each(function () {
        var $that = $(this);
        var circle = $that.find('circle:last-child');
        var pieOffset = circle.data('dashoffset');
        var transition = circle.data('transition');
        var duration = circle.data('transition-duration');
        var progressCount = $that.find('.qubely-pie-counter');
        var number = parseInt(circle.data('percent'));

        if (parseInt(duration) > 0) {
            progressCount.html(0);
        }

        var pieEvent = function () {
            if (isElementInViewport($that.find('svg')[0])) {
                circle.css('transition', transition)
                circle.attr('stroke-dashoffset', pieOffset);
                if (parseInt(duration) > 0) {
                    progressCounter();
                }
                window.removeEventListener('scroll', pieEvent, true)
            }
        }

        var progressCounter = function () {
            var current = 0;
            var time = parseInt(duration);
            var interval = Math.ceil(time / number);

            var timer = function () {
                if (current >= number) {
                    intvlId && clearInterval(intvlId)
                }
                progressCount.html(current)
                current++;
            }
            var intvlId = setInterval(timer, interval)
        }

        window.addEventListener('scroll', pieEvent, true);
        pieEvent()
    })
})(jQuery)
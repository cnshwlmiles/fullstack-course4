// WEBTEAM-VERSION: 1.0.0

$(function () {
    var footerHeight = 0,
            footerTop = 0,
            $footer = $("#footer");

    positionFooter();

    function positionFooter() {

        footerHeight = $footer.height();
        footerTop = ($(window).scrollTop() + $(window).height() - footerHeight) + "px";

        if (($(document.body).height() + footerHeight) < $(window).height()) {
            $footer.css({
                position: "absolute",
                bottom: 0
//            }).animate({
//                top: footerTop
            });
        } else {
            $footer.css({
                position: "static"
            });
        }

    }

    $(window).scroll(positionFooter).resize(positionFooter);
});

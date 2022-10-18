$(function () {
    var next = 1;		// fixed, please do not modfy;
    var current = 0;		// fixed, please do not modfy;
    var interval = 6000;	// You can set single picture show time;
    var fade_time = 2500;         // You can set fadeing-transition time;
    var img_number = 4;		// How many pictures do you have

    show_header_img();
    show_urgent_report_nav();
    highlight_selected_nav();

    var target = $('#ajax_loading').get(0);
    var spinner = new Spinner().spin(target);

    $(document).ajaxStart(function () {
        $('#ajax_loading').show();
    });

    $(document).ajaxStop(function () {
        $('#ajax_loading').hide();
    });

    $(document).on('click', '#urgent_report', function () {
        if ($('#urgent_report_dailog').length) {
            return false;
        }

        $("<div id='urgent_report_dailog'></div>")
                .dialog({
                    "title": '天氣警特報',
                    "width": '80%'
                })
                .dialogExtend({
                    "collapsable": true,
                    "dblclick": "collapse",
                    "icons": {
                        "maximize": "ui-icon-circle-plus"
                    }
                });

        show_urgent_report();
    });

    $(document).on('click', '#urgent_report_rwd', function () {
        if ($('#urgent_report_dailog').length) {
            return false;
        }

        $("<div id='urgent_report_dailog'></div>")
                .dialog({
                    "title": '天氣警特報',
                    "width": '80%'
                })
                .dialogExtend({
                    "collapsable": true,
                    "dblclick": "collapse",
                    "icons": {
                        "maximize": "ui-icon-circle-plus"
                    }
                });

        show_urgent_report();
    });

    $(document).on('click', '.dropdown', function() {
        $(this).next('.submenu').slideToggle();
    });

    $(document).on('click', '#week_agri_forcast a,#ten_days_observation a,#longterm_forcast a', function () {
        write_operating_log($(this).parent().attr('id'));
    });

    $(document).on('click', '.ui-icon-closethick', function () {
        $(this).parent('button').parent('div').parent('div').parent('div').remove();
    });

    $(window).on('resize', function () {
        var margin_bottom = $('.fade_img img').eq(current).height() + 2;
        //$('.fade_img').css({'margin-bottom': margin_bottom});
    });

    $(window).trigger('resize');

    //在RWD時   能顯示出對應的目前位置(類似breadcrumb)
    var web_page_text_mapping = {'observational': '觀測時序圖',
        'cropstation_forecast': '農業客製化預報',
        'monitor': '防災即時監測',
        'radarmap-mobile': '雷達回波及衛星雲圖',
        'load_details_view_mobile': '農業客製化預報',
        'monitor_map_mobile': '雷達回波及衛星雲圖',
        'gdd_calculation_mobile': '積溫計算器'
    }


    var current_url = window.location.href;
    var url_block = current_url.split('/');
    var current_location = url_block[url_block.length - 1];

    if (current_location.indexOf('load_details_view_mobile') > -1) {
        current_location = 'load_details_view_mobile';
    }
    if (current_location.indexOf('monitor_map_mobile') > -1) {
        current_location = 'monitor_map_mobile';
    }


    if (current_location == '') {
        $('#current-page-text').text(web_page_text_mapping['monitor']);
    } else if (current_location in web_page_text_mapping) {
        $('#current-page-text').text(web_page_text_mapping[current_location]);
    }



    function show_urgent_report_nav() {
        $.ajax({
            type: 'POST',
            url: global.base_url + 'urgent/check_urgent_status',
            dataType: 'json',
            success: function (is_display_alarm) {
                if (is_display_alarm) {
                    if ($(window).width() < 768) {
                        $("#urgent_report_rwd").addClass('text-center').html('<span href="#" style="color:#FFF;cursor: pointer;"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i>天氣警特報</span>');
                    } else {
                        $("#urgent_report").addClass('nav_block text-center').html('<div style="color:#FFF;background-color: red;cursor: pointer;"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i>天氣警特報</div>');
                    }


                }
            }
        });
    }

    function show_urgent_report() {
        $.ajax({
            type: 'POST',
            url: global.base_url + 'urgent/get_urgent_report',
            dataType: 'json',
            success: function (data) {
                var html = '';
                $.each(data, function (key, report_info) {
                    var text = report_info.file_content.replace(/\n/g, "<br>");
                    html += '<div class="urgent"><a href="' + report_info.link + '" target="_blank">' + report_info.message + '</a><div style="margin-bottom: 5px; margin-top: 5px;">' + text + '</div></div>';
                });

                $('#urgent_report_dailog').html(html);
            }
        });
    }

    function write_operating_log(target_id) {
        $.ajax({
            type: 'POST',
            url: global.base_url + 'layout/write_operating_log',
            data: {
                browsing_page: target_id
            },
            dataType: 'json',
            error: function (e) {
                console.log(e.responseJSON[0]);
            }
        });
    }

    function get_season() {
        var date = new Date();
        var month = date.getMonth() + 1;
        var season = '';

        switch (month) {
            case 3:
            case 4:
            case 5:
                season = 'spring';
                break;
            case 6:
            case 7:
            case 8:
                season = 'summer';
                break;
            case 9:
            case 10:
            case 11:
                season = 'fall';
                break;
            case 12:
            case 1:
            case 2:
                season = 'winter';
                break;
        }

        return season;
    }

    function trigger_resize() {
        $(window).trigger('resize');
    }

    function fade_next_image() {
        $('.fade_img').css('position', 'relative');
        $('.fade_img img').css('position', 'absolute');

        $('.fade_img img').eq(current).delay(interval).fadeOut(fade_time)
                .end().eq(next).delay(interval).hide().fadeIn(fade_time, fade_next_image);

        if (next < img_number - 1) {
            next++;
        } else {
            next = 0;
        }
        if (current < img_number - 1) {
            current++;
        } else {
            current = 0;
        }
    }

    function highlight_selected_nav() {
        var url = window.location.href.split('/');
        var url_length = url.length;
        var nav_div_id = '';

        if (url_length === 4) {
            nav_div_id = 'monitor';
        } else if (url.length === 5) {
            nav_div_id = url[url_length - 1];
        } else if (url.length === 6 && url[url_length - 2] === 'history') {
            nav_div_id = 'history';
        }

        if (nav_div_id !== '') {
            $('#' + document.createTextNode(nav_div_id).wholeText).addClass('nav_menu_active');
        }
    }

    function show_header_img() {
        var season = get_season();

        $.ajax({
            type: 'POST',
            url: global.base_url + 'layout/get_header_image',
            data: {
                season: season
            },
            dataType: 'json',
            success: function (image_info) {
                if (image_info.length === 0) {
                    return;
                }

                var html = '';
                $.each(image_info, function (key, image_path) {
                    var full_image_path = global.base_url + image_path + '?dt=' + (+new Date());
                    if (key === 0) {
                        html += '<img class="img_responsive" src="' + full_image_path + '">';
                    } else {
                        html += '<img class="img_responsive" style="display:none;" src="' + full_image_path + '">';
                    }
                });

                $('.fade_img').html(html);

                fade_next_image();

                setTimeout(trigger_resize, 300);
            }
        });
    }
});

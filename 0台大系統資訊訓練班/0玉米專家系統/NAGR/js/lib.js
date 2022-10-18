
global = (typeof global === 'undefined' ? {} : global);
lib = (typeof lib === 'undefined' ? {} : lib);

lib.input_get = function (name) {
    name = name || '';
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

lib.get_parameter_string = function (object) {
    var parameters = [];
    $.each(object, function (k, v) {
        parameters.push(k + '=' + encodeURIComponent(v));
    });
    return parameters.join('&');
};

lib.get_object_keys = function (object) {
    var keys = [];
    $.each(object, function (k) {
        keys.push(k);
    });
    return keys;
};

lib.random_color = function () {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

lib.data = function (object) {
    var data_attributes = [];
    $.each(object, function (k, v) {
        data_attributes.push('data-' + k + '=' + v);
    });
    return data_attributes.join(' ');
};

lib.round = function (number, float_number) {
    float_number = float_number || 0;
    var pow_float_number = Math.pow(10, float_number);
    return Math.round(number * pow_float_number) / pow_float_number;
};

lib.options = function (result_array, options) {
    options = options || {};
    options.attributes = options.attributes || {};

    var html = '';
    $.each(result_array, function (i, o) {
        var attributes = '';
        $.each(options.attributes, function (attribute_name, row_key) {
            attributes += ' ' + attribute_name + '="' + o[row_key] + '"';
        });

        var selected = '';
        if (options.selected && options.selected(o)) {
            selected = ' selected="selected"';
        }

        html += '<option value="' + o[options.value] + '"' + attributes + selected + '>' + o[options.display] + '</option>';
    });

    return html;
};

lib.is_https = function () {
    return window.location.protocol === 'https:' ? true : false;
};

lib.html_encode = function (value) {
    return $('<div/>').text(value).html();
};

lib.html_decode = function (value) {
    return $('<div/>').html(value).text();
};

lib.async_wait = function (function_name) {
    global.async = global.async || {};
    global.async[function_name] = global.async[function_name] || {};

    return {
        set: function (ajax_name, is_complete) {
            global.async[function_name][ajax_name] = is_complete;
        },
        done: function () {
            var is_all_complete = true;
            $.each(global.async[function_name], function (ajax_name, is_complete) {
                if (!is_complete) {
                    is_all_complete = false;
                    return false;
                }
            });
            return is_all_complete;
        }
    };
};

lib.ajax_loading = (function () {
    var queue = 0;
    return {
        show: function () {
            queue++;
            $('#ajax_loading').show();
        },
        hide: function () {
            queue--;
            if (queue === 0) {
                $('#ajax_loading').hide();
            }
        }
    };
})();

lib.ajax_queue = function (options) {
    options = options || {};
    options.method = options.method || 'abort'; // abort || queue
    options.name = options.name || 'default';
    global.ajax_queue = global.ajax_queue || {};
    var ajax = global.ajax_queue[options.name] = global.ajax_queue[options.name] || {
        method: options.method,
        queue: [],
        xhr: null
    };

    ajax.queue.push(options.ajax);
    next();

    function next() {
        if (ajax.queue.length === 0) {
            return;
        }

        if (ajax.method === 'abort' && ajax.xhr && ajax.xhr.readystate !== 4) {
            ajax.xhr.abort();
            ajax.xhr = null;
        }

        if (ajax.xhr !== null) {
            return;
        }

        run(ajax.queue.shift());
    }

    function run(ajax_options) {
        var complete = ajax_options.complete;
        ajax_options.complete = function () {
            if (complete) {
                complete(arguments);
            }

            ajax.xhr = null;
            if (ajax.method !== 'abort') {
                next();
            }
        };
        ajax.xhr = $.ajax(ajax_options);
    }
};

lib.icon = function (icon_class, title) {
    title = 'title="' + title + '"' || '';

    // http://getbootstrap.com/components/
    function _bootstrap(icon_class) {
        return '<span ' + title + ' class="glyphicon ' + icon_class + '" aria-hidden="true"></span>';
    }

    // https://fortawesome.github.io/Font-Awesome/icons/
    function _fontawesome(icon_class) {
        return '<i ' + title + ' class="fa ' + icon_class + '"></i>';
    }

    if (icon_class.indexOf('glyphicon-') > -1) {
        return _bootstrap(icon_class);
    } else if (icon_class.indexOf('fa-') > -1) {
        return _fontawesome(icon_class);
    } else {
        return '';
    }
};

lib.parse_datetime = function (datetime) {
    var date;

    if (datetime) {
        date = new Date(datetime);
    } else {
        date = new Date();
    }

    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds()
    };
};

lib.insert_object_after_keys = function (object, insert_object) {
    var new_object = {};
    for (var k in object) {
        if (object.hasOwnProperty(k)) {
            new_object[k] = object[k];

            if (typeof insert_object[k] !== 'undefined') {
                for (var insert_key in insert_object[k]) {
                    if (insert_object[k].hasOwnProperty(insert_key)) {
                        new_object[insert_key] = insert_object[k][insert_key];
                    }
                }
            }
        }
    }
    return new_object;
};

lib.get_zero_datetime = function (datetime) {
    var regex = /^(\d*)(.)(\d*)?(.)?(\d*)?(.)?(\d*)?(.)?(\d*)?(.)?(\d*)?$/g;
    var result = regex.exec(datetime);

    var string = '';
    $.each(result, function (i, v) {
        if (i === 0) {
            return true;
        }

        if (v && i % 2 && v.length < 2) {
            result[i] = '0' + result[i];
        }

        if (v) {
            string += result[i];
        }
    });

    return string;
};

$.fn.outer_html = function () {
    return $('<div>').append($(this).clone()).html();
};

$.fn.press_enter = function (callback) {
    $(this).keypress(function (e) {
        if (e.which === 13) {
            e.preventDefault();
            if (callback) {
                callback();
            }
        }
    });
};

lib.time_helper = function () {
    var self = this;

    var start_date_obj = null;
    var timestamp_list = null;

    self.timestamp = {
        minutes: 1000 * 60,
        hours: 1000 * 60 * 60,
        days: 1000 * 60 * 60 * 24
    };

    var current_date_obj = new Date();
    self.set_datetime = function (date_obj) {
        current_date_obj = date_obj;
    };

    self.near_timestamp = null;
    self.get_near_hour_datetime = function (hour_array) {
        var near_hour = null;
        var min_diff = null;
        $.each(hour_array, function (i, h) {
            var hour_diff = parseInt(current_date_obj.format('HH')) - parseInt(h);
            if (min_diff === null || (hour_diff >= 0 && hour_diff < min_diff)) {
                min_diff = hour_diff;
                near_hour = h;
            }
        });

        var string = current_date_obj.format('yyyy/mm/dd ' + near_hour + ':00:00');
        start_date_obj = new Date(string);

        self.near_timestamp = start_date_obj.getTime();

        return string;
    };

    self.create_timestamp_list_by_hours = function (hours, interval) {
        var end_date_obj = new Date(start_date_obj.getTime() + hours * self.timestamp.hours);
        return  self.create_timestamp_list(end_date_obj, interval);
    };

    self.create_timestamp_list = function (end_date_obj, interval) {
        var start_timestamp = start_date_obj.getTime();
        var end_timestamp = end_date_obj.getTime();

        timestamp_list = [];
        if (start_timestamp <= end_timestamp) {
            for (var i = start_timestamp; i <= end_timestamp; i += interval * self.timestamp.hours) {
                timestamp_list.push(i);
            }
        } else {
            for (var i = start_timestamp; i >= end_timestamp; i -= interval * self.timestamp.hours) {
                timestamp_list.push(i);
            }
            timestamp_list.reverse();
        }
        return timestamp_list;
    };

    self.create_date_list_by_month = function (end_date_obj, period) {
        // period
        // 1: 每月 1 日
        // 2: 每月 1, 15
        // 5: 每月 1, 7, 14, 21, 28
        var period_days_map = {
            1: [1],
            2: [1, 15],
            5: [1, 7, 14, 21, 28]
        };

        var start_timestamp = start_date_obj.getTime();
        var end_timestamp = end_date_obj.getTime();

        timestamp_list = [];
        if (start_timestamp <= end_timestamp) {
            var current_date = start_date_obj;
            while (current_date.getTime() <= end_timestamp) {
                $.each(period_days_map[period], function (i, day) {
                    current_date = new Date(current_date.getFullYear(), current_date.getMonth(), day);
                    if (current_date.getTime() >= start_timestamp && current_date.getTime() <= end_timestamp) {
                        timestamp_list.push(current_date.getTime());
                    }
                });
                current_date = new Date(current_date.getFullYear(), current_date.getMonth() + 1, 1);
            }
        } else {
            var reverse_period_list = $.extend([], period_days_map[period]).reverse();
            var current_date = start_date_obj;
            while (current_date.getTime() >= end_timestamp) {
                $.each(reverse_period_list, function (i, day) {
                    current_date = new Date(current_date.getFullYear(), current_date.getMonth(), day);
                    if (current_date.getTime() <= start_timestamp && current_date.getTime() >= end_timestamp) {
                        timestamp_list.push(current_date.getTime());
                    }
                });
                current_date = new Date(current_date.getFullYear(), current_date.getMonth(), 0);
            }
//            for (var i = start_timestamp; i >= end_timestamp; i -= interval * self.timestamp.hours) {
//                timestamp_list.push(i);
//            }
            timestamp_list.reverse();
        }
        return timestamp_list;
    };

    self.get_timestamp_list = function () {
        return timestamp_list;
    };

    self.set_timestamp_list = function (input_timestamp_list) {
        timestamp_list = input_timestamp_list;
    };

    self.get_date_object_list = function () {
        var date_object_list = [];
        $.each(timestamp_list, function (i, timestamp) {
            date_object_list.push(new Date(timestamp));
        });
        return date_object_list;
    };

    self.get_datetime_in_format = function (format) {
        var string = [];
        $.each(timestamp_list, function (i, t) {
            string.push(new Date(t).format(format));
        });
        return string;
    };

    self.get_data_map = function (data, options) {
        options = options || {};
        options.params = options.params || [];
        options.missing_values = options.missing_values || [];
        options.round = options.round || {};

        var fulltime_padding = '';
        if (data.length) {
            var time_length = data[0].time.length;
            var padding = {
                10: ' 00:00:00',
                13: ':00:00',
                16: ':00',
                19: ''
            };
            fulltime_padding = padding[time_length];
        }

        var data_map = {};
        $.each(data, function (i, o) {
            o.time = o.time.replace(/-/g, '/');
            o.time += fulltime_padding;
            data_map[new Date(o.time).getTime()] = o;
        });

        $.each(timestamp_list, function (i, timestamp) {
            if (!data_map[timestamp]) {
                data_map[timestamp] = {};
            }

            $.each(options.params, function (i, param) {
                if (typeof data_map[timestamp][param] === 'undefined' || options.missing_values.indexOf(data_map[timestamp][param]) !== -1) {
                    data_map[timestamp][param] = null;
                }
            });

            $.each(options.round, function (param, accuracy) {
                if (data_map[timestamp][param] !== null) {
                    data_map[timestamp][param] = lib.round(data_map[timestamp][param], accuracy);
                }
            });
        });

        return data_map;
    };
};

lib.check_url_exists = function (url) {
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();

    if (http.status === 200) {
        return true;
    }
    return false;
};

lib.get_text_address_location = function (address) {
    global.address_lat_lng = {};

    var loaciotn_service = new TGOS.TGLocateService();
    var request = {
        address: address
    };

    loaciotn_service.locateWGS84(request, function (result, status) {
        if (status !== 'OK') {
            alert('無法取得經緯度，請輸入完整地址。');
            return;
        } else {
            var address_point = result[0].geometry.location;
            global.address_lat_lng = {
                lat: address_point.y,
                lng: address_point.x
            };
            return;
        }
    });
};
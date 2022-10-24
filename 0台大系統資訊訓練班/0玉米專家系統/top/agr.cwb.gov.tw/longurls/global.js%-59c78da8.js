/* global lib global_map*/

lib = (typeof lib === 'undefined' ? {} : lib);

var config = {
    map: {
        zoom: 7.8,
        center: [23.6, 121.0], // 臺灣
        bound_offset: 20,
        small_area: {// 臺灣周遭的範圍：東經119度~123度 、北緯21度~26度
            bounds: [[21, 119], [26, 123]],
            minZoom: 7,
            home_title: '臺灣'
        },
        large_area: {// 西北太平洋的範圍：東經110~160、北緯5度~40度
            bounds: [[5, 110], [40, 160]],
            minZoom: 4,
            home_title: '西北太平洋'
        },
        circle_marker: {
            fill: true,
            color: 'red',
            radius: 5
        },
        wms_method: 'source' // source (has get feature info), overlay
    }
};

Date.prototype.getZeroHours = function () {
    var hour = this.getHours().toString();
    if (hour.length === 1) {
        hour = '0' + hour;
    }
    return hour;
};

Date.prototype.getZeroMinutes = function () {
    var minute = this.getMinutes().toString();
    if (minute.length === 1) {
        minute = '0' + minute;
    }
    return minute;
};

Date.prototype.getZeroMonth = function () {
    var month = (this.getMonth() + 1).toString();
    if (month.length === 1) {
        month = '0' + month;
    }
    return month;
};

Date.prototype.getZeroDay = function () {
    var date = this.getDate().toString();
    if (date.length === 1) {
        date = '0' + date;
    }
    return date;
};

Date.prototype.getZeroDate = function (symbole) {
    symbole = symbole || '-';
    return [this.getFullYear(), this.getZeroMonth(), this.getZeroDay()].join(symbole);
};

lib.base_url = function (url) {
    var pathArray = window.location.href.split('/');
    var protocol = pathArray[0];
    var host = pathArray[2];
    url = url || '';
    return protocol + '//' + host + '/' + pathArray[3] + '/' + url;
};

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
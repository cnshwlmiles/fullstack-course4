/* global lib, global */

lib = (typeof lib === 'undefined' ? {} : lib);
lib.bootstrap = (function () {
    return {
        icon: function (options) {
            options = options || {};
            options.icon = options.icon || 'glyphicon-th-list';
            options.text = options.text || '';
            options.class = options.class || '';
            options.cursor = options.cursor === false ? false : options.cursor || 'pointer';

            var inputClass = options.class === '' ? '' : ' class="' + options.class + '"';
            var cursor = options.cursor ? ' style="cursor: ' + options.cursor + '"' : '';
            var icon_cursor = options.icon_cursor ? ' style="cursor: ' + options.icon_cursor + '"' : '';
            return '<div' + inputClass + cursor + '><span class="glyphicon ' + options.icon + '" ' + icon_cursor + ' aria-hidden="true"></span>' + options.text + '</div>';
        },
        tabs: function (result_array, options) {
            options = options || {};

            var html = '';
            html += '<ul class="nav nav-tabs">';
            $.each(result_array, function (i, o) {
                var attributes = '';
                $.each(options.attributes, function (attribute_name, row_key) {
                    attributes += ' ' + attribute_name + '="' + o[row_key] + '"';
                });

                var value = '';
                if ($.isFunction(options.value)) {
                    value = options.value(o);
                } else {
                    value = o[options.value];
                }
                html += '<li><a href="' + global.base_url + value + '"' + attributes + '>' + o[options.display] + '</a></li>';
            });
            html += '</ul>';

            return html;
        }

    };
}());

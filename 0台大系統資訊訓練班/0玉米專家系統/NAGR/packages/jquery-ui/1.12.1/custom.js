$.fn.modal.Constructor.prototype.enforceFocus = function () {
};

$.fn.drag_multiple = function (input_options) {
    var container_wrapper = this.selector;

    var default_options = {
        drag_container: null,
        drop_container: null,
        container_class: null,
        item_class: null,
        icons_function: {}, /* {icon_class: function() {}} */
        icon_class: '.drag-function',
        icon_wrapper: '.drag-toggle',
        enter: {
            icon_class: '.glyphicon-plus-sign',
            html: '<span class="drag-function glyphicon glyphicon-plus-sign" aria-hidden="true"></span>',
            callback: null
        },
        leave: {
            icon_class: '.glyphicon-minus-sign',
            html: '<span class="drag-function glyphicon glyphicon-minus-sign" aria-hidden="true"></span>',
            callback: null
        },
        selected_class: '.highlight-tile',
        click_delay: 300
    };
    var options = $.extend(true, default_options, input_options);

    var data_options = $(container_wrapper).data('options');
    if (input_options === 'destroy' && data_options) {
        destroy();
        return;
    }
    $(container_wrapper).data('options', options);

    function destroy() {
        $(options.container_class + ' ' + options.item_class).off();
        $(options.container_class + ' ' + options.icon_class).off();
        $(options.container_class).droppable('destroy');
        $(options.container_class + ' ' + options.item_class).draggable('destroy');
        $(options.item_class).remove();
    }

    var lastClick, diffClick; // timestamps

    $(options.container_class)
            .sortable()
            .droppable({
                drop: function (e, ui) {
                    drop_toggle(ui, $(this));
                }
            });

    function without_dot(class_name) {
        return class_name.substring(1);
    }

    function is_clicked_function(e) {
        return $(e.target).hasClass(without_dot(options.icon_class));
    }

    function drop_toggle(ui, $container) {
        var $selected_items = $('.drag-multiple-dragging');

        if (diffClick !== 0) {
            if ($container.is(options.drag_container)) {
                $selected_items.find(options.icon_wrapper).each(function () {
                    $(this).html(options.enter.html);
                });
                if (options.leave.callback) {
                    var $change_items = $(options.drop_container).find('.drag-multiple-dragging');
                    if ($change_items.size()) {
                        options.leave.callback($change_items);
                    }
                }
            } else {
                $selected_items.find(options.icon_wrapper).each(function () {
                    $(this).html(options.leave.html);
                });
                if (options.enter.callback) {
                    var $change_items = $(options.drag_container).find('.drag-multiple-dragging');
                    if ($change_items.size()) {
                        options.enter.callback($change_items);
                    }
                }
            }
        }

        if (diffClick === 0) {
            if (ui.draggable.closest(options.container_class).attr('id') === $container.attr('id')) {
                // 拖到外面的情況
                if ($container.is(options.drag_container)) {
                    $selected_items.appendTo(options.drag_container);
                } else {
                    $selected_items.appendTo(options.drop_container);
                }
            } else {
                if ($container.is(options.drag_container)) {
                    $selected_items.appendTo(options.drop_container);
                } else {
                    $selected_items.appendTo(options.drag_container);
                }
            }
        } else {
            $selected_items.appendTo($container);
        }

        $selected_items.add(ui.draggable); // ui.draggable is appended by the script, so add it after
        $selected_items.removeClass('drag-multiple-dragging');
        $selected_items.removeClass(without_dot(options.selected_class));
        $selected_items.css({top: 0, left: 0});
    }

    $(options.container_class + ' ' + options.item_class)
            // Script to deferentiate a click from a mousedown for drag event
            .bind('mousedown mouseup', function (e) {
                if (is_clicked_function(e)) {
                    return false;
                }

                if (e.type === "mousedown") {
                    lastClick = e.timeStamp; // get mousedown time
                    diffClick = 0;
                } else {
                    diffClick = e.timeStamp - lastClick;
                    if (diffClick < options.click_delay) {
                        // add selected class to group draggable objects
                        $(this).toggleClass(without_dot(options.selected_class));
                    }
                }
            })
            .draggable({
                cancel: options.icon_class,
                revertDuration: 10, // grouped items animate separately, so leave this number low
                containment: container_wrapper,
                start: function (e, ui) {
                    ui.helper.addClass(without_dot(options.selected_class));
                    $(options.selected_class).addClass('drag-multiple-dragging');
                },
                stop: function (e, ui) {
                    // reset group positions
                    $('.drag-multiple-dragging').css({top: 0, left: 0});
                },
                drag: function (e, ui) {
                    // set selected group position to main dragged object
                    // this works because the position is relative to the starting position
                    $('.drag-multiple-dragging').css({
                        top: ui.position.top,
                        left: ui.position.left
                    });
                }
            });

    function click_toggle($target) {
        var $item = $target.closest(options.item_class);

        if ($item.find(options.icon_wrapper + ' ' + options.enter.icon_class).size()) {
            enter($item, function () {
                $item.find(options.icon_wrapper).html(options.leave.html);
                if (options.enter.callback) {
                    options.enter.callback($item);
                }
            });

        } else if ($item.find(options.icon_wrapper + ' ' + options.leave.icon_class).size()) {
            leave($item, function () {
                $item.find(options.icon_wrapper).html(options.enter.html);
                if (options.leave.callback) {
                    options.leave.callback($item);
                }
            });
        }
    }

    function enter($item, callback) {
        $item.fadeOut(function () {
            if (callback) {
                callback();
            }
            $item.appendTo(options.drop_container);
            $item.fadeIn();
        });
    }

    function leave($item, callback) {
        $item.fadeOut(function () {
            if (callback) {
                callback();
            }
            $item.appendTo(options.drag_container).fadeIn();
        });
    }

    $(document).on('click', options.container_class + ' ' + options.icon_class, function (e) {
        var $item = $(this);
        var $target = $(e.target);

        click_toggle($target);

        $.each(options.icons_function, function (icon_class, callback) {
            if ($target.is(icon_class)) {
                callback($item);
            }
        });

        return false;
    });
};

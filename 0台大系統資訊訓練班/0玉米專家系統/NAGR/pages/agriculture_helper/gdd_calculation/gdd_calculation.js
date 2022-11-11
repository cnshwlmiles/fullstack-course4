/* global lib, config, d3 */
$(document).ready(function () {
    var city_list = {};
    var station_list = {};
    var predict_list = {};
    var this_year = false;
    // 畫圖的資料
    var draw_data = "";
    var form_data = {};
    var now = new Date();
    var year = now.getFullYear();
    get_city_list();
    get_station_list();
    get_predict_list();
    
    $("input#start_time").datepicker({dateFormat: "yy-mm-dd",maxDate: now, minDate: '-15y',defaultDate: year+"-01-01"});
    $("input#start_time").val(year+"-01-01");
    $("input#end_time").val(year+"-12-31");

    if(draw_data == "") {
        $(".draw_GDD").html("<div id='init_show'>No Data Available.<div>請先選擇參考測站及預報位點</div></div>");
    }
    $(document).on('change' , 'input#start_time', function() {
        var start_day = $(this).val();
        var day_ary = start_day.split('-');
        var year_choose = day_ary[0];

        if(year_choose == year) {
            $("select#type_choose option").last().attr("selected", false);
            $("select#type_choose").removeClass('disabled');
            $("select#type_choose").attr("disabled", false);
            this_year = true;      
        }
        else {
            $("select#type_choose option").last().attr("selected", true);
            $("select#type_choose").addClass('disabled');
            $("select#type_choose").attr("disabled", true);
            this_year = false;          
        }
        $("input#end_time").val(year_choose + "-12-31");
    });
    $("input#start_time").trigger("change");

    $('.slider-input04').jRange({
        from: 50,
        to: 3500,
        step: 5,
        scale: [50,3500],
        format: '%s',
        width: '55%',
        showLabels: true
    });

    $(document).on("change", "#target_gdd", function(){
        if(draw_data != "") {
            redraw();
        }
    });

    $(document).on("click", "i.fa-caret-left, i.fa-caret-right", function() {
        if($(this).hasClass("fa-caret-right")) {
            $('.slider-input04').jRange("setValue", (parseInt($(this).siblings('input').val()) + 5).toString());
        }
        else {
            $('.slider-input04').jRange("setValue", (parseInt($(this).siblings('input').val()) - 5).toString());

        }
    });

    $(document).on("click", "#Description_btn", function() {
        $( "#suggest_dialog").dialog();
    });

    $(document).on("change", "#city_choose", function() {
        var area_html = "<option disabled selected>選擇鄉鎮</option>";
        $.each(city_list[$(this).val()], function(num, area_name) { 
             area_html += "<option>" + area_name + "</option>";
        });  
        $("#area_choose").html(area_html);
    });

    $(document).on("change", "#area_choose", function() {
        var city = $("#city_choose").val();
        var area = $("#area_choose").val();
        $("select#station_choose").attr("disabled", false);
        $("select#prediction_choose").attr("disabled", false);
        create_station_list(city, area);
        create_predict_list(city, area);
    });

    $(document).on("change", "#station_choose", function() {
        var station_info = "";
        var station_name = $("#station_choose option:selected").text();
        var station_type = $("#station_choose option:selected").data('type');
        var city = $("#city_choose").val();
        var area = $("#area_choose").val();
        var station_data = station_list[city][area][station_type][station_name];

        station_info += "<div>測站資訊 : <div>" + station_name + "</div></div>";
        station_info += "<div>代碼 : <span>" + station_data["ID"] + "</span></div>";
        station_info += "<div>地址 : <span>" + station_data["Address"] + "</span></div>";
        station_info += "<div>海拔 : <span>" + station_data["Altitude"] + "公尺</span></div>";
        station_info += "<div>經緯度 : <span>" + station_data["Longitude_WGS84"] + " , " + station_data["Latitude_WGS84"] + "</span></div>";
        station_info += "<div>起訖時間 : <span>" + station_data["StnBeginTime"] + " ~ " + station_data["stnendtime"] + "</span></div>";
        $(".station_info").html(document.createTextNode(station_info).textContent);
        $(".station_info").slideDown("slow");
    });

    $(document).on("change", "select#prediction_choose", function() {
        var predict_info = "";
        var predict_name = $("#prediction_choose option:selected").text();
        var predict_type = $("#prediction_choose option:selected").data('type');
        var city = $("#city_choose").val();
        var area = $("#area_choose").val();
        var predict_data = predict_list[city][area][predict_type][predict_name];

        predict_info += "<div>預報點資訊 : <div>" + predict_name + "</div></div>";
        predict_info += "<div>經緯度 : " + predict_data["longitude"] + " , " + predict_data["latitude"] + "</div>";
        $(".predict_info").html(document.createTextNode(predict_info).textContent);
        $(".predict_info").slideDown("slow");
    });

    // 提交按鈕後的動作 
    $(document).on("click", "button#submit_btn", function() {
        if(check_value()) {
            return false;
        }
        $("span.station").text($("#station_choose option:selected").text());
        $("span.prediction").text($("#prediction_choose option:selected").text());
        $("span.start_time").text($("#start_time").val());
        $("span.temperature").text($("#temperature").val());
        $("span.degree").text($(".slider-input04").val());
        

        var data_list = {};
        data_list = get_form_data();
        $.ajax({
            type: "POST",
            url: global.controller + "/get_draw_data",
            data: data_list,
            dataType: "JSON",
            success: function (data_response) {
                draw_data = string_to_int(data_response);
                form_data = data_list;
                search_gdd_target(draw_data);
                arrange_table(draw_data);
                draw_gdd(draw_data);
            },
            error: function (data_response) { 
                $("#error-dialog").html("<p>"+ document.createTextNode(data_response.responseJSON[0]).wholeText +"</p>");
                //$("#error-dialog").html("<p>查無此測站資料</p>");
                $("#error-dialog").dialog({width: 350}).dialog("open").prev(".ui-dialog-titlebar").css("background", "#5B9BD5");
            }
        });
    });

    // 主要的畫圖函式(???)
    function redraw(){
        $(".degree").text($(".slider-input04").val());
        arrange_table(draw_data);
        search_gdd_target(draw_data);
        draw_gdd(draw_data);
    }

    // 設定的gdd_target，畫出目標GDD那條線
    function search_gdd_target(draw_data) {
        var gdd_target = $("#target_gdd").val();
        var target = moment(form_data["end_time"]).valueOf();
        $.each(draw_data["series"][0]["data"], function (index, value) { 
             if(value[1] >= parseInt(gdd_target)) {
                 target = value[0];
                return false;
             }
        });
        
        // 劃出目標積溫的那條線
        draw_data['series'][0]["markLine"] = {
            symbol: 'none',
            silent: false,
            data: [{
                xAxis: target
            }],
            label: {
                show: true, // 是否展示文字
                color: "red",
                formatter: function () {
                  return "目標積溫"
                }
            },
            lineStyle: {
                color: "red",
                width: 2,
                type: "solid" 
            }
        };
        return draw_data;
    }
    function string_to_int(draw_data) {
        $.each(draw_data["series"], function (index, series) { 
             $.each(series['data'], function (num, data) { 
                  data[0] = parseInt(data[0]);
                  data[1] = parseFloat(data[1]);
             });
        });
        return draw_data;
    }

    function draw_gdd(data) { 
        var start_time_unix = moment(form_data["start_time"]).valueOf();
        var end_time_unix = moment(form_data["end_time"]).valueOf();
        var chart = echarts.init($("#draw_GDD")[0]);
        switch (form_data["type_choose"]) {
            case '1':
                var type = "近五年記錄平均積溫";
                break;
            case '2':
                var type = "近十年記錄平均積溫";
                break;
            case '3':
                var type = "去年紀錄積溫"
                break;
            default:
                break;
        }
        var tooltip_html = "";
        var mydate =  moment().format('YYYY-MM-DD');
        var mydate_unix = moment().subtract(1, 'days').valueOf();
        var prediction_unix = moment().add(6, 'days').valueOf();

        option = {
            tooltip: {
                trigger: 'axis',
                formatter: function(params) {
                    tooltip_html = "<p>"+moment(params[0]["axisValue"]).format("MM/DD");
                    tooltip_html += " (距起始日 " + ((params[0]["axisValue"] - moment(form_data["start_time"]).valueOf())/86400000) + " 天)</p>";
                    $.each(params, function (index, value) { 
                        tooltip_html += "<p>" + value["marker"];
                        if(value["seriesIndex"] == 0) {
                            if(value["data"][0] > prediction_unix) {
                                tooltip_html += type +": " + value["data"][1] + " &deg;C</p>";
                            }
                            else if(value["data"][0] > mydate_unix && value["data"][0] <= prediction_unix) {
                                tooltip_html += "7天預報: " + value["data"][1] + " &deg;C</p>";
                            }
                            else {
                                tooltip_html += value["seriesName"] +": " + value["data"][1] + " &deg;C</p>";
                            }
                        }
                        else {
                            tooltip_html += value["seriesName"] +": " + value["data"][1] + " &deg;C</p>";
                        }
                    });
                    return tooltip_html;
                }
            },
            legend: {
                data: data.legend,
                top: '5%'
            },
            grid: {
                y: '23%',
                y2: '12%',
                containLabel: true
            },
            dataZoom: [
                {
                    show: true,
                    realtime: true,
                    labelFormatter: function (t) {
                        var time_stamp = new Date(t);
                        var month = ("0" + (time_stamp.getMonth() + 1)).substr(-2, 2);
                        var date = ("0" + time_stamp.getDate()).substr(-2, 2);
 
                        return month + "/" + date;
                    }
                },
                {
                    type: 'inside',
                    realtime: true,
                    start: 65,
                    end: 85
                }
            ],
            xAxis: {
                type: 'time',
                name: '月/日',
                nameTextStyle : {
                    color: '#6666FF',
                    fontWeight: 'bold'
                },
                min: start_time_unix,
                max: end_time_unix,
                axisLabel: {
                    formatter: function (t) {
                        var time_stamp = new Date(t);
                        var month = ("0" + (time_stamp.getMonth() + 1)).substr(-2, 2);
                        var date = ("0" + time_stamp.getDate()).substr(-2, 2);
 
                        return month + "/" + date;
                    },
                    showMinLabel: true,
                    showMaxLabel: true
                }  
            },
            yAxis: data.yAxis,
            series: data.series,
            visualMap: {
                top: 10,
                right: 10,
                dimension : 0,
                seriesIndex:0,
                show: false,
                orient:"horizontal",
                left:"center",
                top: '5%',
                pieces: [{
                    label: "選擇該年度之積溫-該年度歷史積溫",
                    gte: start_time_unix,
                    lte: mydate_unix,
                    color: '#00B050'
                }, {
                    label: "選擇該年度之積溫-7天預報",
                    gte: mydate_unix,
                    lte: prediction_unix,
                    color: '#FF0000'
                },{
                    label: "選擇該年度之積溫-" + type,
                    gte: prediction_unix,
                    lte: end_time_unix,
                    color: '#E3DE00'
                }],
                outOfRange: {
                    color: '#999'
                }
            },
        };
        chart.setOption(option, true);
    }

    function arrange_table(data) {
        var start_time = moment(form_data["start_time"]).valueOf();
        var target_gdd = $('#target_gdd').val();
        var table_data = {};
        var year_target = {"range":"","actual":"","goal":""};
        var last_target = {"range":"","actual":"","goal":""};
        var yr5_target = {"range":"","actual":"","goal":""};
        var yr10_target = {"range":"","actual":"","goal":""};
        var note = [];

        $.each(data["series"], function(index, line_data) { 
            $.each(line_data['data'], function(num, date_data) { 
                 if(date_data[1] >= parseInt(target_gdd)) {
                    switch (line_data['name']) {
                        case '前一年度積溫':
                            last_target["range"] = (date_data[0]-start_time)/86400000;
                            last_target["actual"] = date_data[1];
                            last_target["goal"] = moment(date_data[0]).format("YYYY/MM/DD");
                        　  break;
                        case '近五年平均積溫':
                            yr5_target["range"] = (date_data[0]-start_time)/86400000;
                            yr5_target["actual"] = date_data[1];
                            yr5_target["goal"] = moment(date_data[0]).format("YYYY/MM/DD");
                        　  break;
                        case '近十年平均積溫':
                            yr10_target["range"] = (date_data[0]-start_time)/86400000;
                            yr10_target["actual"] = date_data[1];
                            yr10_target["goal"] = moment(date_data[0]).format("YYYY/MM/DD");
                            break;
                        default:
                            year_target["range"] = (date_data[0]-start_time)/86400000;
                            year_target["actual"] = date_data[1];
                            year_target["goal"] = moment(date_data[0]).format("YYYY/MM/DD");
                            break;
                    }
                    return false;
                }
            });
            console.log(date_data)  
        });
        if(this_year) {
            note.push(moment(start_time).format("YYYY") + "積溫資料+" + form_data["type"]);
        }
        else {
            note.push(moment(start_time).format("YYYY") + "積溫資料");
        }
        note.push("近五年平均和近十年平均可能因為年份資料完整度不一，隨各測站建站及維護狀況有所不同或不滿5年及10年");
        table_data = {"year_target" : year_target,"last_target" : last_target,"yr5_target" : yr5_target, "yr10_target" : yr10_target};
        table_data = {"year_target" : year_target,"last_target" : last_target,"yr5_target" : yr5_target, "yr10_target" : yr10_target, "range_target": get_range(table_data)};
        create_table(table_data,note);
    }

    function get_range(data) {
        var range_arr = ['goal', 'range', 'actual'];
        var max = {};
        var min = {};
        var returned_data = {};
        $.each(range_arr, function (index, th) { 
            $.each(data, function (type, table_data) { 
                if(typeof(max[th]) === 'undefined' && typeof(min[th]) === 'undefined') {
                    max[th] = table_data[th];
                    min[th] = table_data[th];
                }

                if(max[th] === "" && min[th] === "") {
                    max[th] = table_data[th];
                    min[th] = table_data[th];
                }
                else {
                    if(th === "goal" && table_data[th] != "") {
                        max[th] = (moment(table_data[th].replace(/\//g,"-")).isAfter(max[th].replace(/\//g,"-")))? table_data[th]:max[th];
                        min[th] = (moment(table_data[th].replace(/\//g,"-")).isBefore(min[th].replace(/\//g,"-")))? table_data[th]:min[th];
                    }
                    else {
                        max[th] = (table_data[th] > max[th])? table_data[th]:max[th];
                        min[th] = (table_data[th] < min[th])? table_data[th]:min[th];
                    }
                }
            });
            if(th === "goal") {
                if(min[th] != max[th] && min[th] != "" && max[th] != "") {
                    returned_data[th] = moment(min[th].replace(/\//g,"-")).format("MM/DD") + " ~ " + moment(max[th].replace(/\//g,"-")).format("MM/DD");
                }
                else if(max[th] != "" && min[th] != max[th]) {
                    returned_data[th] = moment(max[th].replace(/\//g,"-")).format("MM/DD");
                }
                else if(min[th] != "" && min[th] != max[th]) {
                    returned_data[th] = moment(min[th].replace(/\//g,"-")).format("MM/DD");
                }
                else if(min[th] == max[th] && min[th] != "") {
                    returned_data[th] = moment(min[th].replace(/\//g,"-")).format("MM/DD");
                }
                else {
                    returned_data[th] = "";
                }
            }
            else {
                if(min[th] != max[th] && min[th] != "") {
                    returned_data[th] = min[th]+ " ~ " + max[th];
                }
                else {
                    returned_data[th] = max[th];
                }
            }
        });
        return  returned_data;
    }

    function create_table(data,note) {
        var table_html = "";
        var th_array = ["year_target", "last_target", "yr5_target", "yr10_target", "range_target"];
        $.each(th_array, function (index, type) { 
            table_html += "<tr>"; 
            switch (type) {
                case "year_target":
                    table_html += "<td>所選年度(" + moment(form_data['start_time']).format("YYYY") + ")</td>";
                    break;
                case "last_target":
                    table_html += "<td>所選前一年度(" + moment(form_data['start_time']).subtract(1, "year").format("YYYY") + ")</td>";
                    break;
                case "yr5_target":
                    table_html += "<td>近五年平均<p>( " + moment().subtract(5, "year").format("YYYY") + "~" + moment().subtract(1, "year").format("YYYY") +" )</p></td>";
                    break;
                case "yr10_target":
                    table_html += "<td>近十年平均<p>( " + moment().subtract(10, "year").format("YYYY") + "~" + moment().subtract(1, "year").format("YYYY") +" )</p></td>";
                    break;
                case "range_target":
                    table_html += "<td>範圍</td>";
                    break;
                default:
                    break;
            }
            if(data[type]['goal'] != "" && type != "range_target") {
                table_html += "<td>" + moment(data[type]['goal'].replace(/\//g,"-")).format("MM/DD") + "</td>";

            }
            else if(type == "range_target") {
                table_html += "<td>" + data[type]['goal'] + "</td>";
            }
            else {
                if(typeof(draw_data["series"][index]) == "undefined") {
                    table_html += "<td>資料年份不足計算至積溫設定值</td>";
                }
                else {
                    table_html += "<td>已超出12/31，現無跨年度計算</td>";
                }
            }
            table_html += "<td>" + data[type]['range'] + " 天</td>";
            table_html += "<td>" + data[type]['actual'] + " &deg;C</td>";
            table_html += "</tr>"; 
        });

        var content_html = "";
        $.each(note, function(index, content) {
            content_html += "<div><span>註" + (index+1) + ":</span> "+ content +"</div>";
        });
        $("div#note").html(content_html);
        $("table tbody").html(table_html);
    }

    function get_city_list() {
        $.ajax({
            type: "GET",
            url: global.controller + "/get_city_list.json",
            dataType: "JSON",
            success: function (data_response) {
                city_list = data_response;
                $.each(data_response, function (city_name, area) { 
                     $("#city_choose").append("<option>" + city_name + "</option>");
                });           
            }
        });
    }

    function get_station_list() {
        $.ajax({
            type: "GET",
            url: global.controller + "/get_station_list.json",
            dataType: "JSON",
            success: function (data_response) {
                station_list = data_response;
            }
        });
    }

    function create_station_list(city, area) {
        var station_html = "<option disabled selected>測站選擇</option>";
        
        $.each(station_list[city][area], function(station_type, station_data) { 
            station_html += "<optgroup label=" + station_type + ">";
            $.each(station_data, function (name, data) {
                //當stnendtime為空值表示該測站已被撤站
                station_html += "<option data-type=" + station_type +" value=" + data["ID"] + " >" + name + "</option>";
            });
            station_html += "</optgroup>";
        });
        $("#station_choose").html(station_html);
    }

    function get_predict_list() {
        $.ajax({
            type: "GET",
            url: global.controller + "/get_predict_list.json",
            dataType: "JSON",
            success: function (data_response) {
                predict_list = data_response;    
            }
        });
    }

    function create_predict_list(city, area) {
        var predict_html = "<option disabled selected>預報點選擇</option>";

        $.each(predict_list[city][area], function (predict_type, predict_data) { 
            predict_html += "<optgroup label=" + predict_type + ">";
            $.each(predict_data, function (name, data) {
                //當stnendtime為空值表示該測站已被撤站
                predict_html += "<option data-type='" + predict_type + "'value=" + data["ID"] + ">" + name + "</option>";
            });
            predict_html += "</optgroup>";
        });
        $("#prediction_choose").html(predict_html);
    }

    function check_value() { 
        var check = false;;
        $(".area_config input").each(function() { 
            $(this).removeClass("require");
            if($(this).val() === "") {
                $(this).addClass("require");
                check = true;
            }
        });
        $(".area_config select").each(function() { 
            if($(this).attr('id') === 'type_choose') {
                return;
            }
            $(this).removeClass("require");
            if($(this).val() === "" || $(this).val() == null) {
                $(this).addClass("require");
                check = true;
            }
       });

       return check;
    }

    function get_form_data(){
        var data_list = {};
        $(".area_config .form_data").each(function(num, dom) {
            data_list[$(dom).attr("id")] = $(dom).val();
            if($(dom).attr("id") === "start_time" || $(dom).attr("id") === "end_time") {
                data_list[$(dom).attr("id")] = $(dom).val() + " 00:00:00";
            }
        });
        data_list["prediction_type"] = $("#prediction_choose option:selected").data("type");
        data_list["type"] = $("#type_choose option:selected").text();
        return data_list;
    }
});

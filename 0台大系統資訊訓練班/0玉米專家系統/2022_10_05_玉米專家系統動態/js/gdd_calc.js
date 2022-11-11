// 取得表單資訊時間  TODO:  氣象站代碼沒有自動化
function get_form_data(){
    var data_list = {};
    $(".form-box .form_data").each(function(num, dom) {
        data_list[$(dom).attr("id")] = $(dom).val(); //把每個id加進list
        if($(dom).attr("id") === "plantTime") { //|| $(dom).attr("id") === "end_time"
            data_list[$(dom).attr("id")] = $(dom).val(); // + " 00:00:00"
        }
    });
    // data_list["prediction_type"] = $("#prediction_choose option:selected").data("type");
    // data_list["type"] = $("#type_choose option:selected").text();
    // console.log(data_list);
    return data_list;    
}


// 對檔案算積溫
//  https://www.freecodecamp.org/news/how-to-read-json-file-in-javascript/
let temp_data = '';
// 跑100日的迴圈用，使用 Array.from 內建的 map() 函式：產生連續數字陣列
const numbers100 = Array.from({ length: 100 }, (v, k) => k);

// TODO:  將抓取資料自動化，目前只有下載好的檔案
let get_temp_data = fetch('./data/虎尾_2016_2021.json')
                .then((response) => response.json())
                .then((json) => temp_data = json);

// TODO: 預報未涵蓋的部分，使用歷史資料平均
// TODO: 對於某個目標GDD換算積溫

// 對某個日期增加某個天數的函數
function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}


// 計算種植日起100天後的GDD，儲存為[[日期],[累積積溫序列]]
function count_gdd(){
    // 暫時設定一個日期
    const plant_time = '2020-02-15'; 
    // const plant_time = get_form_data()['plantTime'];
    // console.log(temp_data[plant_time]);
    let gdd_agg = 0;
    let draw_data = [[],[]];
    numbers100.forEach(function(day, i) {
        let ptime =  addDays(plant_time, day).toISOString().slice(0, 10);
        let tmax = temp_data[ptime][1];
        let tmin = temp_data[ptime][2];
        if (tmax != '...') {
            tmax = parseFloat(tmax);            
        }else{
            tmax = 0;
        }        
        if (tmin != '...') {
            tmin = parseFloat(tmin);            
        }else{
            tmin = 0;
        }
        
        let gdd_new = (tmax + tmin)/2 - 10;
        if  (gdd_new < 0){
        gdd_new = 0;
        }
        gdd_agg += gdd_new;
        draw_data[0].push(ptime);
        draw_data[1].push(gdd_agg);
        // console.log(ptime, tmax, tmin, gdd_new, gdd_agg)        
      });
           
    return draw_data
}

// 畫圖的函數
function draw(){
    const draw_data = count_gdd()
    // 畫圖，暫時放在同一個檔案
    Highcharts.chart('container', {

        title: {
        text: '自種植日起積溫'
        },
    
        subtitle: {
        text: 'Source: <a href="https://irecusa.org/programs/solar-jobs-census/" target="_blank">IREC</a>'
        },
    
        yAxis: {
        title: {
            text: 'GDDs'
        }
        },
    
        xAxis: {
        accessibility: {
            rangeDescription: '自種植日起100天'
        }
        },
    
        legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle'
        },
    
        plotOptions: {
        series: {
            label: {
            connectorAllowed: false
            },
            pointStart: 0
        }
        },
    
        series: [{
        name: '積溫',
        data: draw_data[1]
        }
        // , {
        //   name: 'Manufacturing',
        //   data: [24916, 37941, 29742, 29851, 32490, 30282,
        //     38121, 36885, 33726, 34243, 31050]
        // }, {
        //   name: 'Sales & Distribution',
        //   data: [11744, 30000, 16005, 19771, 20185, 24377,
        //     32147, 30912, 29243, 29213, 25663]
        // }, {
        //   name: 'Operations & Maintenance',
        //   data: [null, null, null, null, null, null, null,
        //     null, 11164, 11218, 10077]
        // }, {
        //   name: 'Other',
        //   data: [21908, 5548, 8105, 11248, 8989, 11816, 18274,
        //     17300, 13053, 11906, 10073]
        // }
    ],
    
        responsive: {
        rules: [{
            condition: {
            maxWidth: 500
            },
            chartOptions: {
            legend: {
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom'
            }
            }
        }]
        }
    
    });
    return 0;
}


$(document).on("click", "button", function() {
    console.log('按鈕成功')
    imafunction = draw()
    // if(check_value()) {
    //     return false;
    // }
    // $("span.station").text($("#station_choose option:selected").text());
    // $("span.prediction").text($("#prediction_choose option:selected").text());
    // $("span.start_time").text($("#start_time").val());
    // $("span.temperature").text($("#temperature").val());
    // $("span.degree").text($(".slider-input04").val());
    

    // var data_list = {};
    // data_list = get_form_data();
    // $.ajax({
    //     type: "POST",
    //     url: global.controller + "/get_draw_data",
    //     data: data_list,
    //     dataType: "JSON",
    //     success: function (data_response) {
    //         draw_data = string_to_int(data_response);
    //         form_data = data_list;
    //         search_gdd_target(draw_data);
    //         arrange_table(draw_data);
    //         draw_gdd(draw_data);
    //     },
    //     error: function (data_response) { 
    //         $("#error-dialog").html("<p>"+ document.createTextNode(data_response.responseJSON[0]).wholeText +"</p>");
    //         //$("#error-dialog").html("<p>查無此測站資料</p>");
    //         $("#error-dialog").dialog({width: 350}).dialog("open").prev(".ui-dialog-titlebar").css("background", "#5B9BD5");
    //     }
    // });
});


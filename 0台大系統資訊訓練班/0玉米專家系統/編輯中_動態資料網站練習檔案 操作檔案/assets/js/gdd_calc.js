// 取得表單資訊時間  TODO:  氣象站代碼沒有自動化
function get_form_data(){
    var data_list = {};
    $(".form-box .form_data").each(function(num, dom) {
        data_list[$(dom).attr("id")] = $(dom).val(); //把每個id加進list
        if($(dom).attr("id") === "plantTime") { //|| $(dom).attr("id") === "end_time"
            data_list[$(dom).attr("id")] = $(dom).val() + " 00:00:00";
        }
    });
    // data_list["prediction_type"] = $("#prediction_choose option:selected").data("type");
    // data_list["type"] = $("#type_choose option:selected").text();
    // console.log(data_list);
    return data_list;    
}

// 對檔案算積溫
// const tempData = require('./虎尾_2016_2021.json');
// console.log(tempData)

function get_temp_data() {
    $.ajax({
        type: "GET",
        url:  global.controller + '/虎尾_2016_2021.json',
        dataType: "JSON",
        success: function (data_response) {
            temp_list = data_response;
            console.log(temp_list);
            // $.each(data_response, function (city_name, area) { 
            //      $("#city_choose").append("<option>" + city_name + "</option>");
            // });           
        },
        error:function(){
            alert('請求失敗')
        }
    });
}

// fetch("..//gdd_calculation/get_city_list.json")
//     .then((response) => response.json())
//     // .then((json) => console.log(json));
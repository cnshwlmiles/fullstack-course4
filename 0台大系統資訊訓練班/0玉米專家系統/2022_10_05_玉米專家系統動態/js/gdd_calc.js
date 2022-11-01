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
// 使用 Array.from 內建的 map() 函式：產生連續數字陣列
const numbers100 = Array.from({ length: 100 }, (v, k) => k);
let get_temp_data = fetch('./data/虎尾_2016_2021.json')
                .then((response) => response.json())
                .then((json) => temp_data = json);

// 暫時設定一個日期
const plant_time = '2020-02-15';

// 增加天數的函數
function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function count_gdd(){
    
    // const plant_time = get_form_data()['plantTime'];
    

    // console.log(temp_data[plant_time]);
    let gdd_agg = 0

    numbers100.forEach(function(day, i) {
        let ptime =  addDays(plant_time, day).toISOString().slice(0, 10)
        let tmax = parseFloat(temp_data[ptime][1]);
        let tmin = parseFloat(temp_data[ptime][2]);
        let gdd_new = (tmax + tmin)/2 - 10; 
        if (typeof(gdd_new) != NaN) {
            gdd_agg += gdd_new;
          } else {         
        }

        console.log(ptime, tmax, tmin, gdd_new, gdd_agg)
      });
    
    return 0;
} 



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
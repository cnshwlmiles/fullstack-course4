// JS註解
// $("CSS選擇器") => jQuery選擇器(函數)
// 函數()
// 綁定.navbar-toggler的點擊事件
// function(){}
$(".navbar-toggler").click(function () {
    // 當.navbar-toggler被點擊後要做的事情...
    // alert("按鈕被點了...");
    // 讓.navbar-list切換.active
    $(".navbar-list").toggleClass("active");
    $(".line").toggleClass("active");
});

// 原生JavaScript
// document.querySelectorAll('.navbar-toggler').forEach(function (btn) {
//     btn.addEventListener('click', function () {
//         alert("按鈕被點了...");
//     });
// });




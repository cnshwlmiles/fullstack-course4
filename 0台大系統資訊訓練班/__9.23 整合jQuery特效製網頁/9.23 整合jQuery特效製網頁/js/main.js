// 網頁的主程式寫在這裡
$(".ad-toggle-btn").click(function () {
    // 點擊後要觸發的特效
    // 讓.ad-box的元素切換active分類
    $(".ad-box").toggleClass("active");
});

$(".navbar .nav-link").click(function () {
    // 這個被點到的按鈕
    console.log(this);
    // 取得目標
    // 這個按鈕href的值
    const target = $(this).attr("href");
    console.log("移動目標", target);
    // 取得目標的座標
    const position = $(target).offset().top;
    console.log("座標", position);
    // (先停止)執行動畫
    $("html,body").stop().animate({
        scrollTop: position
    }, 1000);
});
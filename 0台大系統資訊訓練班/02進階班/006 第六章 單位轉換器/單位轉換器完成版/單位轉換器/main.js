// 英吋轉公分功能實作

// 取得公分與英吋的輸入框DOM(標籤)
const inchInput = document.getElementById("inchInput"),
    cmInput = document.getElementById("cmInput"),
    inchErr = document.getElementById("inchErr"),
    cmErr = document.getElementById("cmErr");

// 綁定英吋輸入框的輸入變更事件
inchInput.addEventListener("input", function () {
    console.log("英吋資料被改變");
    // 清空錯誤訊息
    inchErr.innerText = "";
    // 取得英吋值
    const inch = parseFloat(inchInput.value);
    console.log("inch", inch);
    // 轉換成公分
    let cm = inch * 2.54;
    // 四捨五入到小數點第二位
    cm = Math.round(cm * 100) / 100;
    // 公分的值放到公分輸入框
    cmInput.value = cm;
    // 如果英吋是NaN
    if (isNaN(inch)) {
        // 如果條件為true
        inchErr.innerText = "請輸入數字";
    }
});

cmInput.addEventListener("input", function () {
    const cm = parseFloat(cmInput.value);
    let inch = cm / 2.54;
    inch = Math.round(inch * 100) / 100;
    inchInput.value = inch;
    cmErr.innerText = "";
    if (isNaN(cm)) {
        cmErr.innerText = "請輸入數字";
    }
});

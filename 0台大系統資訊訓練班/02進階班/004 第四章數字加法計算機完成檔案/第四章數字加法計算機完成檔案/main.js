// 取得畫面上要控制的標籤(DOM, Document Object Model)
// 好幾個常數後面用逗號
const form = document.getElementById("form"),
    xInput = document.getElementById("xInput"),
    yInput = document.getElementById("yInput"),
    result = document.getElementById("result");
// 從標籤上取得的任何資料都是字串

form.addEventListener("submit", function (e) {
    // 預防重新整理的預設行為
    e.preventDefault();
    // 表單送出後的流程
    console.log("表單被送出囉!", e);


    // const x = parseInt(xInput.value);
    const x = parseFloat(xInput.value);
    // console.log("x", x);
    const y = parseInt(yInput.value);
    // console.log("y", y);
    const ans = x + y;
    result.innerText = ans;
});


// typeof 資料 => 資料型別
// string 字串
// number 數字
// boolean 布林(true, false)
// object 物件 {}
// console.log(typeof "Hello");
// console.log(typeof 2.15);
// console.log(typeof false);
// console.log(typeof { name: "Andy", age: 30 });

// const a = 30;
// const b = 90;
// const c = "90";

// 轉換為整數或小數
// parseInt("30.5") => 30
// paserFloat("30.5") => 30.5
// console.log(a + b);
// console.log(a + parseInt(c));


// Ctrl + /
// console.log(a - b);
// console.log(a * b);
// console.log(a / b);
// 取10除3的餘數
// console.log(10 % 3);
// 取12除3的餘數
// console.log(12 % 3);
// 跳出一個小視窗
// alert("Hello");
// 在主控台印出文字Hello

// const 常數: 不可重新賦予新值
// let 變數: 可重新賦予新值

// 建立常數username並儲存"David"
// const username = "tONY";
// console.log(username);
// console.log("Hello " + username);
// username = "Tony";
// console.log("Hi " + username);
// console.log("哈囉 " + username);

const nameInput = document.getElementById("nameInput");
const ageInput = document.getElementById("ageInput");
const titleInput = document.getElementById("titleInput");
const btn = document.getElementById("btn");
const introBlock = document.getElementById("introBlock");
// 綁定按鈕的點擊事件
btn.addEventListener("click", function () {
    // btn被點擊後才做的事情
    // console.log("Hello " + nameInput.value);
    const name = nameInput.value;
    const age = ageInput.value;
    const title = titleInput.value;
    // introBlock.innerText = "Hello 我是" + name + "是一個" + age + "歲的" + title + "。";
    introBlock.innerHTML = `<h1>Hello</h1>
        <h2>我是${name}是一個${age}歲的${title}。</h2>`;
});



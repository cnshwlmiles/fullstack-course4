// 跳出一個小視窗
// alert("Hello");

// 在主控台(Chrome f12 console)印出文字 哈囉三年三班手工薯條
// console.log("哈囉三年三班手工薯條");

// 3.2 變數與常數
// const 常數: 不可重新賦予新值
// 如由使用者提供的input
// let 變數: 可重新賦予新值

// 一次設定多個變數時，可簡寫為

// let user1 = 'Andy',
//     user2 = 'Josh',
//     user3 = 'Abby';


// 建立常數或變數username 並儲存"tONY"
const username = "tONY";
// let username = "tONY";
console.log(username);
console.log("Hello " + username);

// 常數不可更新
// username = "Tony2"; //一旦產生erron後續就會無法工作
// console.log("Hi " + username);
// console.log("哈囉 " + username);

// 真正的自我介紹產生器功能開始
// 藉由ID取得元素
const nameInput = document.getElementById("nameInput");
const ageInput = document.getElementById("ageInput");
const titleInput = document.getElementById("titleInput");
const interestInput = document.getElementById("interestInput");
const btn = document.getElementById("btn");
const introBlock = document.getElementById("introBlock");
// 這些const是一個HTML input element

// 綁定按鈕的點擊事件
// click是事件，function是客製化函數
btn.addEventListener("click", function () {
    // btn被點擊後才做的事情
    
    // 呈現在console上面
    // console.log("Hello " + nameInput.value);
    
    // .value是取值
    const name = nameInput.value;
    const age = ageInput.value;
    const title = titleInput.value;
    const interest = interestInput.value;

    // 使用innerText可以直接改變文字
    // introBlock.innerText = "Hello 我是" + name + "是一個" + age + "歲的" + title + "。";
    
    // 以下相當於python的f'()，只是要用`
    introBlock.innerHTML = `<h1>Hello</h1>
        <h2>我是${name}是一個${age}歲的${title}。</h2>
        <h2>我喜歡${interest}。</h2>`;
});



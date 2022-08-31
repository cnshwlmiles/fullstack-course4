/*
 * TODO: 串接https://www.thecocktaildb.com/api/ 決定今晚要喝什麼飲料
 */

// data2 = {}

// 先將需要的常數(?抓出來
const btn = document.getElementById("btn");
const reportBlock = document.getElementById("reportBlock");

// IPINFO API URL
const url = "https://www.thecocktaildb.com/api/json/v1/1/random.php";

// 綁定按鈕的點擊事件
btn.addEventListener("click", function () {
    console.log("準備取得使用者的IP資訊");

    // 使用官方範例取得資料，但是有很多then比較麻煩
    // fetch("https://ipinfo.io/json?token=a487570b662ea4").then(
    // (response) => response.json()
    // ).then(
    // (jsonResponse) => console.log(jsonResponse.ip, jsonResponse.country)
    // )

    // 透過axios對API發送HTTP Request (常見方式，知名函式庫)
    // then 跟 catch 都是官方函數裡面放的東西，.get().then().catch()
    // 為了排版方便把他切開，()裡面都要放函數，res是函數的名字，可自由命名
    axios
        .get(url)

        // .then .catch 是來處理錯誤流程的
        // 如果請求有發出且成功獲得後端的回應
        .then(
            // function(res){
            //     console.log( res)
            // }  

            //以下為簡寫  
            res => {
                console.log("ipinfo伺服器的回應", res);

                // 兩個表示方式都可以
                // const data = res.data;
                // const { data } = res;
                const data = res.data.drinks[0]
                

                console.log("ipinfo回傳的資料", data);

                // 資料解析
                const {strDrink, strInstructions, strDrinkThumb} = data
                console.log('飲料是', strDrink)

                const report = `<div class="alert alert-info">
                    Your drink: ${strDrink} <br>
                    Instuctions: ${strInstructions} <br>
                    <img src="${strDrinkThumb}" alt="${strDrink}" srcset="">                                    
                </div>
                `;
                reportBlock.innerHTML = report;
            }
        )

        // 如果取得資料的流程發生了任何錯誤(錯誤處理)
        .catch(err => {
            console.log("發生錯誤", err);
            const report = `<div class="alert alert-danger">
                發生錯誤，請確認網路連線正常，並再次嘗試。
            </div>`;
            reportBlock.innerHTML = report;
        });
});

//  * TODO: 串接https://www.thecocktaildb.com/api/ 決定今晚要喝什麼飲料

const btn = document.getElementById("btn");
const reportBlock = document.getElementById("reportBlock");

// IPINFO API URL
const url = "https://www.thecocktaildb.com/api/json/v1/1/random.php";

// 綁定按鈕的點擊事件
btn.addEventListener("click", function () {
    console.log("準備取得使用者的IP資訊");

    axios
        .get(url)

        // .then .catch 是來處理錯誤流程的
        // 如果請求有發出且成功獲得後端的回應
        .then(
            res => {
                const data = res.data.drinks[0]

                // 資料解析
                const {strDrink, strInstructions, strDrinkThumb} = data
                console.log('飲料是', strDrink)

                // 第一部分
                let report = `<div class="alert alert-info">
                <span class="text-primary">Your Drink Today:&nbsp;</span>
                <span class="text-big">${strDrink}</span> <br>                   
                `;

                // 第二部分加入各種成分
                array15 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
                array15.forEach(num => {               
                    keytmp = `strIngredient${num}`;
                    if (data[keytmp] != null) {                        
                        report += `<span class="text-primary">Ingredient${num}:</span> ${data[keytmp]} <br>`
                    }
                });

                // 第三部分加入作法
                report += `<span class="text-primary">Instructions:</span> ${strInstructions} <br>
                <br> 
                <img src="${strDrinkThumb}" height='400' alt="${strDrink}">                                    
                </div>` 
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
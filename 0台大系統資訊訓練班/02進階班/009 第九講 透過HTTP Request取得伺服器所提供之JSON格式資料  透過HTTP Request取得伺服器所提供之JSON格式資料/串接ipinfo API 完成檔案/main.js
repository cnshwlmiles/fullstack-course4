/*
 * TODO: 串接ipinfo.io服務取得使用者的IP資訊，並顯示結果於網頁上
 * https://ipinfo.io/
 * 一個可回傳用戶端IP資訊的公開API服務
 */
const btn = document.getElementById("btn");
const reportBlock = document.getElementById("reportBlock");

// IPINFO API URL
const url = "https://ipinfo.io/json?token=9828da42eb0f24";

// 綁定按鈕的點擊事件
btn.addEventListener("click", function () {
    console.log("準備取得使用者的IP資訊");
    // 透過axios對API發送HTTP Request
    axios
        .get(url)
        // 如果請求有發出且成功獲得後端的回應
        .then(res => {
            // console.log("ipinfo伺服器的回應", res);
            // const data = res.data;
            const { data } = res;
            console.log("ipinfo回傳的資料", data);
            const { city, country, ip, org, timezone } = data;
            const report = `<div class="alert alert-info">
                CITY: ${city} <br>
                COUNTRY: ${country} <br>
                IP: ${ip} <br>
                組織: ${org} <br>
                時區: ${timezone}
            </div>`;
            reportBlock.innerHTML = report;
        })
        // 如果取得資料的流程發生了任何錯誤
        .catch(err => {
            console.log("發生錯誤", err);
            const report = `<div class="alert alert-danger">
                發生錯誤，請確認網路連線正常，並再次嘗試。
            </div>`;
            reportBlock.innerHTML = report;
        });
});
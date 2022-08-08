// 成績計算表單
const scoreForm = document.getElementById('scoreForm');
// 各科目分數輸入框
const zhInput = document.getElementById('chineseScoreInput');
const enInput = document.getElementById('englishScoreInput');
const mathInput = document.getElementById('mathScoreInput');
// 報告顯示區塊
const reportDiv = document.getElementById('result');

scoreForm.addEventListener('submit', function (e) {
    // 防止表單重整畫面
    e.preventDefault();
    console.log("表單被送出了");
    // 取得各科目成績
    const zh = parseInt(zhInput.value),
        en = parseInt(enInput.value),
        math = parseInt(mathInput.value);

    // 計算總分
    const sum = zh + en + math;
    console.log("總分", sum);

    // 計算平均分數
    const avg = Math.round(sum / 3 * 100) / 100;
    console.log("avg", avg);

    // 計算等級
    // 平均分數 >= 90 為A+
    // 平均分數 >= 80 為A
    // 平均分數 >= 70 為B
    // 平均分數 >= 60 為C
    // 平均分數 < 60 為F。
    let gpa;
    let color = "secondary";
    if (avg >= 90) {
        gpa = "A+";
        color = "success";
    } else if (avg >= 80) {
        gpa = "A";
    } else if (avg >= 70) {
        gpa = "B";
    } else if (avg >= 60) {
        gpa = "C";
    } else {
        // 上述條件都不符合時 < 60
        gpa = "F";
        color = "danger";
    }

    // 顯示報告
    const report = `<div class="alert alert-${color}">
        國文: ${zh} <br>
        英文: ${en} <br>
        數學: ${math} <br>
        總分: ${sum} <br>
        平均分: ${avg} <br>
        總評: ${gpa}
    </div>`;
    reportDiv.innerHTML = report;
});
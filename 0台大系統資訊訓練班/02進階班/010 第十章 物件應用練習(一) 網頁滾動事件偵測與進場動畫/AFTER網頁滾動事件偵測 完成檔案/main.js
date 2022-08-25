// 選取所有導覽列中的連結nav-link (4個section的連結)
// .navbar class="navbar" 裡面的 class="nav-link" (跟CSS選擇器一樣)
const navLinkList = document.querySelectorAll('.navbar .nav-link'),
    // 導覽列
    navbar = document.getElementById('navbar'),
    // 滑動資訊報告元件
    scrollReport = document.getElementById('scrollReport');

// console.log('navLinkList', navLinkList)
console.log('navLinkList', navLinkList[0].innerText)
// navLinkList Section 1

// console.log('navbar', navbar)
// console.dir(scrollReport)
// 找出所有可以用的屬性

// 10.2 透過物件建構區塊與連結的關聯表
// 建立章節資訊查詢表 navigationTable (結果要存成下面的樣子)
/*
 * {
 *    section1: {section: sectionDOM, link: navLinkDOM},
 *    section2: {...}, ...
 * }
 *
 */


// const array1 = ['a', 'b', 'c'];
// array1.forEach(element => console.log(element));

// 產生一個空白物件
const navigationTable = {};

// 透過forEach迴圈取出 navLinkList 裡所有的連結DOM
navLinkList.forEach(a => {
    // console.log("a", a);
    
    // .dataset.target .dataset會抓到data-xxx的部分
    const sectionId = a.dataset.target;
    
    // 存進物件裡面
    // 物件["屬性名"] = 值
    navigationTable[sectionId] = {
        // 標籤
        link: a,
        // section
        section: document.getElementById(sectionId)
    };
});

console.log(navigationTable);

// 綁定視窗(window)的滾動事件(scroll)
// https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event
window.addEventListener('scroll', function () {
    
    // 取得視窗的直向滑動偵測點(scrollY)
    // 視窗頂邊的座標 + 導覽列的高度
    const y = Math.round(window.scrollY + navbar.offsetHeight);
    // console.log("目前所在的位置是", y);
    scrollReport.innerText = `目前所在的位置是 ${y}`;
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY

    // 取得每個章節的所在位置頂邊座標(offsetTop)、底邊座標(offsetTop + offsetHeight)
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetTop
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight
    for (const sid in navigationTable) {
        // 物件["屬性名"]
        const section = navigationTable[sid].section;
        const link = navigationTable[sid].link;
        // console.log("link", link);
        // 取得元素頂邊的座標
        const top = section.offsetTop;
        // 取得元素底邊的座標 = 頂邊座標 + 元素的高度
        const bottom = top + section.offsetHeight;
        // console.log(sid, top, bottom);
        // 如果 y 大於頂邊座標 且 y 小於底邊座標
        // 判定y是否在此section內
        if (y > top && y < bottom) {
            // console.log("要上色的a標籤是", link);
            // 標籤DOM.classList.add("要新增的class名稱")
            link.classList.add("text-warning");
            section.classList.add("is-active");
        } else {
            // 如果y值不在這個section內
            link.classList.remove("text-warning");
            section.classList.remove("is-active");
        }
    }
});
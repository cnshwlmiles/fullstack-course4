// 所有導覽列中的連結nav-link
// .navbar class="navbar" 裡面的 class="nav-link"
const navLinkList = document.querySelectorAll('.navbar .nav-link'),
    // 導覽列
    navbar = document.getElementById('navbar'),
    // 滑動資訊報告元件
    scrollReport = document.getElementById('scrollReport');

// 建立章節資訊查詢表 navigationTable
/*
 * {
 *    section1: {section: sectionDOM, link: navLinkDOM},
 *    section2: {...}, ...
 * }
 *
 */
const navigationTable = {};
// 透過forEach迴圈取出 navLinkList 裡所有的連結DOM
navLinkList.forEach(a => {
    console.log("a", a);
    const sectionId = a.dataset.target;
    // 物件["屬性名"] = 值
    navigationTable[sectionId] = {
        link: a,
        section: document.getElementById(sectionId)
    };
});

console.log(navigationTable);

// 綁定視窗(window)的滾動事件(scroll)
// https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event
window.addEventListener('scroll', function () {
    // 取得視窗的直向滑動偵測點(scrollY)
    const y = window.scrollY;
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY

    // TODO: 取得每個章節的所在位置頂邊座標(offsetTop)、底邊座標(offsetTop + offsetHeight)
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetTop
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight

});
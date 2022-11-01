// 15.10 使共用資料獨立 透過find函數在陣列中尋找符合條件的資料
const categoryList = [
    { id: "1", title: "食品" },
    { id: "2", title: "電子產品" },
    { id: "3", title: "書籍" },
    { id: "4", title: "日用品" },
    { id: "5", title: "清潔用品" },
    { id: "6", title: "音響" },
    { id: "7", title: "3C產品" },
    { id: "8", title: "文具" },
    { id: "9", title: "衣物" },
];

// 如果要給其他檔案用
// 把資料輸出
module.exports = categoryList;
// require('category-list') => categoryList
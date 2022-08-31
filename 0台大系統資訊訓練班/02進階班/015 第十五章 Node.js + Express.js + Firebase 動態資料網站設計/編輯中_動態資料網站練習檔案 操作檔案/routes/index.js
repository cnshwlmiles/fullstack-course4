// 15.4 建立一個新的頁面

const express = require('express');
const router = express.Router();

// 首頁路由 
router.get('/', function (req, res, next) {
  // Cloud Firestore 規格
  // doc.id => 取得文件的id(字串)
  // doc.data() => 取得文件的原始資料(物件)
  const productList = [];
  // 取得產品列表 ES7
  // 將產品列表傳遞到模板
  res.locals.productList = productList;
  // 將views/index.ejs 模板產生的HTML回應給瀏覽器
  // (在views資料夾底下的index.ejs)
  res.render('index');
});

// 15.4 建立一個新的頁面
// 加入路由之後會轉圈圈，不會404NOTFOUND
router.get('/about', (req, res, next) => {
  res.render('about-page')
})

module.exports = router;

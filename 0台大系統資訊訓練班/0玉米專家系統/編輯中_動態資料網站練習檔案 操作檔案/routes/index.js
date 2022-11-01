// 15.4 建立一個新的頁面

const express = require('express');
const router = express.Router();
const db = require('../db');
const categoryList = require('../model/category-list')

// 首頁路由 
// 15.9從雲端資料庫取得集合資料並透過EJS模板渲染
// await要用async function
router.get('/', async function (req, res, next) {

  // Cloud Firestore 規格
  // doc.id => 取得文件的id(字串)
  // doc.data() => 取得文件的原始資料(物件)
  // 將資料庫的產品存成列表格式
  const productList = [];
  // 取得產品列表 ES7
  // 取得productList集合(collection)裡所有的文件(document)
  // JS ES7出現的 await語法，建議在後端用不要在前端用，因為後端一定有網路
  // SyntaxError: await is only valid in async functions and the top level bodies of modules
  const productCollection = await db.collection('productList').get();
  // console.log('產品集合', productCollection);
    // 傳統寫法
    // .then()
    // .catch()
  // 把集合內的文件逐一取出 (資料很複雜)
  productCollection.forEach(doc => {
    // console.log('doc', doc);
    // console.log('文件ID', doc.id);
    // console.log('原始資料', doc.data());
    const product = doc.data();
    
    
    //將資料庫的ID存給product(物件.屬性 = 值);
    product.id = doc.id 
    
    // 15.10 使共用資料獨立 透過find函數在陣列中尋找符合條件的資料
    // 測試：印出產品的分類
    
    console.log('產品分類', product.category);
    // console.log('商品分類對照表', categoryList);
    const category = categoryList.find(a => a.id == product.category);
    console.log('[對應的分類]', category);
    // 將原本的數字類別，更換為文字類別
    product.category = category.title;

    // console.log('product', product);
    // 將product 物件新增到productList裡面
    productList.push(product)
  })

  // 將產品列表傳遞到模板 (用res.locals.渲染到前端??)
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

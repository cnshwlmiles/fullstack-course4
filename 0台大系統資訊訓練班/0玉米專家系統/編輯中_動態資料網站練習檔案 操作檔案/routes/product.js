const express = require('express');
const router = express.Router();
const db = require('../db');
// 15.12 在EJS模板中使用迴圈與判斷式渲染分類清單
const categoryList = require('../model/category-list');

// 產品詳情路由
router.get('/show/:pid', function (req, res, next) {
    // 渲染 product/show.ejs
    res.render('product/show');
});

// 建立產品路由
router.get('/create', function (req, res, next) {
    // 渲染 product/create.ejs
    res.render('product/create');
});

// 編輯產品路由
// 15.11 透過動態路由參數取得商品ID並顯示單一商品資料至編輯頁面中
// :冒號代表動態參數，(pid)可以取任何名稱
// 需引用db firebase喔
router.get('/edit/:pid', async function (req, res, next) {
    // TODO: 取得動態路由參數:pid
    // 取得我們在index.ejs 設定的id 網址
    const pid = req.params.pid;
    console.log("pid", pid);

    // TODO: 透過pid至firebase取得指定文件的資料
    // db.doc('集合名稱/文件的ID').get()
    const doc = await db.doc(`productList/${pid}`).get();
    // 正常需要 + .then() .catch()，但後端不太會出錯，所以可以不用寫
    // await 記得要用 async function
    const product = doc.data();
    console.log('產品', product);

    // 要記得把product送出去，需對應edit.ejs使用的名稱
    res.locals.product = product;
    // 把categoryList匯出，讓模板(edit.ejs)可以用
    res.locals.categoryList = categoryList;
    res.locals.pid = pid;
    

    // 渲染 product/edit.ejs
    res.render('product/edit');
});

module.exports = router;

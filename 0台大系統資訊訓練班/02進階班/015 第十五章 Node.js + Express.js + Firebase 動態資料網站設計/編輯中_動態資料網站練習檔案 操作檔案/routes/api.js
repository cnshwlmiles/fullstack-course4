const express = require('express');
const moment = require('moment');
const axios = require('axios');
const router = express.Router();
// const admin = require('../firebase');
//引用db 
const db = require('../db');
// 15.10 使共用資料獨立 透過find函數在陣列中尋找符合條件的資料
const categoryList = require('../model/category-list')

// 登入
router.post('/login', function (req, res, next) {
    console.log('[準備登入]');
    console.log('[前端送來的資料]', req.body);
    // Create session cookie
    // https://firebase.google.com/docs/auth/admin/manage-cookies#create_session_cookie
    // 取得前端傳來的使用者 idToken
    const idToken = req.body.idToken;
    console.log('[前端傳來的idToken]', idToken);
    // 有效期間
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    // admin
    //     .auth()
    //     .createSessionCookie(idToken, { expiresIn })
    //     .then(sessionCookie => {
    //         // 成功產生sessionCookie
    //         console.log('sessionCookie', sessionCookie);
    //         const cookieName = "ntu-cookie";
    //         // 設定cookie
    //         const options = {
    //             maxAge: expiresIn,
    //             httpOnly: true
    //         };
    //         // 把cookie設定給瀏覽器
    //         res.cookie(cookieName, sessionCookie, options);
    //         // 回傳成功
    //         res.status(200).json({ 'msg': 'login!' });
    //     })
    //     .catch(err => {
    //         console.log(err);
    //         // 回傳前端錯誤訊息
    //         res.status(500).json(err);
    //     });
});

// 登出
router.post('/logout', function (req, res, next) {
    // Sign Out
    // https://firebase.google.com/docs/auth/admin/manage-cookies#sign_out
    const cookieName = "ntu-cookie";
    // 從cookies中取得指定cookieName的值
    const sessionCookie = req.cookies[cookieName] || "";
    // 清除cookie
    res.clearCookie(cookieName);
    admin.auth().verifySessionCookie(sessionCookie)
        .then(user => {
            // 與Firebase Auth通知此人的登入狀態與sessionCookie已失效
            admin.auth().revokeRefreshTokens(user.sub);
            // 回應前端成功
            res.status(200).json({ msg: 'Logout' })
        })
        .catch(err => {
            // 回應前端成功
            res.status(200).json({ msg: 'Logout' })
        });
});

// 取得商品分類清單
router.get('/category-list', function (req, res, next) {
    // 共用資料在model categorylist底下
    // 回傳資料給前端
    res.status(200).json({
        categoryList: categoryList
        // 前面是物件名稱, 名稱和常數一樣，可以只寫categoryList
    })
});

// 新增商品
// 15.8 將新商品的資料新增至Firebase Cloud Firestore雲端資料庫內
router.post('/product/create', function (req, res, next) {
    console.log('[準備新增商品]');
    console.log('[前端送來的資料]', req.body);
    // Add a document
    // 閱讀文件： https://firebase.google.com/docs/firestore/manage-data/add-data#add_a_document
    
    // 後端(收到)的資料固定用req.body
    // 前端是 res.data
    const product = req.body;

    // Add a new document with a generated id.
    // const res = await db.collection('cities').add({
    // name: 'Tokyo',
    // country: 'Japan'
    // });  
    // console.log('Added document with ID: ', res.id);index.js
    db
        // 指定要放進哪個collection裡面，firebase物件名稱
        .collection("productList")
        // 將資料送到Firebase伺服器機房，如果成功就會收到response
        .add(product)
        .then(function (response) {
            // 回應前端成功，用res.status(200)
            res.status(200).json({
                // 優化msg，加上產品名稱，待會就可以引導回到新增產品的頁面
                msg: `${product.name}-創建成功`,
                data: product,
                // response: response 的簡寫
                response
            });
        })
        .catch(function (error) {
            // 回應前端失敗
            res.status(500).json(error);
        });
});

// 更新商品
// 15.13 將更新後的商品資料傳遞給後端API並更新資料(後端)
router.put('/product/:pid', function (req, res, next) {
    console.log('[準備更新商品]');
    console.log('[前端送來的資料]', req.body);
    console.log('[pid]', req.params.pid);
    const pid = req.params.pid;
    const product = req.body;
    // 透過db.doc更新(update)
    db
        .doc(`productList/${pid}`)
        .update(product)
        .then(response => {
            res.status(200).json({
                msg: "產品更新成功",
                data: product,
                response
            });
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

// 刪除商品
router.delete('/product/:pid', function (req, res, next) {
    console.log('[準備刪除商品]');
    console.log('[pid]', req.params.pid);
    const pid = req.params.pid;
    db
        .doc(`productList/${pid}`)
        .delete()
        .then(response => {
            res.status(200).json({
                msg: "產品移除成功",
                data: pid,
                response
            });
        })
        .catch(err => {
            res.status(500).json(err);
        });
});

module.exports = router;

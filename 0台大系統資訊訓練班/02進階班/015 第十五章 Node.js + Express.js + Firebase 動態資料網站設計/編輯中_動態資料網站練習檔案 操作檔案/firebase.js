// 初始化firebase
// FIREBASE NODE.JS初始化文件
// https://firebase.google.com/docs/admin/setup

// TODO: 初始化FIREBASE

// 從Firebase Admin SDK複製下來的程式碼
// 引用firebase-admin模組
const admin = require("firebase-admin");
// 引用金鑰
const serviceAccount = require("./key.json");
// 驗證金鑰(google做)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// 輸出 admin 供其他檔案使用 (交給db.js使用)
module.exports = admin;
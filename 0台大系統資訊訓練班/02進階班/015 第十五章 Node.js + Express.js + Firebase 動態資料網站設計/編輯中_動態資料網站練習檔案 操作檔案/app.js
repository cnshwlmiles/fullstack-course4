// 這些檔案是伺服器端的邏輯的JS，不是拿來做特效的KS

// 下面這些是一定要寫的
// require 是引用 直接寫名字的話，預設路徑是 node_modules
// 引用 http-errors, express  etc. 的模組
// 實際上在安裝express的時候，也會在?package.json 裡面會引用各種模組
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// 取得路由資源 (使用相對路徑)，常數代表一個JS檔案
// 引用./routes/index.js作為indexRouter
const indexRouter = require('./routes/index');
// 引用./routes/product.js作為productRouter
const productRouter = require('./routes/product');
// 引用./routes/api.js作為apiRouter
const apiRouter = require('./routes/api');

// 設定應用程式 (不用改)
const app = express();

// 定義視圖引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 設定前端資源路由 / => 可指向public資料夾內的資源
app.use(express.static(path.join(__dirname, 'public')));
// 設定前端資源路由 /assets/ => 可指向assets資料夾內的資源
app.use('/assets', express.static(path.join(__dirname, 'assets')));
// 設定前端資源路由 /node_modules/ => node_modules
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// 指派indexRouter負責處理 / 路由的邏輯 (網址由什麼檔案負責)
app.use('/', indexRouter);
// 指派productRouter負責處理 /product 路由的邏輯
app.use('/product', productRouter);
// 指派apiRouter負責處理 /api 路由的邏輯
app.use('/api', apiRouter);
// 15.4 建立一個新的頁面

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

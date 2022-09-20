// 15.5 透過前端的JavaScript程式向後端的API發送請求取得資源
// $: 如果是透過Jquery選擇器選到的資料，通常會在前面加上$
const $select = $("#productCategory");
// 15.5 透過前端的JavaScript程式向後端的API發送請求取得資源
// TODO: 取得商品分類清單 (取得後端的資料，並呈現在前端的商品選擇標籤上)
// PATH: "/api/category-list"
// 程序1. 前端發送請求
// 程序2. 後端 api.js 回傳資料
axios.get('/api/category-list')
    .then(res => {
        // console.log('成功取得', res)
        const categoryList = res.data.categoryList;
        // console.log('分類清單', categoryList)
        categoryList.forEach(category => {
            // console.log(category)
            // 產生一個option 標籤
            const opt = `<option value='${category.id}'>${category.title}</option>`;
            $select.append(opt)
        });
    })
    .catch(err => {
        console.log('錯誤', err)
    });

// 15.6 將前端表單產生的新產品資料透過axios post到後端
$('#createProductForm').submit(function (event) {
    // 預防重新整理
    event.preventDefault();
    // 建立要傳給後端的資料
    const product = {
        name: $('#productName').val(),
        // 取整數
        price: parseInt($('#productPrice').val()),
        image: $('#productImage').val(),
        category: $('#productCategory').val(),
        // 建立時間
        createdAt: new Date().getTime()
    };
    console.log('[新增產品]', product);
    
    // 資料處理就是後端的事情
    // 流程：1. 資料傳給後端後
    // 2. 後端跟前端說資料上傳成功，引導到其它頁面
    // TODO: 創建商品API
    // PATH: "/api/product/create",
    // METHOD: "POST",
    // DATA: product 新產品資料(物件)
    
    // 前端跟後端溝通，網址打滿，此為api.js下面的路由
    // 將前端的物件(product)送給後端
    axios.post('/api/product/create', product)
    .then(res => {
        console.log('成功建立產品', res);
        // 跳出警示(商品名稱+創建成功)
        alert(res.data.msg);
        // 強制引導使用者回到首頁/ (首頁)
        window.location = '/';
    })
    .catch(err =>{
        console.log('錯誤', err);
    })

});
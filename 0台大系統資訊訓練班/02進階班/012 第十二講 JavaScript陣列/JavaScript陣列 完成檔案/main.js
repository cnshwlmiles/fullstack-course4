const nums = [10, 20, 30, 40, 50, 99];
// 陣列[索引]
nums[1] = 100;
nums[2] = 200;
// 陣列.push(要新增到最後的資料)
nums.push(900);
nums.push(1000);
// 在索引位置0的地方移除1筆資料
nums.splice(0, 1);
nums.splice(5, 1);

console.log(nums);

let sum = 0;

nums.forEach((n, i) => {
    console.log(`第${i + 1}個數字是${n}`);
    sum += n;
});

console.log("nums的總和是", sum);
console.log("nums裡有幾筆資料", nums.length);


// console.log(nums[0]);
// console.log(nums[1]);
// console.log(nums[2]);
// console.log(nums[3]);
// console.log(nums[4]);
// console.log(nums[5]);

const productList = [
    { name: "Product A", price: 150 },
    { name: "Product B", price: 220 },
    { name: "Product C", price: 300 }
];

const list = document.getElementById("list");

productList.forEach(product => {
    const listItem = `<li>產品名稱:${product.name} 價格${product.price}</li>`;
    list.innerHTML += listItem;
});

const countrySelect = document.getElementById("countrySelect");

countrySelect.addEventListener("change", function () {
    alert(countrySelect.value);
});

axios.get("https://restcountries.eu/rest/v2/all")
    .then(res => {
        res.data.forEach(country => {
            console.log(country);
            const opt = `<option value="${country.alpha2Code}">${country.name}</option>`;
            countrySelect.innerHTML += opt;
        })
    })
    .catch(err => {
        console.log("取得資料失敗", err);
    })
// 物件

const user1 = {
    // 屬性: 值(各種型別)
    name: "Andy",
    age: 28,
    phone: "0912-345-678",
    // 是否為管理者
    isAdmin: false,
    address: {
        city: "台北市",
        district: "大安區"
        },
    introduce: function(){
        console.log(`Hello,我叫做${this.name},今年${this.age}歲`)
    }
};

// 裡面也可以放函數
console.log(user1.introduce());

// 改名
// user1.name = "Eric";
user1["name"] = "Tony";

// 加歲數
// user1.age = user1.age + 1;
user1.age += 1;
user1.address.city = "台中市";

// 會新增一個email欄位
user1.email = "tony@gmail.com"

// 顯示'user1'再顯示裡面內容
console.log("user1", user1);
console.log(user1.address.city);


// 叫出值的方式 

// 物件.屬性 => 屬性的值
// console.log(user1.name);
// console.log(user1.age);
// console.log(user1.phone);

// 物件['屬性'] => 屬性的值
// console.log(user1['name']);

// const x = "name";
// 取得user1的x的值
// console.log(user1.x);
// 取得user1的"name"的值
// console.log(user1[x]);

// delete 物件.要刪除的屬性
const user2 = {
    "name": "Abby",
    "age": 20
  };
  delete user2.age
  console.log(user2);
  

//   陣列
//   Arrays

const luckyNums = [1, 3, 9, 12, 22, 32];
console.log(luckyNums);

// 陣列.push()
// 在陣列最後新增一筆資料
// 陣列.pop()
// 在陣列最後刪除一筆資料

// 使用迴圈遍歷陣列
const lotteryNums = [1,5,8,10,12,30];
for (let i = 0; i<lotteryNums.length; i++){
    console.log(`第${i+1}個號碼是${lotteryNums[i]}`);
  }

// 使用更直觀的.forEach()改寫
lotteryNums.forEach(function(number, index){
console.log(`第${index+1}個號碼是${number}`);
});

// .map()
// 遍歷陣列的資料並同時產生一個新陣列
// 使用時一定要有return
const arr6 = [2,4,6,8,10,12];
const arr7 = arr6.map(function(num){
  return num * num;
})
console.log(arr6); // [2,4,6,8,10,12]
console.log(arr7); // [4, 16, 36, 64, 100, 144]

// .filter()
// 過濾陣列裡的特定資料並同時產生一個新陣列
// 使用時一定要有return
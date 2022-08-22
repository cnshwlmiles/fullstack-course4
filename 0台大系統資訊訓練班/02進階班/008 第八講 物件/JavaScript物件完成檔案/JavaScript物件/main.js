const user1 = {
    // 屬性: 值(各種型別)
    name: "Andy",
    age: 28,
    phone: "0912-345-678",
    isAdmin: false,
    address: {
        city: "台北市",
        district: "大安區"
    }
};

// user1.name = "Eric";
user1["name"] = "Tony";
// user1.age = user1.age + 1;
user1.age += 1;
user1.address.city = "台中市";
user1.email = "tony@gmail.com"

console.log("user1", user1);
console.log(user1.address.city);
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
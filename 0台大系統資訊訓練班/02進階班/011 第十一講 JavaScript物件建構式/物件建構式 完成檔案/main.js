const user1 = {
    name: "Eric",
    age: 40,
    intro: function (greeting) {
        // this 在物件函數內代表此物件本身(user1)
        console.log(`${greeting}, 我是${this.name}今年${this.age}歲`);
    }
};

user1.intro('哈囉安安大家好')

// [物件建構式]是一種用來[產生]物件的函數

// 設計一個用來產生user物件的建構式
function User(name, age) {
    // 在建構式內的this,這個this將會代表此建構式所產生的物件
    this.name = name;
    this.age = age;
    this.level = 1;
    // 11.4 為函數的參數設定預設值
    this.intro = function (greeting = "Hi") {
        console.log(`${greeting},我是${this.name}今年${this.age}歲`)
    }
}

// 透過建構式產生一個獨立的物件
// new 建構式()
const user2 = new User("Tony", 20);
const user3 = new User("Josh", 45);
const user4 = new User("Amy", 26);
console.log("user2", user2);
console.log("user3", user3);
user2.intro();
user3.intro("哈囉")
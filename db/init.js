const { Sequelize, Model, DataTypes } = require('sequelize');
const uuid = require('uuidv4');


var sequelize = new Sequelize('wirehouse', 'root', 'Nirmalya18147', {
    host: 'localhost',
    dialect: 'mysql',
    port: 3310,

    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});
// users table (1: transaction, 2: inventory, 3: dashboard, 10: admin)
var User = sequelize.define('users', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    phoneno: { type: Sequelize.STRING(20) },
    otherphoneno: { type: Sequelize.STRING(20) },
    email: { type: Sequelize.STRING },
    isadmin: { type: Sequelize.INTEGER },
    active: { type: Sequelize.INTEGER },
    deleted: { type: Sequelize.INTEGER },
    name: { type: Sequelize.STRING },
    pincode: { type: Sequelize.STRING(10) },
    address: { type: Sequelize.STRING(1024) },
    password: { type: Sequelize.STRING.BINARY }
}, {
    freezeTableName: true
});
// session table
var Session = sequelize.define('session', {
    id: {
        type: Sequelize.STRING.BINARY,
        primaryKey: true
    },
    uid: { type: Sequelize.BIGINT },
    ip: { type: Sequelize.STRING },
    active: { type: Sequelize.INTEGER }
}, {
    freezeTableName: true
});
// product table
var Item = sequelize.define('items', {
    itemcode: {
        type: Sequelize.STRING(512),
        primaryKey: true
    },
    itemname: { type: Sequelize.STRING },
    itemtypeid: { type: Sequelize.BIGINT },
    itemtypename: { type: Sequelize.STRING(128) },
    manufacturer: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING(1024) },
    qty: { type: Sequelize.BIGINT },
    price: { type: Sequelize.DECIMAL(10, 2) },
    totalsold: { type: Sequelize.BIGINT },
    totalearned: { type: Sequelize.DECIMAL(10, 2) }
}, {
    freezeTableName: true
});
// transaction table
var Transaction = sequelize.define('transaction', {
    id: {
        type: Sequelize.STRING(14),
        primaryKey: true
    },
    totalItem: { type: Sequelize.INTEGER },
    totalQTY: { type: Sequelize.INTEGER },
    vat: { type: Sequelize.DECIMAL(10, 2) },
    discount: { type: Sequelize.DECIMAL(10, 2) },
    discountValue: { type: Sequelize.DECIMAL(10, 2) },
    totalAmount: { type: Sequelize.DECIMAL(10, 2) },
    totalTendered: { type: Sequelize.DECIMAL(10, 2) },
    changeDue: { type: Sequelize.DECIMAL(10, 2) },
    creditAmount: { type: Sequelize.DECIMAL(10, 2) },
    paymentMode: { type: Sequelize.STRING(14) },
    addCredit: { type: Sequelize.INTEGER },
    customerID: { type: Sequelize.STRING(8) },
    customerName: { type: Sequelize.STRING(255) },
    customerPhone: { type: Sequelize.STRING(20) },
    customerEmail: { type: Sequelize.STRING(128) },
    userID: { type: Sequelize.BIGINT },
    userName: { type: Sequelize.STRING }
}, {
    freezeTableName: true
});
// transactionItem table
var TransactionItem = sequelize.define('transactionitem', {
    id: {
        allowNull: false,
        type: Sequelize.STRING(32),
        primaryKey: true
    },
    transactionId: { type: Sequelize.STRING(14) },
    itemcode: { type: Sequelize.STRING(512) },
    itemname: { type: Sequelize.STRING(255) },
    price: { type: Sequelize.DECIMAL(10, 2) },
    qty: { type: Sequelize.INTEGER },
    totalPrice: { type: Sequelize.DECIMAL(10, 2) },
    expiry: { type: Sequelize.DATEONLY }
}, {
    freezeTableName: true
});
// customer table
var Customer = sequelize.define('customer', {
    id: {
        type: Sequelize.STRING(8),
        primaryKey: true
    },
    name: { type: Sequelize.STRING },
    phone: { type: Sequelize.STRING(20) },
    email: { type: Sequelize.STRING(128) },
    credit: { type: Sequelize.DECIMAL(10, 2) }
}, {
    freezeTableName: true
});
// item update
var ItemUpdate = sequelize.define('itemupdate', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    itemcode: { type: Sequelize.STRING(512) },
    itemname: { type: Sequelize.STRING(255) },
    qty: { type: Sequelize.BIGINT },
    qtystock: { type: Sequelize.BIGINT },
    price: { type: Sequelize.DECIMAL(10, 2) },
    expiry: { type: Sequelize.DATEONLY },
    dealername: { type: Sequelize.STRING(255) },
    dealerphone: { type: Sequelize.STRING(20) },
    description: { type: Sequelize.STRING(1024) }
}, {
    freezeTableName: true
});
// Sale Data
var SaleData = sequelize.define('saledata', {
    days: {
        type: Sequelize.DATEONLY,
        primaryKey: true
    },
    itemsold: { type: Sequelize.BIGINT },
    itembought: { type: Sequelize.BIGINT },
    earning: { type: Sequelize.DECIMAL(10, 2) },
    spending: { type: Sequelize.DECIMAL(10, 2) }
}, {
    freezeTableName: true
});
// Item Type
var ItemType = sequelize.define('itemtype', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    itemtypename: { type: Sequelize.STRING(128) }
}, {
    freezeTableName: true
});
// Shop
var Shop = sequelize.define('shop', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    shopname: { type: Sequelize.STRING(512) },
    shopdetails: { type: Sequelize.STRING(1024) },
    shopaddress: { type: Sequelize.STRING(1024) },
    shopphoneno: { type: Sequelize.STRING(20) },
    shopotherphoneno: { type: Sequelize.STRING(20) },
    vatno: { type: Sequelize.STRING(512) },
    vat: { type: Sequelize.INTEGER },
    discount: { type: Sequelize.INTEGER }
}, {
    freezeTableName: true
});





module.exports = { sequelize, User, Session, Item, Transaction, TransactionItem, Customer, ItemUpdate, SaleData, ItemType, Shop };

console.log('*******db*******');
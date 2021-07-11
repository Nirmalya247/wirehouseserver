const { Sequelize, Model, DataTypes } = require('sequelize');

// dbname, username, password

var datafrom = 'shakil'; // shakil/shesh
var sequelize = new Sequelize('wirehouse', process.env.DB_USER || 'remote', process.env.DB_PASSWORD || (datafrom == 'shakil' ? 'ab@1234CD' : 'Med@130867_Ventory@Sql_Remote'), {
    host: process.env.DB_HOST || (datafrom == 'shakil' ? '157.245.105.80' : '139.59.39.133'),
    dialect: 'mysql',
    port: 3306,

    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    dialectOptions: {
        useUTC: false, // for reading from database
    },
    timezone: '+05:45'
});

// var sequelize = new Sequelize('wirehouse', 'root', 'Nirmalya18147', {
//     host: 'localhost',
//     dialect: 'mysql',
//     port: 3310,

//     pool: {
//         max: 5,
//         min: 0,
//         idle: 10000
//     }
// });





const ui = 'https://med-ventory-ui.herokuapp.com/';
// const ui = 'http://localhost:4200/';





// users table (1: sale, 2: inventory, 3: admin, 10: super admin)
var User = sequelize.define('users', {
    id: {
        type: Sequelize.STRING(20),
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
    salary: { type: Sequelize.DECIMAL(10, 2) },
    lastsalary: { type: Sequelize.DATEONLY },
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
    hsn: { type: Sequelize.STRING(45) },
    vat: { type: Sequelize.DECIMAL(10, 2) },
    discount: { type: Sequelize.DECIMAL(10, 2) },
    discountamount: { type: Sequelize.DECIMAL(10, 2) },
    manufacturer: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING(1024) },
    qty: { type: Sequelize.BIGINT },
    price: { type: Sequelize.DECIMAL(10, 2) },
    totalsold: { type: Sequelize.BIGINT },
    totalearned: { type: Sequelize.DECIMAL(10, 2) },
    lowlimit: { type: Sequelize.BIGINT }
}, {
    freezeTableName: true
});
// Sale table
var Sale = sequelize.define('sales', {
    id: {
        type: Sequelize.STRING(20),
        primaryKey: true
    },
    key: { type: Sequelize.STRING.BINARY },
    totalItem: { type: Sequelize.INTEGER },
    totalQTY: { type: Sequelize.INTEGER },
    totalPurchaseCost: { type: Sequelize.DECIMAL(10, 2) }, // total cost
    totalAmount: { type: Sequelize.DECIMAL(10, 2) },
    discount: { type: Sequelize.DECIMAL(10, 2) },
    discountamount: { type: Sequelize.DECIMAL(10, 2) },
    totalTaxable: { type: Sequelize.DECIMAL(10, 2) },
    vat: { type: Sequelize.DECIMAL(10, 2) },
    totalCost: { type: Sequelize.DECIMAL(10, 2) }, // total price
    totalTendered: { type: Sequelize.DECIMAL(10, 2) },
    changeDue: { type: Sequelize.DECIMAL(10, 2) },
    creditAmount: { type: Sequelize.DECIMAL(10, 2) },
    paymentMode: { type: Sequelize.STRING(40) },
    addCredit: { type: Sequelize.INTEGER },
    customerID: { type: Sequelize.STRING(8) },
    customerName: { type: Sequelize.STRING(255) },
    customerPhone: { type: Sequelize.STRING(20) },
    customerEmail: { type: Sequelize.STRING(128) },
    userID: { type: Sequelize.STRING(20) },
    userName: { type: Sequelize.STRING }
}, {
    freezeTableName: true
});
// saleItem table
var SaleItem = sequelize.define('salesitem', {
    id: {
        allowNull: false,
        type: Sequelize.STRING(32),
        primaryKey: true
    },
    saleId: { type: Sequelize.STRING(20) },
    stockid: { type: Sequelize.STRING(20) },
    itemcode: { type: Sequelize.STRING(512) },
    itemname: { type: Sequelize.STRING(255) },
    hsn: { type: Sequelize.STRING(45) },
    price: { type: Sequelize.DECIMAL(10, 2) },
    qty: { type: Sequelize.INTEGER },
    discount: { type: Sequelize.DECIMAL(10, 2) },
    discountamount: { type: Sequelize.DECIMAL(10, 2) },
    vat: { type: Sequelize.DECIMAL(10, 2) },
    totalPrice: { type: Sequelize.DECIMAL(10, 2) },
    mfg: { type: Sequelize.DATEONLY },
    expiry: { type: Sequelize.DATEONLY }
}, {
    freezeTableName: true
});
// customer table
var Customer = sequelize.define('customer', {
    id: {
        type: Sequelize.STRING(20),
        primaryKey: true
    },
    name: { type: Sequelize.STRING },
    phone: { type: Sequelize.STRING(20) },
    email: { type: Sequelize.STRING(128) },
    credit: { type: Sequelize.DECIMAL(10, 2) },
    creditlimit: { type: Sequelize.DECIMAL(10, 2) },
    qty: { type: Sequelize.INTEGER },
    amount: { type: Sequelize.DECIMAL(10, 2) },
    count: { type: Sequelize.INTEGER }
}, {
    freezeTableName: true
});
// purchase table
var Purchase = sequelize.define('purchase', {
    id: {
        type: Sequelize.STRING(20),
        primaryKey: true
    },
    billID: { type: Sequelize.STRING(40) },
    totalItem: { type: Sequelize.INTEGER },
    totalQTY: { type: Sequelize.INTEGER },
    totalAmount: { type: Sequelize.DECIMAL(10, 2) },
    totalTaxable: { type: Sequelize.DECIMAL(10, 2) },
    totalCost: { type: Sequelize.DECIMAL(10, 2) },
    totalTendered: { type: Sequelize.DECIMAL(10, 2) },
    changeDue: { type: Sequelize.DECIMAL(10, 2) },
    dueAmount: { type: Sequelize.DECIMAL(10, 2) },
    dueDate: { type: Sequelize.DATEONLY },
    paymentMode: { type: Sequelize.STRING(40) },
    addDue: { type: Sequelize.INTEGER },
    vendorID: { type: Sequelize.STRING(20) },
    vendorFName: { type: Sequelize.STRING(255) },
    vendorLName: { type: Sequelize.STRING(255) },
    vendorCompany: { type: Sequelize.STRING(255) },
    vendorPhone: { type: Sequelize.STRING(20) },
    vendorEmail: { type: Sequelize.STRING(128) },
    userID: { type: Sequelize.STRING(20) },
    userName: { type: Sequelize.STRING }
}, {
    freezeTableName: true
});
// item update
var ItemUpdate = sequelize.define('itemupdate', {
    id: {
        type: Sequelize.STRING(20),
        primaryKey: true
    },
    purchaseId: { type: Sequelize.STRING(20) },
    itemcode: { type: Sequelize.STRING(512) },
    itemname: { type: Sequelize.STRING(255) },
    qty: { type: Sequelize.BIGINT },
    qtystock: { type: Sequelize.BIGINT },
    price: { type: Sequelize.DECIMAL(10, 2) },
    discount: { type: Sequelize.DECIMAL(10, 2) },
    discountamount: { type: Sequelize.DECIMAL(10, 2) },
    vat: { type: Sequelize.DECIMAL(10, 2) },
    cost: { type: Sequelize.DECIMAL(10, 2) },
    totalcost: { type: Sequelize.DECIMAL(10, 2) },
    mfg: { type: Sequelize.DATEONLY },
    expiry: { type: Sequelize.DATEONLY },
    rack: { type: Sequelize.STRING(20) },
    vendorid: { type: Sequelize.STRING(20) },
    description: { type: Sequelize.STRING(1024) }
}, {
    freezeTableName: true
});
// return table
var Return = sequelize.define('return', {
    id: {
        type: Sequelize.STRING(20),
        primaryKey: true
    },
    totalItem: { type: Sequelize.INTEGER },
    totalQTY: { type: Sequelize.INTEGER },
    totalAmount: { type: Sequelize.DECIMAL(10, 2) },
    totalTendered: { type: Sequelize.DECIMAL(10, 2) },
    changeDue: { type: Sequelize.DECIMAL(10, 2) },
    dueAmount: { type: Sequelize.DECIMAL(10, 2) },
    dueDate: { type: Sequelize.DATEONLY },
    paymentMode: { type: Sequelize.STRING(40) },
    vendorID: { type: Sequelize.STRING(20) },
    vendorFName: { type: Sequelize.STRING(255) },
    vendorLName: { type: Sequelize.STRING(255) },
    vendorCompany: { type: Sequelize.STRING(255) },
    vendorPhone: { type: Sequelize.STRING(20) },
    vendorEmail: { type: Sequelize.STRING(128) },
    userID: { type: Sequelize.STRING(20) },
    userName: { type: Sequelize.STRING }
}, {
    freezeTableName: true
});
// return item
var ReturnItem = sequelize.define('returnitem', {
    id: {
        type: Sequelize.STRING(20),
        primaryKey: true
    },
    returnid: { type: Sequelize.STRING(20) },
    itemcode: { type: Sequelize.STRING(512) },
    itemname: { type: Sequelize.STRING(255) },
    batchno: { type: Sequelize.STRING(20) },
    qty: { type: Sequelize.BIGINT },
    price: { type: Sequelize.DECIMAL(10, 2) },
    discount: { type: Sequelize.DECIMAL(10, 2) },
    discountamount: { type: Sequelize.DECIMAL(10, 2) },
    totalcost: { type: Sequelize.DECIMAL(10, 2) },
    purchasedate: { type: Sequelize.DATEONLY },
    mfg: { type: Sequelize.DATEONLY },
    expiry: { type: Sequelize.DATEONLY },
    vendorid: { type: Sequelize.STRING(20) },
    reason: { type: Sequelize.STRING(1024) }
}, {
    freezeTableName: true
});
// other transactions
var Transaction = sequelize.define('transactions', {
    id: {
        type: Sequelize.STRING(20),
        primaryKey: true
    },
    type: { type: Sequelize.STRING(20) }, // asset, liability, income, expense, equity
    accounttype: { type: Sequelize.STRING(40) }, // main catagory of account
    account: { type: Sequelize.STRING(40) }, // account name
    duration: { type: Sequelize.STRING(20) }, // long term or short term
    amount: { type: Sequelize.DECIMAL(10, 2) },
    tendered: { type: Sequelize.DECIMAL(10, 2) },
    duedate: { type: Sequelize.DATEONLY },
    comment: { type: Sequelize.STRING(1024) }
}, {
    freezeTableName: true
});
// vendor table
var Vendor = sequelize.define('vendor', {
    id: {
        type: Sequelize.STRING(20),
        primaryKey: true
    },
    fname: { type: Sequelize.STRING },
    lname: { type: Sequelize.STRING },
    company: { type: Sequelize.STRING },
    phone: { type: Sequelize.STRING(20) },
    email: { type: Sequelize.STRING(128) },
    vatno: { type: Sequelize.STRING(512) },
    due: { type: Sequelize.DECIMAL(10, 2) }
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
        type: Sequelize.STRING(20),
        primaryKey: true
    },
    itemtypename: { type: Sequelize.STRING(128) }
}, {
    freezeTableName: true
});
// Shop
var Shop = sequelize.define('shop', {
    id: {
        type: Sequelize.STRING(20),
        primaryKey: true
    },
    shopname: { type: Sequelize.STRING(512) },
    shopdetails: { type: Sequelize.STRING(1024) },
    shopaddress: { type: Sequelize.STRING(1024) },
    shopphoneno: { type: Sequelize.STRING(20) },
    shopotherphoneno: { type: Sequelize.STRING(20) },
    smskey: { type: Sequelize.STRING(64) },
    shopwebsite: { type: Sequelize.STRING(100) },
    shopemail: { type: Sequelize.STRING(80) },
    shopemailpassword: { type: Sequelize.STRING(80) },
    hubspotkey: { type: Sequelize.STRING(80) },
    vatno: { type: Sequelize.STRING(512) },
    licenseno: { type: Sequelize.STRING(100) },
    vat: { type: Sequelize.DECIMAL(10, 2) },
    discount: { type: Sequelize.DECIMAL(10, 2) },
    discountamount: { type: Sequelize.DECIMAL(10, 2) },
    billfooter: { type: Sequelize.STRING(128) },
    billnote: { type: Sequelize.STRING(1024) }
}, {
    freezeTableName: true
});
// Rack
var Rack = sequelize.define('rack', {
    id: {
        type: Sequelize.STRING(20),
        primaryKey: true
    },
    label: { type: Sequelize.STRING(100) }
}, {
    freezeTableName: true
});
// Message
var Message = sequelize.define('messages', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true
    },
    for: { type: Sequelize.STRING(40) },
    type: { type: Sequelize.STRING(40) },
    label: { type: Sequelize.STRING(40) },
    message: { type: Sequelize.TEXT }
}, {
    freezeTableName: true
});
/*
// TransactionType
var Rack = sequelize.define('transactiontype', {
    id: {
        type: Sequelize.BIGINT(11),
        autoIncrement: true,
        primaryKey: true
    },
    label: { type: Sequelize.STRING(100) }
}, {
    freezeTableName: true
});
*/
// Counter
var Counter = sequelize.define('counter', {
    id: {
        type: Sequelize.STRING(40),
        primaryKey: true
    },
    val: { type: Sequelize.BIGINT(20) }
}, {
    freezeTableName: true
});


ItemUpdate.belongsTo(Vendor, { as: 'vendors', foreignKey: 'vendorid', targetKey: 'id' });
Vendor.hasMany(ItemUpdate, { as: 'itemUpdates', foreignKey: 'vendorid', targetKey: 'id' });

SaleItem.belongsTo(Item, { as: 'item', foreignKey: 'itemcode', targetKey: 'itemcode' });
Item.hasMany(SaleItem, { as: 'saleItems', foreignKey: 'itemcode', targetKey: 'itemcode' });

Purchase.belongsTo(Vendor, { as: 'vendors', foreignKey: 'vendorID', targetKey: 'id' });
Vendor.hasMany(Purchase, { as: 'purchases', foreignKey: 'vendorID', targetKey: 'id' });

Return.belongsTo(Vendor, { as: 'vendors', foreignKey: 'vendorID', targetKey: 'id' });
Vendor.hasMany(Return, { as: 'returns', foreignKey: 'vendorID', targetKey: 'id' });

module.exports = {
    sequelize,
    User,
    Session,
    Item,
    Sale,
    SaleItem,
    Customer,
    Purchase,
    ItemUpdate,
    Return,
    ReturnItem,
    Transaction,
    Vendor,
    SaleData,
    ItemType,
    Shop,
    Rack,
    Message,
    Counter,
    ui
};

console.log('*******db*******');
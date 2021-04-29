const { Sequelize, Model, DataTypes } = require('sequelize');


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
    phoneno: { type: Sequelize.BIGINT },
    email: { type: Sequelize.STRING },
    isadmin: { type: Sequelize.INTEGER },
    name: { type: Sequelize.STRING },
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
    manufacturer: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING(1024) },
    qty: { type: Sequelize.BIGINT },
    price: { type: Sequelize.DECIMAL(10, 2) },
    totalsold: { type: Sequelize.BIGINT },
    totalearned: { type: Sequelize.DECIMAL(10, 2) }
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
    phone: { type: Sequelize.STRING(12) },
    email: { type: Sequelize.STRING(128) },
    credit: { type: Sequelize.DECIMAL(10, 2) }
}, {
    freezeTableName: true
});





module.exports = { sequelize, User, Session, Item, Customer };

console.log('*******db*******');
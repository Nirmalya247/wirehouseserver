const { Sequelize, Model, DataTypes, Op } = require('sequelize');
const uuid = require('uuidv4');


var sequelize = new Sequelize('test', 'root', 'Nirmalya18147', {
    host: 'localhost',
    dialect: 'mysql',
    port: 3310,

    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});


var Student = sequelize.define('student', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    phoneno: { type: Sequelize.BIGINT },
    email: { type: Sequelize.STRING },
    name: { type: Sequelize.STRING },
}, {
    freezeTableName: true
});


sequelize.sync({ force: false }).then(function () {
    console.log('database connected');
    findAndUp(res => {
        console.log(res);
        res[1].name = 'rames4';
        res[1].save();
        res[2].name = 'rames5';
        res[2].save();
    });
});

function create(callback) {
    Student.create({
        phoneno: 1234567890,
        email: 'nr@gm.com',
        name: 'nir gayen'
    }).then(callback);
}

function findAndUp(callback) {
    Student.findAll({
        where: { id: { [Op.gt]: 2 } }
    }).then(callback);
}
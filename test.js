const { Sequelize, Model, DataTypes, Op } = require('sequelize');


var sequelize = new Sequelize('test_ng', 'remote', 'ab@1234CD', {
    host: '157.245.105.80',
    dialect: 'mysql',
    port: 3306,
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
    dept: { type: Sequelize.STRING }
}, {
    freezeTableName: true
});

var Dept = sequelize.define('dept', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    name: { type: Sequelize.STRING }
}, {
    freezeTableName: true
});


Student.belongsTo(Dept, {as: 'depts', foreignKey: 'dept', targetKey: 'id'});
Dept.hasMany(Student, {as: 'students', foreignKey: 'dept', targetKey: 'id'});


sequelize.sync({ force: false }).then(function () {
    console.log('database connected');
    Student.findAll({
        include: [{ model: Dept, as: 'depts' }]
      }).then(data => {
          console.log(data[0].dataValues);
      });
    /*
    findAndUp(res => {
        console.log(res);
        res[1].name = 'rames4';
        res[1].save();
        res[2].name = 'rames5';
        res[2].save();
    });
    */
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
const { Sequelize, Model, DataTypes, Op } = require('sequelize');
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.all('/test', test);
http.createServer(app).listen(4220);

console.log('*******web*******');


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


sequelize.sync({ force: false }).then(function () {
    console.log('database connected');
});

function test(req, res) {
    Student.findAll({
        where: { id: { [Op.gt]: 2 } }
    }).then(data => {
        res.send(data);
    });
}
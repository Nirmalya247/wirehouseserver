const mdb = require('../db/init');
const user = require('./user');
const { Op } = require('sequelize');

function add(req, res) {
    console.log(req.body);
    res.send({msg: 'got it'});
}

module.exports = { add }
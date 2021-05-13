const mdb = require('../db/init');
const user = require('./user');
const { Op } = require('sequelize');

// get customer data
function get(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var wh = { };
            var v = [];
            if (req.body.id && req.body.id != '') {
                v.push({ id: req.body.id });
            }
            if (req.body.phone && req.body.phone != '') {
                v.push({ phone: req.body.phone });
            }
            if (req.body.email && req.body.email != '') {
                v.push({ email: req.body.email });
            }
            wh['where'] = { [Op.or]: v };
            mdb.Salesman.findOne(wh).then(function(data) {
                console.log(data);
                if (data) {
                    data.dataValues['found'] = true;
                    data.dataValues['err'] = false;
                    console.log(data);
                    res.send(data);
                } else res.send({ err: false, found: false });
            }).catch((err) => {
                console.log(err);
                res.send({ err: true, found: false });
            });
        } else res.send({ err: true, found: false });
    }, 2);
}

function add(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var dat = req.body;
            dat['id'] = user.makeidSmall(8);
            mdb.Salesman.create(dat).then(function(data) {
                if (data) {
                    data['msg'] = 'salesman added';
                    data['err'] = false;
                    res.send(data);
                } else res.send({ msg: 'some error', err: true, id: '' });
                console.log(data);
            }).catch((err) => {
                console.log(err);
                res.send({ msg: 'some error', err: true, id: '' });
            });
        } else res.send({ msg: 'some error', err: true, id: '' });
    }, 2);
}

function update(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var dat = req.body;
            var id = dat.id;
            delete dat.id;
            mdb.Salesman.update(dat, { where: { id: id } }).then(function(data) {
                if (data) {
                    res.send({ msg: 'Salesman updated', err: false });
                } else res.send({ msg: 'some error', err: true, id: '' });
                console.log(data);
            }).catch((err) => {
                console.log(err);
                res.send({ msg: 'some error', err: true });
            });
        } else res.send({ msg: 'some error', err: true });
    }, 2);
}

module.exports = { get, add, update }
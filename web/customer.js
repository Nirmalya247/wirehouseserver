const mdb = require('../db/init');
const user = require('./user');
const { Op } = require('sequelize');

// get customer data
function get(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var wh = {};
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
            mdb.Customer.findOne(wh).then(function (data) {
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
    }, 1);
}

function add(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var dat = req.body;
            dat['id'] = user.makeidSmall(8);
            mdb.Customer.create(dat).then(function (data) {
                if (data) {
                    data['msg'] = 'customer added';
                    data['err'] = false;
                    res.send(data);
                } else res.send({ msg: 'some error', err: true, id: '' });
                console.log(data);
            }).catch((err) => {
                console.log(err);
                res.send({ msg: 'some error', err: true, id: '' });
            });
        } else res.send({ msg: 'some error', err: true, id: '' });
    }, 1);
}

function update(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var dat = req.body;
            var id = dat.id;
            delete dat.id;
            mdb.Customer.update(dat, { where: { id: id } }).then(function (data) {
                if (data) {
                    res.send({ msg: 'customer updated', err: false });
                } else res.send({ msg: 'some error', err: true, id: '' });
                console.log(data);
            }).catch((err) => {
                console.log(err);
                res.send({ msg: 'some error', err: true });
            });
        } else res.send({ msg: 'some error', err: true });
    }, 1);
}

function deleteCustomer(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var dataCustomer = req.body;
            var id = dataCustomer.id;
            console.log(id);
            mdb.Customer.destroy({ where: { id: id } }).then((data) => {
                res.send({ msg: 'customer deleted', err: false });
            }).catch(err => {
                res.send({ msg: 'some error', err: true });
            });
        } else {
            res.send({ msg: 'not permitted', err: true });
        }
    }, 2);
}

// get customer info
function customerInfo(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            mdb.Customer.count().then(customerC => {
                var today = new Date();
                today = new Date(today.setMonth(today.getMonth() - 1));
                var dd = today.getDate();
                var mm = today.getMonth() + 1;
                var yyyy = today.getFullYear();
                if (dd < 10) dd = '0' + dd;
                if (mm < 10) mm = '0' + mm;
                today = yyyy + '-' + mm + '-' + dd;
                mdb.Customer.count({
                    where: {
                        updatedAt: { [Op.gte]: today },
                        count: { [Op.gte]: 10 }
                    }
                }).then(activeC => {
                    res.send({ all: customerC, active: activeC, msg: 'customer updated', err: false });
                }).catch((err) => {
                    console.log(err);
                    res.send({ msg: 'some error', err: true });
                });
            }).catch((err) => {
                console.log(err);
                res.send({ msg: 'some error', err: true });
            });
        } else res.send({ msg: 'some error', err: true });
    }, 2);
}

// get customer
function getCustomer(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var page = req.body.page;
            var limit = req.body.limit;
            var order = req.body.order;
            var orderby = req.body.orderby;
            var searchText = req.body.searchText;
            console.log('###########', req.body);
        
            var today = new Date();
            today = new Date(today.setMonth(today.getMonth() + 12));
            var dd = today.getDate();
            var mm = today.getMonth() + 1;
            var yyyy = today.getFullYear();
            if (dd < 10) dd = '0' + dd;
            if (mm < 10) mm = '0' + mm;
            today = yyyy + '-' + mm + '-' + dd;
        
            var wh = {
                offset: (parseInt(page) - 1) * parseInt(limit),
                limit: parseInt(limit),
                order: [[orderby, order]]
            };
            wh['where'] = { };
            if (searchText && searchText != '') {
                wh['where'] = { [Op.or]: [
                    {id: { [Op.like]: `%${searchText}%` } },
                    {name: { [Op.like]: `%${searchText}%` } },
                    {phone: { [Op.like]: `%${searchText}%` } },
                    {email: { [Op.like]: `%${searchText}%` } }
                ] }
            }
            if (orderby == 'active') {
                wh['where']['count'] = { [Op.gte]: 10 };
                wh['where']['updatedAt'] = { [Op.gte]: today };
                wh['order'] = [['count', order]];
            }
            console.log('@@@@@@@@@@@', wh);
            mdb.Customer.findAll(wh).then(data => {
                res.send(data);
            });
        } else res.send([ ]);
    }, 2);
}

// get customer count
function getCustomerCount(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var orderby = req.body.orderby;
            var searchText = req.body.searchText;
        
            var today = new Date();
            today = new Date(today.setMonth(today.getMonth() + 12));
            var dd = today.getDate();
            var mm = today.getMonth() + 1;
            var yyyy = today.getFullYear();
            if (dd < 10) dd = '0' + dd;
            if (mm < 10) mm = '0' + mm;
            today = yyyy + '-' + mm + '-' + dd;
        
            var wh = { };
            wh['where'] = { };
            if (searchText && searchText != '') {
                wh['where'] = { [Op.or]: [
                    {id: { [Op.like]: `%${searchText}%` } },
                    {name: { [Op.like]: `%${searchText}%` } },
                    {phone: { [Op.like]: `%${searchText}%` } },
                    {email: { [Op.like]: `%${searchText}%` } }
                ] }
            }
            if (orderby == 'active') {
                wh['where']['count'] = { [Op.gte]: 10 };
                wh['where']['updatedAt'] = { [Op.gte]: today };
            }
            mdb.Customer.count(wh).then(data => {
                console.log('###########', data);
                if (data) res.send(data.toString());
                else res.send('0');
            }).catch((err) => {
                console.log(err);
                res.send('0');
            });
        } else res.send('0');
    }, 2);
}

module.exports = { get, add, update, deleteCustomer, customerInfo, getCustomer, getCustomerCount }
const mdb = require('../db/init');
const user = require('./user');
const { Op } = require('sequelize');
const idgen = require('../db/idgen');

// get vendor data
function get(req, res) {
    user.check(req, function(authData) {
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
            wh['where'] = {
                [Op.or]: v
            };
            mdb.Vendor.findOne(wh).then(function(data) {
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
    user.check(req, function(authData) {
        if (authData) {
            var dat = req.body;
            idgen.getID(idgen.tableID.vendor, 'num', 1, false, id => {
                dat['id'] = id;
                mdb.Vendor.create(dat).then(function(data) {
                    if (data) {
                        data['msg'] = 'vendor added';
                        data['err'] = false;
                        res.send(data);
                    } else res.send({ msg: 'some error', err: true, id: '' });
                    console.log(data);
                }).catch((err) => {
                    console.log(err);
                    res.send({ msg: 'some error', err: true, id: '' });
                });
            });
        } else res.send({ msg: 'some error', err: true, id: '' });
    }, 2);
}

function update(req, res) {
    user.check(req, function(authData) {
        if (authData) {
            var dat = req.body;
            var id = dat.id;
            delete dat.id;
            mdb.Vendor.update(dat, { where: { id: id } }).then(function(data) {
                if (data) {
                    res.send({ msg: 'Vendor updated', err: false });
                } else res.send({ msg: 'some error', err: true, id: '' });
                console.log(data);
            }).catch((err) => {
                console.log(err);
                res.send({ msg: 'some error', err: true });
            });
        } else res.send({ msg: 'some error', err: true });
    }, 2);
}

function deleteVendor(req, res) {
    user.check(req, function(dataAuth) {
        if (dataAuth) {
            var dataVendor = req.body;
            var id = dataVendor.id;
            console.log(id);
            mdb.Vendor.destroy({ where: { id: id } }).then((data) => {
                res.send({ msg: 'vendor deleted', err: false });
            }).catch(err => {
                res.send({ msg: 'some error', err: true });
            });
        } else {
            res.send({ msg: 'not permitted', err: true });
        }
    }, 2);
}

// get vendor
function getVendor(req, res) {
    user.check(req, function(dataAuth) {
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
                order: [
                    [orderby, order]
                ]
            };
            wh['where'] = {};
            if (searchText && searchText != '') {
                wh['where'] = {
                    [Op.or]: [{
                            id: {
                                [Op.like]: `%${searchText}%`
                            }
                        },
                        {
                            fname: {
                                [Op.like]: `%${searchText}%`
                            }
                        },
                        {
                            lname: {
                                [Op.like]: `%${searchText}%`
                            }
                        },
                        {
                            phone: {
                                [Op.like]: `%${searchText}%`
                            }
                        },
                        {
                            email: {
                                [Op.like]: `%${searchText}%`
                            }
                        }
                    ]
                }
            }
            console.log('@@@@@@@@@@@', wh);
            mdb.Vendor.findAll(wh).then(data => {
                res.send(data);
            });
        } else res.send([]);
    }, 2);
}

// get vendor count
function getVendorCount(req, res) {
    user.check(req, function(dataAuth) {
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

            var wh = {};
            wh['where'] = {};
            if (searchText && searchText != '') {
                wh['where'] = {
                    [Op.or]: [{
                            id: {
                                [Op.like]: `%${searchText}%`
                            }
                        },
                        {
                            fname: {
                                [Op.like]: `%${searchText}%`
                            }
                        },
                        {
                            lname: {
                                [Op.like]: `%${searchText}%`
                            }
                        },
                        {
                            phone: {
                                [Op.like]: `%${searchText}%`
                            }
                        },
                        {
                            email: {
                                [Op.like]: `%${searchText}%`
                            }
                        }
                    ]
                }
            }
            mdb.Vendor.count(wh).then(data => {
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

module.exports = {get, add, update, deleteVendor, getVendor, getVendorCount }
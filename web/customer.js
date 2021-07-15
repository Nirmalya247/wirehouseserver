const mdb = require('../db/init');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');
const https = require('https');
const idgen = require('../db/idgen');
const messageLib = require('./message');

// get customer data
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
            mdb.Customer.findOne(wh).then(function(data) {
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
    user.check(req, function(authData) {
        if (authData) {
            var dat = req.body;
            idgen.getID(idgen.tableID.customer, 'num', 1, false, customerID => {
                dat['id'] = customerID;
                mdb.Customer.create(dat).then(function(data) {
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
            });
        } else res.send({ msg: 'some error', err: true, id: '' });
    }, 1);
}

function update(req, res) {
    user.check(req, function(authData) {
        if (authData) {
            var dat = req.body;
            var id = dat.id;
            delete dat.id;
            mdb.Customer.update(dat, { where: { id: id } }).then(function(data) {
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
    user.check(req, function(dataAuth) {
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
    user.check(req, function(authData) {
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
                        updatedAt: {
                            [Op.gte]: today
                        },
                        count: {
                            [Op.gte]: 10
                        }
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
                            name: {
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
            if (orderby == 'active') {
                wh['where']['count'] = {
                    [Op.gte]: 10
                };
                wh['where']['updatedAt'] = {
                    [Op.gte]: today
                };
                wh['order'] = [
                    ['count', order]
                ];
            }
            console.log('@@@@@@@@@@@', wh);
            mdb.Customer.findAll(wh).then(data => {
                res.send(data);
            });
        } else res.send([]);
    }, 2);
}

// get customer count
function getCustomerCount(req, res) {
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
                            name: {
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
            if (orderby == 'active') {
                wh['where']['count'] = {
                    [Op.gte]: 10
                };
                wh['where']['updatedAt'] = {
                    [Op.gte]: today
                };
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

// fetch all customer
async function fetchCustomerFromHubSpot(req, res) {
    var data = await fetchCustomerFromHubSpotAsync(req.body.recent, req.body.shopId || 1, req.body.userId || req.body.SESSION_USERID);
    res.send(data);
}

// fetch all customer
async function fetchCustomerFromHubSpotAsync(isRecent, shopId, userId) {
    var apilink = 'https://api.hubapi.com/contacts/v1/lists/all/contacts/all';
    if (isRecent) apilink = 'https://api.hubapi.com/contacts/v1/lists/recently_updated/contacts/recent';
    var hubkey = await mdb.Shop.findOne({ where: { id: 1 } });
    var dataHub = [];
    // var datares = await getHub();
    // console.log(await getHub());
    var tret = await getHub();
    while (tret.next) {
        console.log(tret.offset);
        tret = await getHub(tret.offset);
    }
    async function getHub(offset) {
        if (offset) offset = `&vidOffset=${offset}`;
        else offset = ``;
        return new Promise((resolve, reject) => {
            https.get(`${ apilink }?hapikey=${ hubkey.hubspotkey }&count=100&property=phone&property=firstname&property=lastname&property=email${ offset }`, res => {
                var str = '';
                res.on('data', (d) => {
                    str += d;
                });

                res.on('end', () => {
                    // console.log(3, str)
                    var dataEnd = JSON.parse(str);
                    var dataRes = [];
                    for (var i = 0; i < dataEnd.contacts.length; i++) {
                        var fname = dataEnd.contacts[i].properties.firstname;
                        var lname = dataEnd.contacts[i].properties.lastname;
                        var name = (fname ? fname.value : '') + ' ' + (lname ? lname.value : '');
                        var phone = dataEnd.contacts[i].properties.phone;
                        var email = dataEnd.contacts[i].properties.email;
                        var tData = {
                            id: dataEnd.contacts[i].vid,
                            name: name,
                            phone: phone ? phone.value.replace(`+`, ``).split(' ')[0] : null,
                            email: email ? email.value : null,
                            updatedAt: dataEnd.contacts[i].properties.lastmodifieddate.value,
                        }
                        dataHub.push(tData);
                    }
                    resolve({ next: dataEnd[`has-more`], offset: dataEnd[`vid-offset`] });
                });
            });
        });
    }
    var attributes = [
        'id',
        'name',
        'phone',
        'email', [Sequelize.fn('UNIX_TIMESTAMP', Sequelize.col('updatedAt')), 'updatedAt']
    ];
    var nUp = 0;
    var nCr = 0;
    var dataSql = await mdb.Customer.findAll({ attributes: attributes })
    for (var i = 0; i < dataHub.length; i++) {
        var tNew = true;
        for (var j = 0; j < dataSql.length; j++) {
            if (Number(dataHub[i].id) == Number(dataSql[j].id)) {
                if (Number(dataHub[i].updatedAt.substr(0, 10)) < Number(dataSql[j].updatedAt)) {
                    tNew = false;
                    break;
                } else {
                    dataSql[j].name = dataHub[i].name;
                    dataSql[j].phone = dataHub[i].phone;
                    dataSql[j].email = dataHub[i].email;
                    await dataSql[j].save();
                    nUp++;
                    tNew = false;
                    break;
                }
            }
        }
        if (tNew) {
            delete dataHub[i].updatedAt;
            dataHub[i]['credit'] = 0;
            dataHub[i]['creditlimit'] = 0;
            dataHub[i]['qty'] = 0;
            dataHub[i]['amount'] = 0;
            dataHub[i]['count'] = 0;
            console.log(dataHub[i]);
            var customerD = await mdb.Customer.create(dataHub[i]);
            nCr++;
            for (var mi = 0; mi < 2; mi++) {
                try {
                    var message = await mdb.Message.findOne({ where: { id: idgen.tableID.message.id + '1' + (mi + 1) } });
                    var fordata = message.for.split('.');
                    var type = message.type;
                    var label = message.label;
                    message = message.message;

                    var data = {
                        type: type,
                        subject: label,
                        message: message,
                        shop: {},
                        customer: customerD,
                        vendor: {},
                        user: {},
                        sales: {},
                        return: {}
                    };
                    if (shopId) data.shop = await mdb.Shop.findOne({ where: { id: shopId } });
                    if (userId) data.user = await mdb.User.findOne({ where: { id: userId } });

                    data['email'] = data.shop.shopemail;
                    data['password'] = data.shop.shopemailpassword;
                    data['to'] = data[fordata[0]][fordata[1]];
                    await messageLib.send(data);
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }
    return { update: nUp, new: nCr };
}



module.exports = {get, add, update, deleteCustomer, customerInfo, getCustomer, getCustomerCount, fetchCustomerFromHubSpot, fetchCustomerFromHubSpotAsync }
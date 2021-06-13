const mdb = require('../db/init');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');
const https = require('https');
const idgen = require('../db/idgen');
const saleData = require('../db/saleData');
const nodemailer = require('nodemailer');

async function add(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 10);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var id = await idgen.getIDAsync(idgen.tableID.message, 'num', 1, false);
        var msg = {
            id: id,
            for: req.body.for,
            type: req.body.type,
            label: req.body.label,
            message: req.body.message
        };
        console.log(msg);
        await mdb.Message.create(msg);
        res.send({ msg: 'message added', err: false });
    } catch (e) {
        console.log(e);
        res.send({ msg: 'some error', err: true });
    }
}
async function update(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 10);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var msg = {
            for: req.body.for,
            type: req.body.type,
            label: req.body.label,
            message: req.body.message
        };
        await mdb.Message.update(msg, { where: { id: req.body.id } });
        res.send({ msg: 'message updated', err: false });
    } catch (e) {
        console.log(e);
        res.send({ msg: 'some error', err: true });
    }
}
async function deleteMessage(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 10);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        await mdb.Message.destroy({ where: { id: req.body.id } });
        res.send({ msg: 'message deleted', err: false });
    } catch (e) {
        console.log(e);
        res.send({ msg: 'some error', err: true });
    }
}

async function getMessage(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 10);
        if (!dataAuth) {
            res.send([]);
            return;
        }
        var wh = {
            offset: (parseInt(req.body.page) - 1) * parseInt(req.body.limit),
            limit: parseInt(req.body.limit),
            order: [
                [req.body.orderBy, req.body.order]
            ]
        };
        if (req.body.searchText && req.body.searchText != '') {
            wh['where'] = {
                [Op.or]: [{
                        for: {
                            [Op.like]: `%${req.body.searchText}%`
                        }
                    },
                    {
                        type: {
                            [Op.like]: `%${req.body.searchText}%`
                        }
                    },
                    {
                        label: {
                            [Op.like]: `%${req.body.searchText}%`
                        }
                    }
                ]
            }
        }
        var data = await mdb.Message.findAll(wh);
        res.send(data);
    } catch (e) {
        console.log(e);
        res.send([]);
    }
}

async function getMessageCount(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 10);
        if (!dataAuth) {
            res.send('0');
            return;
        }
        var wh = {};
        if (req.body.searchText && req.body.searchText != '') {
            wh['where'] = {
                [Op.or]: [{
                        for: {
                            [Op.like]: `%${req.body.searchText}%`
                        }
                    },
                    {
                        type: {
                            [Op.like]: `%${req.body.searchText}%`
                        }
                    },
                    {
                        label: {
                            [Op.like]: `%${req.body.searchText}%`
                        }
                    }
                ]
            }
        }
        var data = await mdb.Message.count(wh);
        if (data) res.send(data.toString());
        else res.send('0');
    } catch (e) {
        console.log(e);
        res.send('0');
    }
}

// type: email/mobile, (email, passwoed): shop, to, subject, message
async function send(data) {
    var shop = data.shop || await mdb.Shop.findOne({ where: { id: 1 } });

    if (data.type == 'email') {
        var email = data.email || shop.shopemail;
        var password = data.password || shop.shopemailpassword;
        var message = data.message.replace(/{{[\w.]*}}/g, x => {
            var tAttr = x.substr(2, x.length - 4).split('.');
            return data[tAttr[0]][tAttr[1]];
        });

        var transporter = nodemailer.createTransport({
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
                user: email,
                pass: password
            }
        });
        console.log(1, message, email, password);
        var mailOptions = {
            from: `"Medical Shop" <${email}>`,
            to: data.to,
            subject: data.subject,
            text: message
        };
        return new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, function(error, info) {
                console.log(2, error, info);
                if (error) {
                    resolve({ msg: 'some error', err: true, info: info });
                } else {
                    resolve({ msg: 'email sent', err: false, info: info });
                }
            });
        });
    } else {
        var api = 'https://www.smschef.com/system/api/send';
        var key = data.key || shop.shopphoneapi;
        var phone = data.phone || shop.shopphoneno;
        return new Promise((resolve, reject) => {
            https.get(`${api}?key=${key}&phone=${phone}&message=${message}`, res => {
                console.log(3, res);
                resolve({ msg: 'email sent', err: false, info: info });
            });
        });
    }
}

async function sendMessage(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 2);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var shopId = req.body.shopId || 1;
        var customerId = req.body.customerId;
        var vendorId = req.body.vendorId;
        var userId = req.body.userId;
        var salesId = req.body.userId;

        var fordata = req.body.for.split('.');
        var type = req.body.type;
        var label = req.body.label;
        var message = req.body.message;

        var data = {
            shop: {},
            customer: {},
            vendor: {},
            user: {},
            sales: {}
        };
        if (shopId) data.shop = await mdb.Shop.findOne({ where: { id: shopId } });
        if (customerId) data.customer = await mdb.Customer.findOne({ where: { id: customerId } });
        if (vendorId) data.vendor = await mdb.Vendor.findOne({ where: { id: vendorId } });
        if (userId) data.user = await mdb.User.findOne({ where: { id: userId } });
        if (salesId) data.sales = await mdb.Sales.findOne({ where: { id: salesId } });

        data['email'] = data.shop.shopemail;
        data['password'] = data.shop.shopemailpassword;
        data['to'] = data[fordata[0]][fordata[1]];
        data['type'] = type;
        data['subject'] = label;
        data['message'] = message;

        var mailData = await send(data);
        res.send(mailData);
    } catch (e) {
        console.log(e);
        res.send({ msg: 'some error', err: true });
    }
}

// 1, 2 customer due
// 3, 4 purchase due
// 5, 6 return due
// 7, 8 sales message
// 9, 10 return message
async function sendMessageMultiple(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 2);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var shopId = req.body.shopId || 1;
        var customerId = req.body.customerId;
        var vendorId = req.body.vendorId;
        var userId = req.body.userId;
        var salesId = req.body.userId;

        var messagetype = req.body.message;
        var message = await mdb.Message.findOne({ where: { id: idgen.tableID.message.id + req.body.message } });
        var fordata = message.for.split('.');
        var type = message.type;
        var label = message.type;
        message = message.message;

        var data = {
            type: type,
            subject: label,
            message: message,
            shop: {},
            customer: {},
            vendor: {},
            user: {},
            sales: {}
        };
        if (shopId) data.shop = await mdb.Shop.findOne({ where: { id: shopId } });
        if (customerId) data.customer = await mdb.Customer.findOne({ where: { id: customerId } });
        if (vendorId) data.vendor = await mdb.Vendor.findOne({ where: { id: vendorId } });
        if (userId) data.user = await mdb.User.findOne({ where: { id: userId } });
        if (salesId) data.sales = await mdb.Sales.findOne({ where: { id: salesId } });

        data['email'] = data.shop.shopemail;
        data['password'] = data.shop.shopemailpassword;
        if (messagetype == 1 || messagetype == 2) {
            var customers = await mdb.Customer.findAll({
                where: {
                    credit: {
                        [Op.gt]: 0
                    }
                }
            });
            for (var i = 0; i < customers.length; i++) {
                data.customer = customers[i];
                data['to'] = data[fordata[0]][fordata[1]];
                var tRet = await send(data);
                console.log(`########### email sent ${data.to} ###########`);
            }
            res.send({ msg: `sent to ${customers.length} customers` });
        }
        // console.log(message);
        // res.send({ msg: 'done!', err: false });
    } catch (e) {
        console.log(e);
        res.send({ msg: 'some error', err: true });
    }
}


module.exports = {
    add,
    update,
    deleteMessage,
    getMessage,
    getMessageCount,
    sendMessage,
    sendMessageMultiple
}
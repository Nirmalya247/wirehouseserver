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
    var message = data.message.replace(/{{[\w.]*}}/g, x => {
        var tAttr = x.substr(2, x.length - 4).split('.');
        return data[tAttr[0]][tAttr[1]];
    });
    var subject = data.subject.replace(/{{[\w.]*}}/g, x => {
        var tAttr = x.substr(2, x.length - 4).split('.');
        return data[tAttr[0]][tAttr[1]];
    });

    if (data.type == 'email') {
        var email = data.email || shop.shopemail;
        var password = data.password || shop.shopemailpassword;

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
            from: `"Kalyani Medical" <${email}>`,
            to: data.to,
            subject: subject,
            text: message
        };
        return new Promise((resolve, reject) => {
            if (data.to == null || data.to.toString().trim() == '') {
                resolve({ msg: 'wrong email', err: true });
                return;
            }
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
        var key = data.smskey || shop.smskey;
        var apiHost = 'https://www.smschef.com';
        var apiPath = '/system/api/send';
        return new Promise((resolve, reject) => {
            if (data.to == null || data.to.toString().trim() == '') {
                resolve({ msg: 'wrong number', err: true });
                return;
            }
            data.to = data.to.toString().replace(/[+]/g, '').trim();
            if (data.to.length < 10) {
                resolve({ msg: 'wrong number', err: true });
                return;
            } else {
                if (data.to.length == 10) data.to = '977' + data.to;
                // message = message.replace(/(\r\n|\n|\r)/gm, '\\n');
                message = encodeURIComponent(message);
                // console.log(3, message);
                https.get(`${ apiHost + apiPath }?key=${ key }&phone=${ data.to }&message=${ message }`, res => {
                    resolve({ msg: 'message sent', err: false });
                });
            }
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
        var userId = req.body.userId || req.body.SESSION_USERID;
        var salesId = req.body.salesId;
        var returnId = req.body.salesId;


        var fordata = req.body.for;
        var type = req.body.type;
        var label = req.body.label;
        var message = req.body.message;
        if (req.body.messageId) {
            message = await mdb.Message.findOne({ where: { id: idgen.tableID.message.id + req.body.messageId } });
            fordata = message.for.split('.');
            type = message.type;
            label = message.label;
            message = message.message;
        } else fordata = fordata.split('.');

        var data = {
            shop: {},
            customer: {},
            vendor: {},
            user: {},
            sales: {},
            return: {}
        };
        if (shopId) data.shop = await mdb.Shop.findOne({ where: { id: shopId } });
        console.log('hi3', userId);
        if (customerId) data.customer = await mdb.Customer.findOne({ where: { id: customerId } });
        console.log('hi4', userId);
        if (vendorId) data.vendor = await mdb.Vendor.findOne({ where: { id: vendorId } });
        console.log('hi6', userId);
        if (userId) data.user = await mdb.User.findOne({ where: { id: userId } });
        console.log('hi7', userId);
        if (salesId) {
            data.sales = await mdb.Sale.findOne({ where: { id: salesId } });
        }
        console.log('hi8', userId);
        if (returnId) {
            data.return = await mdb.Return.findOne({ where: { id: returnId } });
        }
        console.log('hi9', userId);

        data['email'] = data.shop.shopemail;
        data['password'] = data.shop.shopemailpassword;
        data['to'] = data[fordata[0]][fordata[1]];
        data['type'] = type;
        data['subject'] = label;
        data['message'] = message;
        console.log('hi10', userId);

        var mailData = await send(data);
        console.log('hi11', userId);
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
        var userId = req.body.userId || req.body.SESSION_USERID;
        var salesId = req.body.salesId;
        var returnId = req.body.returnId;

        var messagetype = req.body.message;
        var message = await mdb.Message.findOne({ where: { id: idgen.tableID.message.id + req.body.message } });
        var fordata = message.for.split('.');
        var type = message.type;
        var label = message.label;
        message = message.message;

        var data = {
            type: type,
            subject: label,
            message: message,
            shop: {},
            customer: {},
            vendor: {},
            user: {},
            sales: {},
            return: {}
        };
        if (shopId) data.shop = await mdb.Shop.findOne({ where: { id: shopId } });
        if (customerId) data.customer = await mdb.Customer.findOne({ where: { id: customerId } });
        if (vendorId) data.vendor = await mdb.Vendor.findOne({ where: { id: vendorId } });
        if (userId) data.user = await mdb.User.findOne({ where: { id: userId } });
        if (salesId) data.sales = await mdb.Sale.findOne({ where: { id: salesId } });
        if (returnId) data.return = await mdb.Return.findOne({ where: { id: returnId } });

        data['email'] = data.shop.shopemail;
        data['password'] = data.shop.shopemailpassword;
        if (messagetype == 1 || messagetype == 2) { // customer due by customer
            var customers = await mdb.Customer.findAll({
                where: {
                    credit: {
                        [Op.gt]: 0
                    }
                }
            });
            // console.log('@@@@@@@@@@@ sending ' + messagetype + ' @@@@@@@@@@@', customers.length);
            for (var i = 0; i < customers.length; i++) {
                data.customer = customers[i];
                data['to'] = data[fordata[0]][fordata[1]];
                var tRet = await send(data);
                // console.log(`########### email sent ${data.to} ###########`);
            }
            res.send({ msg: `sent to ${ customers.length } customers` });
        } else if (messagetype == 3 || messagetype == 4) { // purchase due
            var purchases = await mdb.Purchase.findAll({
                where: {
                    dueAmount: {
                        [Op.gt]: 0
                    }
                },
                include: [{ model: mdb.Vendor, as: 'vendors' }]
            });
            console.log('@@@@@@@@@@@ sending ' + messagetype + ' @@@@@@@@@@@', purchases);
            for (var i = 0; i < purchases.length; i++) {
                data.purchase = purchases[i];
                data.vendor = purchases[i].vendors;
                data['to'] = data[fordata[0]][fordata[1]];
                var tRet = await send(data);
                // console.log(`########### email sent ${data.to} ###########`);
            }
            res.send({ msg: `sent to ${ purchases.length } vendors` });
        } else if (messagetype == 5 || messagetype == 6) { // return due
            var returns = await mdb.Return.findAll({
                where: {
                    dueAmount: {
                        [Op.gt]: 0
                    }
                },
                include: [{ model: mdb.Vendor, as: 'vendors' }]
            });
            console.log('@@@@@@@@@@@ sending ' + messagetype + ' @@@@@@@@@@@', returns);
            for (var i = 0; i < returns.length; i++) {
                data.return = returns[i];
                data.vendor = returns[i].vendors;
                data['to'] = data[fordata[0]][fordata[1]];
                var tRet = await send(data);
                // console.log(`########### email sent ${data.to} ###########`);
            }
            res.send({ msg: `sent to ${ returns.length } vendors` });
        } else if (messagetype == 13 || messagetype == 14) { // customer due by bill
            var bills = await mdb.Sale.findAll({
                where: {
                    creditAmount: {
                        [Op.gt]: 0
                    }
                }
            });
            // console.log('@@@@@@@@@@@ sending ' + messagetype + ' @@@@@@@@@@@', bills.length);
            for (var i = 0; i < bills.length; i++) {
                data.sales = bills[i];
                data.customer = await mdb.Customer.findOne({ where: { id: bills[i].customerID } });
                data['to'] = data[fordata[0]][fordata[1]];
                var tRet = await send(data);
                // console.log(`########### email sent ${data.to} ###########`);
            }
            res.send({ msg: `sent for ${ bills.length } bills` });
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
    send,
    sendMessage,
    sendMessageMultiple
}
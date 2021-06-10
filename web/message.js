const mdb = require('../db/init');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');
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
    } catch(e) {
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
    } catch(e) {
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
    } catch(e) {
        console.log(e);
        res.send({ msg: 'some error', err: true });
    }
}

async function getMessage(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 10);
        if (!dataAuth) {
            res.send([ ]);
            return;
        }
        var wh = { offset: (parseInt(req.body.page) - 1) * parseInt(req.body.limit), limit: parseInt(req.body.limit), order: [[req.body.orderBy, req.body.order]] };
        if (req.body.searchText && req.body.searchText != '') {
            wh['where'] = {
                [Op.or]: [
                    {for: { [Op.like]: `%${req.body.searchText}%` } },
                    {type: { [Op.like]: `%${req.body.searchText}%` } },
                    {label: { [Op.like]: `%${req.body.searchText}%` } }
                ]
            }
        }
        var data = await mdb.Message.findAll(wh);
        res.send(data);
    } catch(e) {
        console.log(e);
        res.send([ ]);
    }
}

async function getMessageCount(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 10);
        if (!dataAuth) {
            res.send('0');
            return;
        }
        var wh = { };
        if (req.body.searchText && req.body.searchText != '') {
            wh['where'] = {
                [Op.or]: [
                    {for: { [Op.like]: `%${req.body.searchText}%` } },
                    {type: { [Op.like]: `%${req.body.searchText}%` } },
                    {label: { [Op.like]: `%${req.body.searchText}%` } }
                ]
            }
        }
        var data = await mdb.Message.count(wh);
        if (data) res.send(data.toString());
        else res.send('0');
    } catch(e) {
        console.log(e);
        res.send('0');
    }
}

async function sendMessage(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 2);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var shopId = req.body.shopId;
        var customerId = req.body.customerId;
        var vendorId = req.body.vendorId;
        var userId = req.body.userId;
        var fordata = req.body.for.split('.');
        var type = req.body.type;
        var label = req.body.label;
        var message = req.body.message;

        var data = {
            shop: { },
            customer: { }
        };
        if (shopId) data.shop = await mdb.Shop.findOne({ where: { id: shopId } });
        if (customerId) data.customer = await mdb.Customer.findOne({ where: { id: customerId } });
        if (vendorId) data.vendor = await mdb.Vendor.findOne({ where: { id: vendorId } });
        if (userId) data.vendor = await mdb.Vendor.findOne({ where: { id: userId } });

        
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: data.shop.shopemail,
                pass: data.shop.shopemailpassword
            }
        });

        message = message.replace(/{{.*}}/g, x => {
            var tAttr = x.substr(2, x.length - 4).split('.');
            return data[tAttr[0]][tAttr[1]];
        });
        var mailOptions = {
            from: data.shop.shopemail,
            to: data[fordata[0]][fordata[1]],
            subject: label,
            text: message
        };
        // console.log(message);
        transporter.sendMail(mailOptions, function (error, info) {
            // console.log(error, info);
            if (error) {
                res.send(res.send({ msg: 'some error', err: true }));
            } else {
                res.send(res.send({ msg: 'email sent', err: false }));
            }
        });
        // res.send({ msg: 'done!', err: false });
    } catch(e) {
        console.log(e);
        res.send({ msg: 'some error', err: true });
    }
}


module.exports = { add, update, deleteMessage, getMessage, getMessageCount, sendMessage }
const mdb = require('../db/init');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');
const nodemailer = require('nodemailer');

// today sales data
function getToday(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var today = new Date();
            mdb.SaleData.findOne({ where: { days: today } }).then(data => {
                if (data) {
                    data['err'] = false;
                    data['msg'] = 'got today\'s data';
                    res.send(data);
                } else {
                    var dd = today.getDate();
                    var mm = today.getMonth() + 1;
                    var yyyy = today.getFullYear();
                    if (dd < 10) dd = '0' + dd;
                    if (mm < 10) mm = '0' + mm;
                    var days = yyyy + '-' + mm + '-' + dd;
                    res.send({ days: days, itemsold: 0, itembought: 0, earning: 0, spending: 0, msg: 'no data', err: false })
                }
            });
        }
        else {
            res.send(res.send({ days: days, itemsold: 0, itembought: 0, earning: 0, spending: 0, msg: 'not permitted', err: true }));
        }
    }, 3);
}

// graph data
function getGraphData(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var findby = req.body.findby;
            var group = [];
            var attributes = [
                [Sequelize.fn(findby, Sequelize.col('days')), 'tim'],
                [Sequelize.fn('sum', Sequelize.col('itemsold')), 'itemsold'],
                [Sequelize.fn('sum', Sequelize.col('itembought')), 'itembought'],
                [Sequelize.fn('sum', Sequelize.col('earning')), 'earning'],
                [Sequelize.fn('sum', Sequelize.col('spending')), 'spending']
            ];
            var condition = {}
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1;
            var yyyy = today.getFullYear();
            if (dd < 10) dd = '0' + dd;
            if (mm < 10) mm = '0' + mm;

            var lim = 0;
            if (findby == 'year') {
                group = [Sequelize.literal('year(days)')];
            } else if (findby == 'month') {
                group = [Sequelize.literal('year(days)'), Sequelize.literal('month(days)')];
                condition['days'] = {
                    [Op.gte]: yyyy + '-01-01'
                };
                lim = 12;
            } else {
                attributes = [
                    [Sequelize.fn(findby, Sequelize.col('days')), 'tim'],
                    'itemsold',
                    'itembought',
                    'earning',
                    'spending'
                ]
                condition['days'] = {
                    [Op.gte]: yyyy + '-' + mm + '-01'
                };
                lim = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            }
            mdb.SaleData.findAll({
                attributes: attributes,
                group: group,
                where: condition
            }).then(data => {
                if (res) {
                    var datas = {
                        labels: [],
                        itemsold: [],
                        itembought: [],
                        earning: [],
                        spending: [],
                        profit: [],
                        now: {
                            itemsold: 0,
                            itembought: 0,
                            earning: 0,
                            spending: 0,
                            profit: 0
                        },
                        err: false
                    };
                    if (findby == 'year') {
                        for (var i = 0; i < data.length; i++) {
                            datas.labels.push(data[i].dataValues.tim);
                            datas.itemsold.push(Number(data[i].itemsold));
                            datas.itembought.push(Number(data[i].itembought));
                            datas.earning.push(Number(data[i].earning));
                            datas.spending.push(Number(data[i].spending));
                            datas.profit.push(Number(data[i].earning) - Number(data[i].spending));
                        }
                        datas.now = {
                            itemsold: Number(data[data.length - 1].itemsold),
                            itembought: Number(data[data.length - 1].itembought),
                            earning: Number(data[data.length - 1].earning),
                            spending: Number(data[data.length - 1].spending),
                            profit: Number(data[data.length - 1].earning) - Number(data[data.length - 1].spending)
                        };
                    }
                    if (findby == 'month') {
                        datas.labels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                        datas.itemsold = Array(12).fill(0);
                        datas.itembought = Array(12).fill(0);
                        datas.earning = Array(12).fill(0);
                        datas.spending = Array(12).fill(0);
                        datas.profit = Array(12).fill(0);
                        var timM = -1;
                        var iM = -1;
                        for (var i = 0; i < data.length; i++) {
                            var tim = Number(data[i].dataValues.tim) - 1;
                            if (tim > timM) {
                                timM = tim;
                                iM = i;
                            }
                            datas.itemsold[tim] = Number(data[i].itemsold);
                            datas.itembought[tim] = Number(data[i].itembought);
                            datas.earning[tim] = Number(data[i].earning);
                            datas.spending[tim] = Number(data[i].spending);
                            datas.profit[tim] = datas.earning[tim] - datas.spending[tim];
                        }
                        datas.now = {
                            itemsold: Number(data[iM].itemsold),
                            itembought: Number(data[iM].itembought),
                            earning: Number(data[iM].earning),
                            spending: Number(data[iM].spending),
                            profit: Number(data[iM].earning) - Number(data[iM].spending)
                        };
                    }
                    if (findby == 'day') {
                        var days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                        datas.labels = Array.from({ length: days }, (_, i) => i + 1);
                        datas.itemsold = Array(days).fill(0);
                        datas.itembought = Array(days).fill(0);
                        datas.earning = Array(days).fill(0);
                        datas.spending = Array(days).fill(0);
                        datas.profit = Array(days).fill(0);
                        var timM = -1;
                        var iM = -1;
                        for (var i = 0; i < data.length; i++) {
                            var tim = Number(data[i].dataValues.tim) - 1;
                            if (tim > timM) {
                                timM = tim;
                                iM = i;
                            }
                            datas.itemsold[tim] = Number(data[i].itemsold);
                            datas.itembought[tim] = Number(data[i].itembought);
                            datas.earning[tim] = Number(data[i].earning);
                            datas.spending[tim] = Number(data[i].spending);
                            datas.profit[tim] = datas.earning[tim] - datas.spending[tim];
                        }
                        datas.now = {
                            itemsold: Number(data[iM].itemsold),
                            itembought: Number(data[iM].itembought),
                            earning: Number(data[iM].earning),
                            spending: Number(data[iM].spending),
                            profit: Number(data[iM].earning) - Number(data[iM].spending)
                        };
                        // datas = {
                        //     findby: 'day',
                        //     data: data,
                        //     datas: datas
                        // };
                    }
                    res.send(datas);
                } else {
                    res.send({ err: true });
                }
            });
        }
        else {
            res.send({ err: true });
        }
    }, 3);
}

// get item data

// get items high/low stock
function getStock(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var wh = {
                offset: (parseInt(req.body.page) - 1) * parseInt(req.body.limit),
                limit: parseInt(req.body.limit),
                order: [['qty', req.body.order]]
            };
            mdb.Item.findAll(wh).then(data => {
                if (data) res.send(data);
                else res.send([]);
            })
        } else res.send([]);
    });
}

// get items count high/low stock
function getStockCount(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var wh = {};
            mdb.Item.count(wh).then(data => {
                console.log('***********', data);
                if (data) res.send(data.toString());
                else res.send('0');
            })
        } else res.send('0');
    });
}

// get items high/low demand/earning (qty/totalprice)
function getDemand(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var today = new Date();
            today = new Date(today.setMonth(today.getMonth() - 1));
            var dd = today.getDate();
            var mm = today.getMonth() + 1;
            var yyyy = today.getFullYear();
            if (dd < 10) dd = '0' + dd;
            if (mm < 10) mm = '0' + mm;

            var wh = {
                attributes: [
                    'itemcode',
                    'itemname',
                    [Sequelize.fn('sum', Sequelize.col('totalPrice')), 'totalprice'],
                    [Sequelize.fn('sum', Sequelize.col('qty')), 'qty']
                ],
                offset: (parseInt(req.body.page) - 1) * parseInt(req.body.limit),
                limit: parseInt(req.body.limit),
                order: [[Sequelize.literal(`sum(${req.body.orderby})`), req.body.order]],
                where: {
                    createdAt: { [Op.gte]: yyyy + '-' + mm + '-01' },
                    itemname: { [Op.ne]: 'credit amount' }
                },
                group: ['itemcode']
            };
            mdb.TransactionItem.findAll(wh).then(data => {
                if (data) res.send(data);
                else res.send([]);
            });
        } else res.send([]);
    });
}

// get items count high/low demand/earning
function getDemandCount(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var today = new Date();
            today = new Date(today.setMonth(today.getMonth() - 1));
            var dd = today.getDate();
            var mm = today.getMonth() + 1;
            var yyyy = today.getFullYear();
            if (dd < 10) dd = '0' + dd;
            if (mm < 10) mm = '0' + mm;

            var wh = {
                attributes: [
                    [Sequelize.fn('distinct', Sequelize.col('itemcode')), 'itemcode']
                ],
                where: {
                    createdAt: { [Op.gte]: yyyy + '-' + mm + '-01' },
                    itemname: { [Op.ne]: 'credit amount' }
                }
            };
            mdb.TransactionItem.findAll(wh).then(data => {
                // console.log('***********', data);
                if (data) res.send(data.length.toString());
                else res.send('0');
            })
        } else res.send('0');
    });
}

// expiry

// get expiry
function getExpiry(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var page = req.body.page;
            var limit = req.body.limit;
            var order = req.body.order;

            var today = new Date();
            today = new Date(today.setMonth(today.getMonth() + 12));
            var dd = today.getDate();
            var mm = today.getMonth() + 1;
            var yyyy = today.getFullYear();
            if (dd < 10) dd = '0' + dd;
            if (mm < 10) mm = '0' + mm;
            today = yyyy + '-' + mm + '-' + dd;

            mdb.ItemUpdate.findAll({
                offset: (parseInt(page) - 1) * parseInt(limit),
                limit: parseInt(limit),
                order: [['expiry', order]],
                where: {
                    qtystock: { [Op.gt]: 0 },
                    expiry: { [Op.lt]: today }
                },
                include: [{ model: mdb.Salesman, as: 'salesmans' }]
            }).then(data => {
                res.send(data);
            });
        } else res.send([]);
    });
}

// get expiry count
function getExpiryCount(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var page = req.body.page;
            var limit = req.body.limit;
            var order = req.body.order;

            var today = new Date();
            today = new Date(today.setMonth(today.getMonth() + 12));
            var dd = today.getDate();
            var mm = today.getMonth() + 1;
            var yyyy = today.getFullYear();
            if (dd < 10) dd = '0' + dd;
            if (mm < 10) mm = '0' + mm;
            today = yyyy + '-' + mm + '-' + dd;

            mdb.ItemUpdate.count({
                where: {
                    qtystock: { [Op.gt]: 0 },
                    expiry: { [Op.lt]: today }
                }
            }).then(data => {
                res.send(data.toString());
            });
        } else res.send('0');
    });
}

// credit

// get credit
function getCredit(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var page = req.body.page;
            var limit = req.body.limit;

            mdb.Customer.findAll({
                where: { credit: { [Op.gt]: 0 } },
                offset: (parseInt(page) - 1) * parseInt(limit),
                limit: parseInt(limit),
                order: [[Sequelize.literal(`(creditlimit - credit)`), req.body.order]]
            }).then(data => {
                res.send(data);
            });
        } else res.send([]);
    });
}

// get credit count
function getCreditCount(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var page = req.body.page;
            var limit = req.body.limit;

            mdb.Customer.count({ where: { credit: { [Op.gt]: 0 } } }).then(data => {
                res.send(data.toString());
            });
        } else res.send('0');
    });
}

// send credit email
function sendCreditEmail(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            mdb.Shop.findOne({ where: { id: 1 } }).then(shopData => {
                mdb.Customer.findOne({ where: { id: req.body.customerid } }).then(customerData => {
                    var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: shopData.shopemail,
                            pass: shopData.shopemailpassword
                        }
                    });

                    var mailOptions = {
                        from: shopData.shopemail,
                        to: customerData.email,
                        subject: `${shopData.shopname} Credit`,
                        text: `
Hello ${customerData.name}

Your credit amount is ${customerData.credit} with a limit of ${customerData.creditlimit}.
Please consider paying back your credit amount.

Thank you.

(Contact info)
Address : ${shopData.shopaddress}
Phone No: ${shopData.shopphoneno} / ${shopData.shopotherphoneno}
Email   :${shopData.shopemail}
`
                    };

                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            res.send(res.send({ msg: 'some error', err: true }));
                        } else {
                            res.send(res.send({ msg: 'email sent', err: false }));
                        }
                    });
                });
            });
        } else res.send(res.send({ msg: 'not permitted', err: true }));
    });
}

module.exports = { getToday, getGraphData, getStock, getStockCount, getDemand, getDemandCount, getExpiry, getExpiryCount, getCredit, getCreditCount, sendCreditEmail }
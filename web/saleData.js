const mdb = require('../db/init');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');

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
            var condition = { }
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
                        earning: [],
                        spending: [],
                        profit: [],
                        err: false
                    };
                    if (findby == 'year') {
                        for (var i = 0; i < data.length; i++) {
                            datas.labels.push(data[i].dataValues.tim);
                            datas.earning.push(Number(data[i].earning));
                            datas.spending.push(Number(data[i].spending));
                            datas.profit.push(Number(data[i].earning) - Number(data[i].spending));
                        }
                        // datas = {
                        //     findby: 'year',
                        //     data: data,
                        //     datas: datas
                        // };
                    }
                    if (findby == 'month') {
                        datas.labels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                        datas.earning = Array(12).fill(0);
                        datas.spending = Array(12).fill(0);
                        datas.profit = Array(12).fill(0);
                        for (var i = 0; i < data.length; i++) {
                            var tim = Number(data[i].dataValues.tim) - 1;
                            datas.earning[tim] = Number(data[i].earning);
                            datas.spending[tim] = Number(data[i].spending);
                            datas.profit[tim] = datas.earning[tim] - datas.spending[tim];
                        }
                        // datas = {
                        //     findby: 'month',
                        //     data: data,
                        //     datas: datas
                        // };
                    }
                    if (findby == 'day') {
                        var days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                        datas.labels = Array.from({length: days}, (_, i) => i + 1);
                        datas.earning = Array(days).fill(0);
                        datas.spending = Array(days).fill(0);
                        datas.profit = Array(days).fill(0);
                        for (var i = 0; i < data.length; i++) {
                            var tim = Number(data[i].dataValues.tim) - 1;
                            datas.earning[tim] = Number(data[i].earning);
                            datas.spending[tim] = Number(data[i].spending);
                            datas.profit[tim] = datas.earning[tim] - datas.spending[tim];
                        }
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
                else res.send([ ]);
            })
        } else res.send([ ]);
    });
}

// get items count high/low stock
function getStockCount(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var wh = { };
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
                group: [ 'itemcode' ]
            };
            mdb.TransactionItem.findAll(wh).then(data => {
                if (data) res.send(data);
                else res.send([ ]);
            })
        } else res.send([ ]);
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

module.exports = { getToday, getGraphData, getStock, getStockCount, getDemand, getDemandCount }
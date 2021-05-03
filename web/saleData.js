const mdb = require('../db/init');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');

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
                        spending: []
                    };
                    if (findby == 'year') {
                        datas.labels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                    }
                    res.send(data);
                } else {
                    res.send([ ]);
                }
            });
        }
        else {
            res.send([ ]);
        }
    }, 3);
}

module.exports = { getToday, getGraphData }
const mdb = require('./init');
const user = require('../web/user');
const { Op, Sequelize } = require('sequelize');

// update sale data
function update(itemsold, itembought, earning, spending, callback) {
    itemsold = isNaN(Number(itemsold)) ? null : Number(itemsold);
    itembought = isNaN(Number(itembought)) ? null : Number(itembought);
    earning = isNaN(Number(earning)) ? null : Number(earning);
    spending = isNaN(Number(spending)) ? null : Number(spending);


    var today = new Date();
    console.log('***********' + itemsold, itembought, earning, spending);
    mdb.SaleData.findOne({ where: { days: today } }).then(data => {
        if (data) {
            var updateData = {};
            if (itemsold) updateData['itemsold'] = Sequelize.literal('itemsold + ' + itemsold);
            if (itembought) updateData['itembought'] = Sequelize.literal('itembought + ' + itembought);
            if (earning) updateData['earning'] = Sequelize.literal('earning + ' + earning);
            if (spending) updateData['spending'] = Sequelize.literal('spending + ' + spending);
            mdb.SaleData.update(updateData, { where: { days: today } }).then(callback);
        } else {
            var createData = { days: today };
            createData['itemsold'] = (itemsold ? itemsold : 0);
            createData['itembought'] = (itembought ? itembought : 0);
            createData['earning'] = (earning ? earning : 0);
            createData['spending'] = (spending ? spending : 0);
            mdb.SaleData.create(createData).then(callback);
        }
    });
}

function updateWeb(req, res) {
    var findby = req.query.findby;
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
            for (var i = 1; i <= lim; i++) {

            }
            res.send(data);
        }
    })
}

module.exports = { update, updateWeb }
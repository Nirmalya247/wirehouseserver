const { Op, Sequelize } = require('sequelize');
var fs = require('fs');
var pdf = require('html-pdf');
const mdb = require('./init');
const user = require('../web/user');

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

function testWeb(req, res) {
    var html = fs.readFileSync('bill_test.html', 'utf8');
    var options = {
        format: 'a4',
        orientation: "landscape"
    };
    pdf.create(html, options).toStream(function (err, stream) {
        stream.pipe(res);
    });
}

function testDB(req, res) {
    mdb.Shop.findOne({ where: { id: 1 } }).then(data => {
        res.send(data);
    })
}

module.exports = { update, testWeb, testDB }
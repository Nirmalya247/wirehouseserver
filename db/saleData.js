const { Op, Sequelize } = require('sequelize');
var fs = require('fs');
var pdf = require('html-pdf');
const mdb = require('./init');
const user = require('../web/user');
const idgen = require('./idgen');

// update sale data async
async function updateAsync(itemsold, itembought, earning, spending, tendered, duedate, accounttype, account, addToTransaction) {
    itemsold = isNaN(Number(itemsold)) ? null : Number(itemsold);
    itembought = isNaN(Number(itembought)) ? null : Number(itembought);
    earning = isNaN(Number(earning)) ? null : Number(earning);
    spending = isNaN(Number(spending)) ? null : Number(spending);

    var today = new Date();
    var data = await mdb.SaleData.findOne({ where: { days: today } });
    var upData;
    if (data) {
        var updateData = {};
        if (itemsold) updateData['itemsold'] = Sequelize.literal('itemsold + ' + itemsold);
        if (itembought) updateData['itembought'] = Sequelize.literal('itembought + ' + itembought);
        if (earning) updateData['earning'] = Sequelize.literal('earning + ' + earning);
        if (spending) updateData['spending'] = Sequelize.literal('spending + ' + spending);
        upData = await mdb.SaleData.update(updateData, { where: { days: today } });
    } else {
        var createData = { days: today };
        createData['itemsold'] = (itemsold ? itemsold : 0);
        createData['itembought'] = (itembought ? itembought : 0);
        createData['earning'] = (earning ? earning : 0);
        createData['spending'] = (spending ? spending : 0);
        upData = await mdb.SaleData.create(createData);
    }
    if (earning && addToTransaction) {
        var tData = await transactionAdd(account, accounttype, 'income', 'short term', earning, tendered, duedate, 'income from ' + account);
        if (Number(earning) > Number(tendered)) await transactionAdd(account, accounttype, 'asset', 'short term', Number(earning) - Number(tendered), Number(earning) - Number(tendered), null, 'income from ' + account);
    } else if (spending && addToTransaction) {
        var tData = await transactionAdd(account, accounttype, 'expense', 'short term', spending, tendered, duedate, 'expense for ' + account);
        if (Number(spending) > Number(tendered)) await transactionAdd(account, accounttype, 'liability', 'short term', Number(spending) - Number(tendered), Number(spending) - Number(tendered), duedate, 'expense for ' + account);
    }
    return upData;
}

// transaction add
async function transactionAdd(account, accounttype, type, duration, amount, tendered, duedate, comment) {
    try {
        var id = await idgen.getIDAsync(idgen.tableID.transaction, 'num', 1, false);
        var data = {
            id: id,
            account: account,
            accounttype: accounttype,
            type: type,
            duration: duration,
            amount: amount,
            tendered: tendered,
            duedate: duedate,
            comment,
            comment
        }
        console.log(duedate, comment, data);
        return await mdb.Transaction.create(data);
    } catch (e) {
        console.log('transactionAdd', e);
    }
}





function testWeb(req, res) {
    var html = fs.readFileSync('bill_test.html', 'utf8');
    var options = {
        format: 'a4',
        orientation: "landscape"
    };
    res.setHeader('Content-Type', 'application/pdf');
    pdf.create(html, options).toStream(function(err, stream) {
        stream.pipe(res);
    });
}

function testDB(req, res) {
    mdb.Shop.findOne({ where: { id: 1 } }).then(data => {
        res.send(data);
    })
}

function testGet(req, res) {
    res.send((req.query.msg ? req.query.msg : 'hi'));
}

function testPost(req, res) {
    res.send((req.body.msg ? req.body.msg : 'hi'));
}

module.exports = { updateAsync, transactionAdd, testWeb, testDB, testGet, testPost }
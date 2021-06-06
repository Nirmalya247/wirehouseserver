const mdb = require('../db/init');
const saleData = require('../db/saleData');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');
const { Parser } = require('json2csv');


function getCSV(req, res) {
    // user.check(req, function (authData) {
        if (true) {
            var wh = {
                order: [[req.query.orderBy, req.query.order]]
            };
            if (req.query.from) {
                wh['where'] = {
                    [Op.and]: [
                        { createdAt: { [Op.lte]: req.query.from } },
                        { createdAt: { [Op.gte]: req.query.to } }
                    ]
                }
            }
            if (req.query.type == 'sales') {
                var fields = ['id', 'totalItem', 'totalQTY', 'totalAmount', 'totalTaxable', 'totalCost', 'totalTendered', 'changeDue', 'creditAmount', 'paymentMode', 'addCredit', 'customerID', 'customerName', 'customerPhone', 'customerEmail', 'userID', 'userName', 'createdAt'];
                wh['attributes'] = fields;
                mdb.Sale.findAll(wh).then(function(data) {
                    if (data) {
                        var fieldsIn = [
                            { label: 'Sale ID', value: 'id' },
                            { label: 'Total Item', value: 'totalItem' },
                            { label: 'Total QTY', value: 'totalQTY' },
                            { label: 'Total Amount', value: 'totalAmount' },
                            { label: 'Total Discount', value: (row) => (row.totalAmount - row.totalTaxable) },
                            { label: 'Total Taxable', value: 'totalTaxable' },
                            { label: 'Total Vat', value: (row) => (row.totalCost - row.totalTaxable) },
                            { label: 'Total Cost', value: 'totalCost' },
                            { label: 'Total Tendered', value: 'totalTendered' },
                            { label: 'Change Due', value: 'changeDue' },
                            { label: 'Credit Amount', value: 'creditAmount' },
                            { label: 'Payment Mode', value: 'paymentMode' },
                            { label: 'Add Credit', value: (row) => (row.addCredit == 0 ? 'no' : 'yes') },
                            { label: 'Customer ID', value: 'customerID' },
                            { label: 'Customer Name', value: 'customerName' },
                            { label: 'customerPhone', value: (row) => row.customerPhone.toString() },
                            { label: 'Customer Email', value: 'customerEmail' },
                            { label: 'User ID', value: 'userID' },
                            { label: 'User Name', value: 'userName' },
                            { label: 'Sale Date', value: (row) => new Date(row.createdAt.toString()).toLocaleString() }
                        ];
                        datas = data.map(function(tData){ return tData.dataValues });
                        var json2csv = new Parser({ fields: fieldsIn });
                        const csv = json2csv.parse(datas)
    
                        res.attachment(`sale_${req.query.from}_${req.query.to}.csv`);
                        res.status(200).send(csv);
                    } else res.send('error');
                }).catch((err) => {
                    console.log(err);
                    res.send('error');
                });
            } else {
                var fields = ['billID', 'totalItem', 'totalQTY', 'totalAmount', 'totalTaxable', 'totalCost', 'totalTendered', 'changeDue', 'dueAmount', 'dueDate', 'paymentMode', 'addDue', 'vendorID', 'vendorFName', 'vendorLName', 'vendorCompany', 'vendorPhone', 'vendorEmail', 'userID', 'userName', 'createdAt'];
                wh['attributes'] = fields;
                mdb.Purchase.findAll(wh).then(function(data) {
                    if (data) {
                        var fieldsIn = [
                            { label: 'Bill ID', value: 'billID' },
                            { label: 'Total Item', value: 'totalItem' },
                            { label: 'Total QTY', value: 'totalQTY' },
                            { label: 'Total Amount', value: 'totalAmount' },
                            { label: 'Total Discount', value: (row) => (row.totalAmount - row.totalTaxable) },
                            { label: 'Total Taxable', value: 'totalTaxable' },
                            { label: 'Total Vat', value: (row) => (row.totalCost - row.totalTaxable) },
                            { label: 'Total Cost', value: 'totalCost' },
                            { label: 'Total Tendered', value: 'totalTendered' },
                            { label: 'Change Due', value: 'changeDue' },
                            { label: 'Due Amount', value: 'dueAmount' },
                            { label: 'Due Date', value: 'dueDate' },
                            { label: 'Payment Mode', value: 'paymentMode' },
                            { label: 'Add Due', value: (row) => (row.addDue == 0 ? 'no' : 'yes') },
                            { label: 'Vendor ID', value: 'vendorID' },
                            { label: 'Vendor First Name', value: 'vendorFName' },
                            { label: 'Vendor Last Name', value: 'vendorLName' },
                            { label: 'Vendor Company', value: 'vendorCompany' },
                            { label: 'Vendor Phone', value: (row) => row.vendorPhone.toString() },
                            { label: 'Vendor Email', value: 'vendorEmail' },
                            { label: 'User ID', value: 'userID' },
                            { label: 'User Name', value: 'userName' },
                            { label: 'Purchase Date', value: (row) => new Date(row.createdAt.toString()).toLocaleString() }
                        ];
                        datas = data.map(function(tData){ return tData.dataValues });
                        var json2csv = new Parser({ fields: fieldsIn });
                        const csv = json2csv.parse(datas)
    
                        res.attachment(`purchase_${req.query.from}_${req.query.to}.csv`);
                        res.status(200).send(csv);
                    } else res.send('error');
                }).catch((err) => {
                    console.log(err);
                    res.send('error');
                });
            }
        } else res.send([]);
    // }, 2);
}

async function getAccount(req, res) {
    try {
        console.log(0);
        var dataAuth = await user.checkAsync(req, 2);
        if (!dataAuth) {
            res.send([ ]);
            return;
        }
        var col = req.body.col;
        var whcol = req.body.whcol;
        var whval = req.body.whval;
        var page = req.body.page;
        var limit = req.body.limit;
        var order = req.body.order;
        var searchText = req.body.searchText;
        console.log(1);
        
        var wh = {
            attributes: [
                [Sequelize.fn('distinct', Sequelize.col(col)), col],
                ...['type', 'accounttype', 'account', 'duration'].filter(a => a != col)
            ],
            offset: (parseInt(page) - 1) * parseInt(limit),
            limit: parseInt(limit),
            order: [[col, order]],
            where: { }
        };
        console.log(2);
        if (whcol) wh.where[whcol] = whval;
        if (searchText && searchText != '') wh.where[col] = { [Op.like]: `%${ searchText }%` };
        console.log(3);
        var data = await mdb.Transaction.findAll(wh);
        console.log(data);
        res.send(data);
    } catch (e) {
        console.log(e);
        res.send([ ]);
    }
}

async function addAccountData(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 2);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var { account, accounttype, type, duration, amount, tendered, duedate, comment } = req.body;
        console.log(account, accounttype, type, duration, amount, tendered, duedate, comment);
        var data = await saleData.transactionAdd(account, accounttype, type, duration, amount, tendered, duedate, comment);
        if (type == 'income') {
            await saleData.updateAsync(0, null, tendered, null, amount, duedate, accounttype, account, false);
        } else if (type == 'expense') {
            await saleData.updateAsync(null, 0, null, tendered, amount, duedate, accounttype, account, false);
        }
        res.send({ msg: 'added', err: false, data: data });
    } catch (e) {
        console.log('addAccountData', e);
        res.send({ msg: 'some error', err: true });
    }
}

async function getReportData(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 2);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var data = {
            saledata: null,
            transactions: null
        };
        var from = new Date(req.body.from);
        var to = new Date(req.body.to);
        console.log(from, to);
        var attributes = [
            [Sequelize.fn('sum', Sequelize.col('itemsold')), 'itemsold'],
            [Sequelize.fn('sum', Sequelize.col('itembought')), 'itembought'],
            [Sequelize.fn('sum', Sequelize.col('earning')), 'earning'],
            [Sequelize.fn('sum', Sequelize.col('spending')), 'spending']
        ];
        var where = {
            [Op.and]: [
                { days: { [Op.lte]: from } },
                { days: { [Op.gte]: to } }
            ]
        }
        data.saledata = await mdb.SaleData.findAll({ attributes: attributes, where: where });

        attributes = [
            'type',
            'accounttype',
            'account',
            [Sequelize.fn('sum', Sequelize.col('amount')), 'amount'],
            [Sequelize.fn('sum', Sequelize.col('tendered')), 'tendered']
        ];
        where = {
            [Op.and]: [
                { createdAt: { [Op.lte]: from } },
                { createdAt: { [Op.gte]: to } }
            ]
        }
        var group = ['type', 'accounttype', 'account'];
        data.transactions = await mdb.Transaction.findAll({
            attributes: attributes,
            group: group,
            where: where
        });

        res.send(data);
    } catch (e) {
        console.log(e);
        res.send({ msg: 'some error', err: true });
    }
}

module.exports = { getCSV, getAccount, addAccountData, getReportData }
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
                    createdAt: { [Op.lte]: req.query.from },
                    createdAt: { [Op.gte]: req.query.to }
                }
            }
            if (req.query.type == 'sales') {
                var fields = ['id', 'totalItem', 'totalQTY', 'totalAmount', 'totalTaxable', 'totalCost', 'totalTendered', 'changeDue', 'creditAmount', 'paymentMode', 'addCredit', 'customerID', 'customerName', 'customerPhone', 'customerEmail', 'userID', 'userName', 'createdAt'];
                wh['attributes'] = fields;
                mdb.Transaction.findAll(wh).then(function(data) {
                    if (data) {
                        var fieldsIn = [
                            { label: 'Transaction ID', value: 'id' },
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
                            { label: 'Transaction Date', value: (row) => new Date(row.createdAt.toString()).toLocaleString() }
                        ];
                        datas = data.map(function(tData){ return tData.dataValues });
                        var json2csv = new Parser({ fields: fieldsIn });
                        const csv = json2csv.parse(datas)
    
                        res.attachment(`transaction_${req.query.from}_${req.query.to}.csv`);
                        res.status(200).send(csv);
                    } else res.send('error');
                }).catch((err) => {
                    console.log(err);
                    res.send('error');
                });
            } else {
                var fields = ['billID', 'totalItem', 'totalQTY', 'totalAmount', 'totalTaxable', 'totalCost', 'totalTendered', 'changeDue', 'creditAmount', 'paymentMode', 'addCredit', 'salesmanID', 'salesmanName', 'salesmanPhone', 'salesmanEmail', 'userID', 'userName', 'createdAt'];
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
                            { label: 'Credit Amount', value: 'creditAmount' },
                            { label: 'Payment Mode', value: 'paymentMode' },
                            { label: 'Add Credit', value: (row) => (row.addCredit == 0 ? 'no' : 'yes') },
                            { label: 'Salesman ID', value: 'salesmanID' },
                            { label: 'Salesman Name', value: 'salesmanName' },
                            { label: 'SalesmanPhone', value: (row) => row.salesmanPhone.toString() },
                            { label: 'Salesman Email', value: 'salesmanEmail' },
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

module.exports = { getCSV }
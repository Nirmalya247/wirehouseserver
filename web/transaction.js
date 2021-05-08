const mdb = require('../db/init');
const saleData = require('../db/saleData');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');

function add(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var data = req.body;
            var items = data.items;
            var customerCredit = data.customerCredit;
            delete data.items;
            delete data['SESSION_ID'];
            delete data['SESSION_USERID'];
            delete data['customerCredit'];

            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1;
            var yyyy = today.getYear();
            if (dd < 10) dd = '0' + dd;
            if (mm < 10) mm = '0' + mm;
            var idTemp = yyyy + mm + dd;
            var errorCount = 0;
            insertTransaction();
            function insertTransaction() {
                errorCount++;
                var id = idTemp + user.makeid(6);
                data['id'] = id;
                console.log('***********' + JSON.stringify(data));

                mdb.Transaction.create(data).then(transaction => {
                    if (transaction) {
                        console.log(transaction);
                        var i = 0;
                        insertItems();
                        console.log('***********' + JSON.stringify(items));
                        function insertItems() {
                            function removeTransaction() {
                                mdb.Transaction.destroy({ where: { id: id }}).then(del => {
                                    mdb.TransactionItem.destroy({ where: { transactionId: id }}).then(del => {
                                        res.send({ msg: 'some error and deleted', err: true });
                                    }).catch(err => {
                                        res.send({ msg: 'some error', err: true });
                                    });
                                }).catch(err => {
                                    res.send({ msg: 'some error', err: true });
                                });
                            }
                            items[i]['id'] = id + (i + 1);
                            items[i]['transactionId'] = id;
                            transactionItemUpdate(items[i].itemcode, items[i].qty, itemUpExpiry => {
                                items[i]['expiry'] = itemUpExpiry.expiry;
                                console.log('@@@@@@@@@@@', items[i], itemUpExpiry);
                                mdb.TransactionItem.create(items[i]).then(item => {
                                    if (item) {
                                        function afterItemUpdate() {
                                            i++;
                                            if (i < items.length) {
                                                insertItems();
                                            }
                                            else {
                                                saleData.update(data.totalQTY, null, data.totalAmount, null, dayData => {
                                                    if (data.creditAmount > 0 || data.addCredit == 1) {
                                                        var cred = (data.addCredit == 1) ? data.creditAmount : (data.creditAmount + customerCredit);
                                                        //console.log
                                                        mdb.Customer.update({ credit: cred }, { where: { id: data.customerID } }).then(function(uData) {
                                                            if (uData) {
                                                                res.send({ msg: 'done!', err: false, id: id });
                                                            } else removeTransaction();
                                                            console.log(data);
                                                        }).catch((err) => {
                                                            removeTransaction();
                                                        });
                                                    } else {
                                                        res.send({ msg: 'done!', err: false, id: id });
                                                    }
                                                });
                                            }
                                        }
                                        if (items[i].itemname != 'credit amount') {
                                            //console.log('###########' + items[i].qty);
                                            mdb.Item.update(
                                                {
                                                    qty: Sequelize.literal('qty - ' + items[i].qty),
                                                    totalsold: Sequelize.literal('totalsold + ' + items[i].qty),
                                                    totalearned: Sequelize.literal('totalearned + ' + items[i].totalPrice)
                                                }, { where: { itemcode: items[i].itemcode }}).then( itemUp => {
                                                    afterItemUpdate();
                                                });
                                        } else afterItemUpdate();
                                    } else {
                                        removeTransaction();
                                    }
                                }).catch(err => {
                                    console.log(err);
                                    removeTransaction();
                                });
                            });
                        }
                    } else {
                        if (errorCount < 6) insertTransaction();
                        else {
                            console.log(err);
                            res.send({ msg: 'some error 2', err: true });
                        }
                    }
                }).catch(err => {
                    console.log(err);
                    if (errorCount < 6) insertTransaction(); else {
                        res.send({ msg: 'some error 1', err: true });
                    }
                });
            }
        } else res.send({ msg: 'some error', err: true });
    }, 1);
}

// get transactions
function getTransactions(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var wh = {
                offset: (parseInt(req.body.transactionPage) - 1) * parseInt(req.body.transactionLimit),
                limit: parseInt(req.body.transactionLimit),
                order: [[req.body.transactionOrderBy, req.body.transactionOrder]]
            };
            if (req.body.transactionSearchText && req.body.transactionSearchText != '') {
                wh['where'] = { [Op.or]: [
                    {id: { [Op.like]: `%${req.body.transactionSearchText}%` } },
                    {customerName: { [Op.like]: `%${req.body.transactionSearchText}%` } },
                    {customerID: { [Op.like]: `%${req.body.transactionSearchText}%` } },
                    {userID: { [Op.like]: `%${req.body.transactionSearchText}%` } },
                    {userName: { [Op.like]: `%${req.body.transactionSearchText}%` } }
                ] }
            }
            mdb.Transaction.findAll(wh).then(function(data) {
                if (data) {
                    res.send(data);
                } else res.send([]);
            }).catch((err) => {
                console.log(err);
                res.send([]);
            });
        } else res.send([]);
    }, 1);
}

// get transactions count
function getTransactionsCount(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var wh = { };
            if (req.body.transactionSearchText && req.body.transactionSearchText != '') {
                wh['where'] = { [Op.or]: [
                    {id: { [Op.like]: `%${req.body.transactionSearchText}%` } },
                    {customerName: { [Op.like]: `%${req.body.transactionSearchText}%` } },
                    {customerID: { [Op.like]: `%${req.body.transactionSearchText}%` } },
                    {userID: { [Op.like]: `%${req.body.transactionSearchText}%` } },
                    {userName: { [Op.like]: `%${req.body.transactionSearchText}%` } }
                ] }
            }
            mdb.Transaction.count(wh).then(function(data) {
                if (data) {
                    res.send(data.toString());
                } else res.send('0');
            }).catch((err) => {
                console.log(err);
                res.send('0');
            });
        } else res.send('0');
    }, 1);
}

// get transaction item which has less expiry
function getTransactionItem(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1;
            var yyyy = today.getFullYear();
            if (dd < 10) dd = '0' + dd;
            if (mm < 10) mm = '0' + mm;
            today = yyyy + '-' + mm + '-' + dd;

            var wh = { };
            if (req.body.batchID) {
                wh = {
                    id: req.body.batchID,
                    qtystock: { [Op.gt]: 0 },
                    expiry: { [Op.gt]: today }
                }
            } else {
                wh = {
                    itemcode: itemcode,
                    qtystock: { [Op.gt]: 0 },
                    expiry: { [Op.gt]: today }
                }
            }
            mdb.ItemUpdate.findAll({
                where: wh,
                order: [['expiry', 'asc']]
            }).then(data => {
                res.send(data);
            });
        } else res.send([ ]);
    }, 1);
}

// transaction item update
function transactionItemUpdate(itemcode, qty, callback) {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    today = yyyy + '-' + mm + '-' + dd;
    mdb.ItemUpdate.findAll({
        where: {
            itemcode: itemcode,
            qtystock: { [Op.gt]: 0 },
            expiry: { [Op.gt]: today }
        },
        order: [['expiry', 'asc']]
    }).then(data => {
        // console.log(data);
        var i = 0;
        if (data.length > 0) {
            while (qty > 0) {
                if (data[i].qtystock >= qty) {
                    data[i].qtystock -= qty;
                    qty = 0;
                    data[i].save();
                } else {
                    qty -= data[i].qtystock;
                    data[i].qtystock = 0;
                    data[i].save();
                }
                i++;
            }
            callback({ err: false, expiry: data[0].expiry });
        } else callback({ err: true, expiry: null });
    });
}

module.exports = { add, getTransactions, getTransactionsCount, getTransactionItem, transactionItemUpdate }
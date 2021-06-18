const mdb = require('../db/init');
const saleData = require('../db/saleData');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');
const idgen = require('../db/idgen');

async function add(req, res) {
    var id = null;
    var itemIDs = null;
    try {
        var dataAuth = await user.checkAsync(req, 1);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var data = req.body;
        var items = data.items;
        var vendorDue = data.vendorDue;
        delete data.items;
        delete data['SESSION_ID'];
        delete data['SESSION_USERID'];
        delete data['vendorDue'];
        id = await idgen.getIDAsync(idgen.tableID.purchase, 'num', 1, false);
        itemIDs = await idgen.getIDAsync(idgen.tableID.itemupdate, 'num', items.length, true);
        data['id'] = id;
        console.log(data);
        var purchase = await mdb.Purchase.create(data);
        if (purchase) {
            for (var i = 0; i < items.length; i++) {
                items[i]['id'] = itemIDs[i];
                items[i]['purchaseId'] = id;
                var item = await mdb.ItemUpdate.create(items[i]);
                if (item) {
                    if (items[i].itemname != 'due amount') {
                        var itemUp = await mdb.Item.update({ qty: Sequelize.literal('qty + ' + items[i].qty) }, { where: { itemcode: items[i].itemcode } });
                    }
                } else {
                    throw 'items';
                }
            }

            dayData = await saleData.updateAsync(null, data.totalQTY, null, data.totalCost, Number(data.totalCost) - Number(data.dueAmount), data.dueDate, 'products', 'purchase', true);
            if (data.dueAmount > 0 || data.addDue == 1) {
                var du = (data.addDue == 1) ? data.dueAmount : (Number(data.dueAmount) + Number(vendorDue));
                var uData = await mdb.Vendor.update({ due: du }, { where: { id: data.vendorID } });
                if (!uData) throw 'after up';
            }
            res.send({ msg: 'done!', err: false, id: id });
        } else throw 'sale';
    } catch (e) {
        console.log(e);
        await mdb.Purchase.destroy({ where: { id: id } })
        await mdb.ItemUpdate.destroy({ where: { purchaseId: id } })
        res.send({ msg: 'some error and deleted', err: true });
    }
}

/*
function add(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var data = req.body;
            var items = data.items;
            var vendorDue = data.vendorDue;
            delete data.items;
            delete data['SESSION_ID'];
            delete data['SESSION_USERID'];
            delete data['vendorDue'];

            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1;
            var yyyy = today.getYear();
            if (dd < 10) dd = '0' + dd;
            if (mm < 10) mm = '0' + mm;
            // var idTemp = yyyy + mm + dd;
            var errorCount = 0;
            insertPurchase();

            function insertPurchase() {
                errorCount++;
                idgen.getID(idgen.tableID.purchase, 'num', 1, false, id => {
                    idgen.getID(idgen.tableID.itemupdate, 'num', items.length, true, itemIDs => {
                        data['id'] = id;
                        console.log('***********' + JSON.stringify(data));

                        mdb.Purchase.create(data).then(purchase => {
                            if (purchase) {
                                console.log(purchase);
                                var i = 0;
                                insertItems();
                                console.log('***********' + JSON.stringify(items));
                                function insertItems() {
                                    function removePurchase() {
                                        mdb.Purchase.destroy({ where: { id: id } }).then(del => {
                                            mdb.ItemUpdate.destroy({ where: { purchaseId: id } }).then(del => {
                                                res.send({ msg: 'some error and deleted', err: true });
                                            }).catch(err => {
                                                res.send({ msg: 'some error', err: true });
                                            });
                                        }).catch(err => {
                                            res.send({ msg: 'some error', err: true });
                                        });
                                    }
                                    // items[i]['id'] = id + (i + 1);
                                    items[i]['purchaseId'] = id;
                                    items[i]['id'] = itemIDs[i];
                                    console.log('@@@@@@@@@@@', items[i]);
                                    mdb.ItemUpdate.create(items[i]).then(item => {
                                        if (item) {
                                            function afterItemUpdate() {
                                                i++;
                                                if (i < items.length) {
                                                    insertItems();
                                                }
                                                else {
                                                    saleData.update(null, data.totalQTY, null, data.totalCost, dayData => {
                                                        if (data.dueAmount > 0 || data.addDue == 1) {
                                                            var du = (data.addDue == 1) ? data.dueAmount : (data.dueAmount + vendorDue);
                                                            //console.log
                                                            mdb.Vendor.update({ due: du }, { where: { id: data.vendorID } }).then(function (uData) {
                                                                if (uData) {
                                                                    res.send({ msg: 'done!', err: false, id: id });
                                                                } else removePurchase();
                                                                console.log(data);
                                                            }).catch((err) => {
                                                                removePurchase();
                                                            });
                                                        } else {
                                                            res.send({ msg: 'done!', err: false, id: id });
                                                        }
                                                    });
                                                }
                                            }
                                            if (items[i].itemname != 'due amount') {
                                                //console.log('###########' + items[i].qty);
                                                mdb.Item.update(
                                                    {
                                                        qty: Sequelize.literal('qty + ' + items[i].qty)
                                                    }, { where: { itemcode: items[i].itemcode } }).then(itemUp => {
                                                        afterItemUpdate();
                                                    });
                                            } else afterItemUpdate();
                                        } else {
                                            removePurchase();
                                        }
                                    }).catch(err => {
                                        console.log(err);
                                        removePurchase();
                                    });
                                }
                            } else {
                                if (errorCount < 6) insertPurchase();
                                else {
                                    console.log(err);
                                    res.send({ msg: 'some error 2', err: true });
                                }
                            }
                        }).catch(err => {
                            console.log(err);
                            if (errorCount < 6) insertPurchase(); else {
                                res.send({ msg: 'some error 1', err: true });
                            }
                        });
                    });
                });
            }
        } else res.send({ msg: 'some error', err: true });
    }, 1);
}
*/

// get purchases
function getPurchases(req, res) {
    user.check(req, function(authData) {
        if (authData) {
            var wh = {
                offset: (parseInt(req.body.purchasePage) - 1) * parseInt(req.body.purchaseLimit),
                limit: parseInt(req.body.purchaseLimit),
                order: [
                    [req.body.purchaseOrderBy, req.body.purchaseOrder]
                ]
            };
            if (req.body.purchaseSearchText && req.body.purchaseSearchText != '') {
                wh['where'] = {
                    [Op.or]: [{
                            id: {
                                [Op.like]: `%${req.body.purchaseSearchText}%`
                            }
                        },
                        {
                            billID: {
                                [Op.like]: `%${req.body.purchaseSearchText}%`
                            }
                        },
                        {
                            vendorFName: {
                                [Op.like]: `%${req.body.purchaseSearchText}%`
                            }
                        },
                        {
                            vendorLName: {
                                [Op.like]: `%${req.body.purchaseSearchText}%`
                            }
                        },
                        {
                            vendorCompany: {
                                [Op.like]: `%${req.body.purchaseSearchText}%`
                            }
                        },
                        {
                            vendorID: {
                                [Op.like]: `%${req.body.purchaseSearchText}%`
                            }
                        },
                        {
                            userID: {
                                [Op.like]: `%${req.body.purchaseSearchText}%`
                            }
                        },
                        {
                            userName: {
                                [Op.like]: `%${req.body.purchaseSearchText}%`
                            }
                        }
                    ]
                }
            }
            if (req.body.from && req.body.to && wh['where'] == null) {
                wh['where'] = {
                    [Op.and]: [{
                            createdAt: {
                                [Op.lte]: req.body.from
                            }
                        },
                        {
                            createdAt: {
                                [Op.gte]: req.body.to
                            }
                        }
                    ]
                }
            }
            mdb.Purchase.findAll(wh).then(function(data) {
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

// get purchases count
function getPurchasesCount(req, res) {
    user.check(req, function(authData) {
        if (authData) {
            var wh = {};
            if (req.body.purchaseSearchText && req.body.purchaseSearchText != '') {
                wh['where'] = {
                    [Op.or]: [{
                            id: {
                                [Op.like]: `%${req.body.purchaseSearchText}%`
                            }
                        },
                        {
                            billID: {
                                [Op.like]: `%${req.body.purchaseSearchText}%`
                            }
                        },
                        {
                            vendorName: {
                                [Op.like]: `%${req.body.purchaseSearchText}%`
                            }
                        },
                        {
                            vendorID: {
                                [Op.like]: `%${req.body.purchaseSearchText}%`
                            }
                        },
                        {
                            userID: {
                                [Op.like]: `%${req.body.purchaseSearchText}%`
                            }
                        },
                        {
                            userName: {
                                [Op.like]: `%${req.body.purchaseSearchText}%`
                            }
                        }
                    ]
                }
            }
            if (req.body.from && req.body.to && wh['where'] == null) {
                wh['where'] = {
                    createdAt: {
                        [Op.lte]: req.body.from
                    },
                    createdAt: {
                        [Op.gte]: req.body.to
                    }
                }
            }
            mdb.Purchase.count(wh).then(function(data) {
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

// remove due by purchase
async function removeDueByPurchase(req, res) {
    var purchaseId = req.body.id;
    try {
        var dataAuth = await user.checkAsync(req, 1);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var amount;
        upData = await mdb.Purchase.findOne({ where: { id: purchaseId } });
        amount = upData.dueAmount;
        upData.totalTendered = Number(upData.totalTendered) + Number(upData.dueAmount);
        upData.dueAmount = 0;
        upData.dueDate = null;

        upDataVendor = await mdb.Vendor.findOne({ where: { id: upData.vendorID } });
        upDataVendor.due = Number(upDataVendor.due) - Number(amount);

        await upData.save();
        await upDataVendor.save();

        await saleData.transactionAdd('purchase', 'products', 'expense', 'short term', amount, amount, null, 'due expense for purchase');

        await saleData.transactionAdd('purchase', 'products', 'liability', 'short term', -amount, -amount, null, 'due expense for purchase');
        res.send({ err: false, msg: 'done!' });
    } catch (e) {
        console.log(e);
        res.send({ err: true, msg: 'some error' });
    }
}

// remove due by vendor
async function removeDueByVendor(req, res) {
    var vendorId = req.body.id;
    var amount = req.body.amount;
    try {
        var dataAuth = await user.checkAsync(req, 2);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var dueAmount = 0;
        upDataVendor = await mdb.Vendor.findOne({ where: { id: vendorId } });
        if (amount == null) {
            dueAmount = upDataVendor.due;
            upDataVendor.due = 0;
        } else {
            upDataVendor.due -= Number(amount);
            upDataVendor.due = Number(amount);
        }
        upDataVendor.save();

        await saleData.transactionAdd('return', 'products', 'income', 'short term', amount, amount, null, 'income from return');
        res.send({ err: false, msg: 'done!' });
    } catch (e) {
        console.log(e);
        res.send({ err: true, msg: 'some error' });
    }
}


module.exports = { add, getPurchases, getPurchasesCount, removeDueByPurchase }
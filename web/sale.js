const mdb = require('../db/init');
const saleData = require('../db/saleData');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');
const idgen = require('../db/idgen');

async function add(req, res) {
    var id = null;
    var itemIDs = null;
    try {
        var dataAuth = await user.checkAsync(req, 2);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var data = req.body;
        var items = data.items;
        var customerCredit = data.customerCredit;
        var cumulativeAmount = data.totalCost;
        delete data.items;
        delete data['SESSION_ID'];
        delete data['SESSION_USERID'];
        id = await idgen.getIDAsync(idgen.tableID.sales, 'num', 1, false);
        itemIDs = await idgen.getIDAsync(idgen.tableID.salesitem, 'num', items.length, true);
        data['id'] = id;

        var sale = await mdb.Sale.create(data);
        if (sale) {
            for (var i = 0; i < items.length; i++) {
                items[i]['id'] = itemIDs[i];
                items[i]['saleId'] = id;
                var itemUpExpiry = await mdb.ItemUpdate.update({ qtystock: Sequelize.literal('qtystock - ' + items[i].qty) }, { where: { id: items[i].stockid } });
                var item = await mdb.SaleItem.create(items[i]);

                if (item) {
                    if (items[i].itemname != 'credit amount') {
                        var itemUp = await mdb.Item.update({
                            qty: Sequelize.literal('qty - ' + items[i].qty),
                            totalsold: Sequelize.literal('totalsold + ' + items[i].qty),
                            totalearned: Sequelize.literal('totalearned + ' + items[i].totalPrice)
                        }, { where: { itemcode: items[i].itemcode } });
                    }
                } else {
                    throw 'items';
                }
            }
            dayData = await saleData.updateAsync(data.totalQTY, null, data.totalTaxable, null);
            var customerUp = {
                qty: Sequelize.literal('qty + ' + data.totalQTY),
                amount: Sequelize.literal('amount + ' + cumulativeAmount),
                count: Sequelize.literal('count + ' + 1)
            };
            if (data.creditAmount > 0 || data.addCredit == 1) {
                customerUp['credit'] = (data.addCredit == 1) ? data.creditAmount : (data.creditAmount + customerCredit);
            }
            var uData = await mdb.Customer.update(customerUp, { where: { id: data.customerID } });
            if (uData) {
                res.send({ msg: 'done!', err: false, id: id });
            } else throw 'after up';
        } else throw 'sale';
    } catch (e) {
        await mdb.Sale.destroy({ where: { id: id } })
        await mdb.SaleItem.destroy({ where: { saleId: id } })
        res.send({ msg: 'some error and deleted', err: true });
    }
}

/*
function add(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var data = req.body;
            var items = data.items;
            var customerCredit = data.customerCredit;
            var cumulativeAmount = data.totalCost;
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
            insertSale();

            function insertSale() {
                errorCount++;
                idgen.getID(idgen.tableID.sales, 'num', 1, false, id => {
                    idgen.getID(idgen.tableID.salesitem, 'num', items.length, true, itemIDs => {
                        data['id'] = id;
                        console.log('***********' + JSON.stringify(data));
        
                        mdb.Sale.create(data).then(sale => {
                            if (sale) {
                                console.log(sale);
                                var i = 0;
                                insertItems();
                                console.log('***********' + JSON.stringify(items));
                                function insertItems() {
                                    function removeSale() {
                                        mdb.Sale.destroy({ where: { id: id }}).then(del => {
                                            mdb.SaleItem.destroy({ where: { saleId: id }}).then(del => {
                                                res.send({ msg: 'some error and deleted', err: true });
                                            }).catch(err => {
                                                res.send({ msg: 'some error', err: true });
                                            });
                                        }).catch(err => {
                                            res.send({ msg: 'some error', err: true });
                                        });
                                    }
                                    items[i]['id'] = itemIDs[i];
                                    items[i]['saleId'] = id;
                                    mdb.ItemUpdate.update({ qtystock: Sequelize.literal('qtystock - ' + items[i].qty) }, { where: { id: items[i].stockid } } ).then(itemUpExpiry => {
                                        console.log('@@@@@@@@@@@', items[i], itemUpExpiry);
                                        mdb.SaleItem.create(items[i]).then(item => {
                                            if (item) {
                                                function afterItemUpdate() {
                                                    i++;
                                                    if (i < items.length) {
                                                        insertItems();
                                                    }
                                                    else {
                                                        saleData.update(data.totalQTY, null, data.totalTaxable, null, dayData => {
                                                            var customerUp = {
                                                                qty: Sequelize.literal('qty + ' + data.totalQTY),
                                                                amount: Sequelize.literal('amount + ' + cumulativeAmount),
                                                                count: Sequelize.literal('count + ' + 1)
                                                            };
                                                            if (data.creditAmount > 0 || data.addCredit == 1) {
                                                                customerUp['credit'] = (data.addCredit == 1) ? data.creditAmount : (data.creditAmount + customerCredit);
                                                            }
                                                            mdb.Customer.update(customerUp, { where: { id: data.customerID } }).then(function(uData) {
                                                                if (uData) {
                                                                    res.send({ msg: 'done!', err: false, id: id });
                                                                } else removeSale();
                                                                console.log(data);
                                                            }).catch((err) => {
                                                                removeSale();
                                                            });
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
                                                removeSale();
                                            }
                                        }).catch(err => {
                                            console.log(err);
                                            removeSale();
                                        });
                                    });
                                }
                            } else {
                                if (errorCount < 6) insertSale();
                                else {
                                    console.log(err);
                                    res.send({ msg: 'some error 2', err: true });
                                }
                            }
                    })
                })
                }).catch(err => {
                    console.log(err);
                    if (errorCount < 6) insertSale(); else {
                        res.send({ msg: 'some error 1', err: true });
                    }
                });
            }
        } else res.send({ msg: 'some error', err: true });
    }, 1);
}
*/

// get sales
function getSales(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var wh = {
                offset: (parseInt(req.body.salePage) - 1) * parseInt(req.body.saleLimit),
                limit: parseInt(req.body.saleLimit),
                order: [[req.body.saleOrderBy, req.body.saleOrder]]
            };
            if (req.body.saleSearchText && req.body.saleSearchText != '') {
                wh['where'] = { [Op.or]: [
                    {id: { [Op.like]: `%${req.body.saleSearchText}%` } },
                    {customerName: { [Op.like]: `%${req.body.saleSearchText}%` } },
                    {customerID: { [Op.like]: `%${req.body.saleSearchText}%` } },
                    {userID: { [Op.like]: `%${req.body.saleSearchText}%` } },
                    {userName: { [Op.like]: `%${req.body.saleSearchText}%` } }
                ] }
            }
            if (req.body.from && req.body.to && wh['where'] == null) {
                wh['where'] = {
                    createdAt: { [Op.lte]: req.body.from },
                    createdAt: { [Op.gte]: req.body.to }
                }
            }
            mdb.Sale.findAll(wh).then(function(data) {
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

// get sales count
function getSalesCount(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var wh = { };
            if (req.body.saleSearchText && req.body.saleSearchText != '') {
                wh['where'] = { [Op.or]: [
                    {id: { [Op.like]: `%${req.body.saleSearchText}%` } },
                    {customerName: { [Op.like]: `%${req.body.saleSearchText}%` } },
                    {customerID: { [Op.like]: `%${req.body.saleSearchText}%` } },
                    {userID: { [Op.like]: `%${req.body.saleSearchText}%` } },
                    {userName: { [Op.like]: `%${req.body.saleSearchText}%` } }
                ] }
            }
            if (req.body.from && req.body.to && wh['where'] == null) {
                wh['where'] = {
                    createdAt: { [Op.lte]: req.body.from },
                    createdAt: { [Op.gte]: req.body.to }
                }
            }
            mdb.Sale.count(wh).then(function(data) {
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

// get sale item which has less expiry
function getSaleItem(req, res) {
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
                    itemcode: req.body.itemcode,
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

// get last sale item
function getLastSaleItem(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1;
            var yyyy = today.getFullYear();
            if (dd < 10) dd = '0' + dd;
            if (mm < 10) mm = '0' + mm;
            today = yyyy + '-' + mm + '-' + dd;

            var wh = {
                itemcode: req.body.itemcode,
                qtystock: { [Op.gt]: 0 },
                expiry: { [Op.gt]: today }
            };
            mdb.ItemUpdate.findOne({
                where: wh,
                order: [['createdAt', 'desc']]
            }).then(data => {
                if (data) {
                    data['err'] = false;
                    res.send(data);
                } else res.send({ err: true });
                
            });
        } else res.send({ err: true });
    }, 1);
}

// sale item update
function saleItemUpdate(itemcode, qty, callback) {
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

// get sale item by stock
function getSaleItemByStock(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var stockid = req.body.stockid;
            mdb.ItemUpdate.findOne({ where: { id: stockid } }).then(resItemUpdate => {
                if (resItemUpdate) {
                    mdb.Item.findOne({ where: { itemcode: resItemUpdate.itemcode } }).then(resItem => {
                        if (resItem) {
                            res.send({
                                itemUpdate: resItemUpdate,
                                item: resItem,
                                msg: 'got data',
                                err: false
                            });
                        } else res.send({ msg: 'no item', err: true });
                    });
                } else res.send({ msg: 'no stock', err: true });
            });
        } else res.send({ msg: 'not permitted', err: true });
    }, 1);
}

module.exports = { add, getSales, getSalesCount, getSaleItem, saleItemUpdate, getSaleItemByStock, getLastSaleItem }
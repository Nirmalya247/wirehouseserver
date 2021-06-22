const mdb = require('../db/init');
const saleData = require('../db/saleData');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');


function addItem(req, res) {
    user.check(req, function(data3) {
        if (data3) {
            var it = req.body;
            delete it['SESSION_ID'];
            delete it['SESSION_USERID'];
            it['qty'] = 0;
            it['totalsold'] = 0;
            it['totalearned'] = 0;
            if (Number(it['itemtypeid']) == 0) {
                mdb.ItemType.create({ itemtypename: it['itemtypename'] }).then(itemtype => {
                    it['itemtypeid'] = itemtype.id;
                    createItem(it);
                })
            } else {
                createItem(it);
            }

            function createItem(item) {
                mdb.Item.create(item).then(function(data) {
                    if (data) {
                        res.send({ msg: 'item added', err: false });
                    } else res.send({ msg: 'some error', err: true });
                }).catch((err) => {
                    res.send({ msg: 'same item code or some error', err: true });
                });
            }
        } else res.send({ msg: 'you have no permit', err: true });
    }, 2);
}

// get items for inventory and sales
function getItems(req, res) {
    user.check(req, function(authData) {
        if (authData) {
            var wh = {
                offset: (parseInt(req.body.itemPage) - 1) * parseInt(req.body.itemLimit),
                limit: parseInt(req.body.itemLimit),
                order: [
                    [req.body.itemOrderBy, req.body.itemOrder]
                ]
            };
            if (req.body.itemSearch && req.body.itemSearch != '') {
                wh['where'] = {
                    [Op.or]: [{
                        itemcode: {
                            [Op.like]: `%${req.body.itemSearch}%`
                        }
                    }, {
                        itemname: {
                            [Op.like]: `%${req.body.itemSearch}%`
                        }
                    }]
                }
            }
            mdb.Item.findAll(wh).then(function(data) {
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

// get items count for inventory
function getItemsCount(req, res) {
    user.check(req, function(authData) {
        if (authData) {
            var wh = {};
            if (req.body.itemSearch && req.body.itemSearch != '') {
                wh['where'] = {
                    [Op.or]: [{
                        itemcode: {
                            [Op.like]: `%${req.body.itemSearch}%`
                        }
                    }, {
                        itemname: {
                            [Op.like]: `%${req.body.itemSearch}%`
                        }
                    }]
                };
            }
            mdb.Item.count(wh).then(function(data) {
                console.log('ok1');
                if (data) {
                    console.log(data);
                    res.send(data.toString());
                } else res.send('0');
            }).catch((err) => {
                console.log(err);
                res.send('0');
            });
        } else res.send('0');
    }, 1);
}

// get items for barcode scan
function getItemsScan(req, res) {
    user.check(req, function(authData) {
        if (authData && req.body.code && req.body.code.length >= 2) {
            var wh = {
                where: {
                    [Op.or]: [{ itemcode: req.body.code }, { id: req.body.code }]
                }
            };
            mdb.ItemUpdate.findOne(wh).then(function(data) {
                if (data) {
                    res.send({ err: false, msg: 'item found', itemcode: data.itemcode, item: data });
                } else res.send({ err: true, msg: 'not found', itemcode: 0 });
            }).catch((err) => {
                console.log(err);
                res.send({ err: true, msg: 'not found', itemcode: 0 });
            });
        } else res.send({ err: true, msg: 'not found', itemcode: 0 });
    }, 1);
}

// edit item
function edit(req, res) {
    user.check(req, function(dataAuth) {
        if (dataAuth) {
            var dataItem = req.body;
            var itemcode = dataItem.oldcode;
            delete dataItem['SESSION_ID'];
            delete dataItem['SESSION_USERID'];
            delete dataItem['oldcode'];
            mdb.Item.update(dataItem, { where: { itemcode: itemcode } }).then((data) => {
                if (data != null) {
                    res.send({ msg: 'item edited', err: false });
                } else {
                    res.send({ msg: 'could not edit', err: true });
                }
            }).catch(err => {
                res.send({ msg: 'some error (may be duplicate code)', err: true });
            });
        } else {
            res.send({ msg: 'not permitted', err: true });
        }
    }, 2);
}

// update item
async function update(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 2);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var dataItem = req.body;
        var data = await mdb.Item.update({ qty: Sequelize.literal('qty' + (dataItem.type == 'add' ? ' + ' : ' - ') + dataItem.qty) }, { where: { itemcode: dataItem.itemcode } });
        if (data != null) {
            var dataItemUpdate = {
                itemcode: dataItem.itemcode,
                itemname: dataItem.itemname,
                rack: dataItem.rack,
                qty: dataItem.qty,
                qtystock: (dataItem.type == 'add' ? dataItem.qty : 0),
                price: dataItem.price,
                cost: dataItem.cost,
                expiry: dataItem.expiry,
                dealername: dataItem.dealername,
                dealerphone: dataItem.dealerphone,
                description: dataItem.description
            }
            if (dataItem.type == 'add') {
                dataItemUpdate['dealername'] = dataItem.dealername;
                dataItemUpdate['dealerphone'] = dataItem.dealerphone;
            }
            var data2 = await mdb.ItemUpdate.create(dataItemUpdate);
            if (dataItem.type == 'add') {
                var dayData = await saleData.updateAsync(null, dataItem.qty, null, Number(dataItem.cost) * Number(dataItem.qty), Number(dataItem.cost) * Number(dataItem.qty), null, 'products', 'purchase', true);
                if (dayData != null) {
                    res.send({ msg: 'item updated', err: false });
                } else {
                    res.send({ msg: 'some error', err: true });
                }
            } else {
                if (data2 != null) {
                    res.send({ msg: 'item updated', err: false });
                } else {
                    res.send({ msg: 'some error', err: true });
                }
            }
        } else res.send({ msg: 'some error', err: true });
    } catch (e) {
        res.send({ msg: 'some error', err: true });
    }
}

/*
function update(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var dataItem = req.body;
            mdb.Item.update({ qty: Sequelize.literal('qty' + (dataItem.type == 'add' ? ' + ' : ' - ') + dataItem.qty) }, { where: { itemcode: dataItem.itemcode } }).then((data) => {
                if (data != null) {
                    var dataItemUpdate = {
                        itemcode: dataItem.itemcode,
                        itemname: dataItem.itemname,
                        rack: dataItem.rack,
                        qty: dataItem.qty,
                        qtystock: (dataItem.type == 'add' ? dataItem.qty : 0),
                        price: dataItem.price,
                        cost: dataItem.cost,
                        expiry: dataItem.expiry,
                        dealername: dataItem.dealername,
                        dealerphone: dataItem.dealerphone,
                        description: dataItem.description
                    }
                    if (dataItem.type == 'add') {
                        dataItemUpdate['dealername'] = dataItem.dealername;
                        dataItemUpdate['dealerphone'] = dataItem.dealerphone;
                    }
                    mdb.ItemUpdate.create(dataItemUpdate).then(data2 => {
                        if (dataItem.type == 'add') {
                            saleData.update(null, dataItem.qty, null, Number(dataItem.cost) * Number(dataItem.qty), dayData => {
                                if (dayData != null) {
                                    res.send({ msg: 'item updated', err: false });
                                } else {
                                    res.send({ msg: 'some error', err: true });
                                }
                            })
                        } else {
                            if (data2 != null) {
                                res.send({ msg: 'item updated', err: false });
                            } else {
                                res.send({ msg: 'some error', err: true });
                            }
                        }
                    })
                } else {
                    res.send({ msg: 'some error', err: true });
                }
            });
        }
        else {
            res.send({ msg: 'not permitted', err: true });
        }
    }, 2);
}
*/

// delete item
function deleteItem(req, res) {
    user.check(req, function(dataAuth) {
        if (dataAuth) {
            var dataItem = req.body;
            var itemcode = dataItem.itemcode;
            mdb.Item.destroy({ where: { itemcode: itemcode } }).then((data) => {
                res.send({ msg: 'item deleted', err: false });
            }).catch(err => {
                res.send({ msg: 'some error', err: true });
            });
        } else {
            res.send({ msg: 'not permitted', err: true });
        }
    }, 2);
}

// get item types
function getItemTypes(req, res) {
    user.check(req, function(dataAuth) {
        if (dataAuth) {
            var search = req.body.itemTypeSearch;
            mdb.ItemType.findAll({
                where: {
                    itemtypename: {
                        [Op.like]: `%${search}%`
                    }
                },
                limit: 20,
                order: [
                    ['itemtypename', 'asc']
                ]
            }).then((data) => {
                if (data) res.send(data);
                else res.send([]);
            }).catch(err => {
                res.send([]);
            });
        } else {
            res.send([]);
        }
    });
}

// get racks
function getRacks(req, res) {
    mdb.Rack.findAll({}).then(data => {
        res.send(data);
    })
}

module.exports = { addItem, getItems, getItemsCount, getItemsScan, edit, update, deleteItem, getItemTypes, getRacks }
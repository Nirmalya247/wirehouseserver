const mdb = require('../db/init');
const saleData = require('../db/saleData');
const idgen = require('../db/idgen');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');


async function addItem(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 2);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }

        var it = req.body;
        delete it['SESSION_ID'];
        delete it['SESSION_USERID'];

        if (!it['itemcode'] || it['itemcode'] == '') {
            id = await idgen.getIDAsync(idgen.tableID.item, 'num', 1, false);
            it['itemcode'] = id;
        }
        it['vat'] = 0;
        it['discount'] = 0;
        it['totalsold'] = 0;
        it['totalearned'] = 0;
        if (Number(it['itemtypeid']) == 0) {
            var typeId = await idgen.getIDAsync(idgen.tableID.itemtype, 'num', 1, false);
            var itemtype = await mdb.ItemType.create({ id: typeId, itemtypename: it['itemtypename'] })
            it['itemtypeid'] = typeId;
        }

        var data = await mdb.Item.create(it)
        if (data) {
            res.send({ msg: 'item added', err: false });
        } else res.send({ msg: 'some error', err: true });
    } catch (e) {
        console.log(e);
        res.send({ err: true, msg: 'some error' });
    }
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
async function getItemsScan(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 1);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true, itemcode: 0 });
            return;
        }
        var itemUpdate = await mdb.ItemUpdate.findOne({
            where: {
                [Op.or]: [{ itemcode: req.body.code }, { id: req.body.code }]
            }
        });
        var item = null;
        if (itemUpdate) {
            item = await mdb.Item.findOne({ where: { itemcode: itemUpdate.itemcode } });
        } else {
            item = await mdb.Item.findOne({ where: { itemcode: req.body.code } });
        }
        if (item) {
            res.send({ err: false, msg: 'item found', itemcode: item.itemcode, item: item });
        } else res.send({ err: true, msg: 'not found', itemcode: 0 });
    } catch (e) {
        console.log(e);
        res.send({ err: true, msg: 'not found', itemcode: 0 });
    }
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

// get item update
async function getItemUpdate(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 2);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var data = await mdb.ItemUpdate.findOne({ where: { id: req.body.id, itemcode: req.body.itemcode } });
        if (data) {
            res.send({ msg: 'found item', data: data, err: false });
        } else {
            res.send({ msg: 'wrong stock id', err: true });
        }
    } catch (e) {
        res.send({ msg: 'some error', err: true });
    }
}

// update item
async function update(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 1);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var data = req.body.itemupdate;
        var id = req.body.id;
        console.log(data);
        var oldItemUpdate = await mdb.ItemUpdate.findOne({ where: { id: id } });
        await mdb.ItemUpdate.update(data, { where: { id: id } });
        await mdb.Item.update({ qty: Sequelize.literal('qty + ' + (Number(data.qtystock) - Number(oldItemUpdate.qtystock))) }, { where: { itemcode: oldItemUpdate.itemcode } });
        res.send({ msg: 'done update!', err: false });
    } catch (e) {
        console.log(e);
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

module.exports = {
    addItem,
    getItems,
    getItemsCount,
    getItemsScan,
    edit,
    getItemUpdate,
    update,
    deleteItem,
    getItemTypes,
    getRacks
}
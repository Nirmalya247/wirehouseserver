const mdb = require('../db/init');
const idgen = require('../db/idgen');
const saleData = require('../db/saleData');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');

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

        id = await idgen.getIDAsync(idgen.tableID.return, 'num', 1, false);
        itemIDs = await idgen.getIDAsync(idgen.tableID.returnItem, 'num', items.length, true);
        data['id'] = id;

        var returnD = await mdb.Return.create(data);
        if (returnD) {
            for (var i = 0; i < items.length; i++) {
                items[i]['id'] = itemIDs[i];
                items[i]['returnid'] = id;
                delete items[i]['qtystock'];
                console.log(items[i]);
                var itemUpExpiry = await mdb.ItemUpdate.update({ qtystock: Sequelize.literal('qtystock - ' + items[i].qty) }, { where: { id: items[i].batchno } });
                var item = await mdb.ReturnItem.create(items[i]);

                if (item) {
                    if (items[i].itemname != 'credit amount') {
                        var itemUp = await mdb.Item.update({
                            qty: Sequelize.literal('qty - ' + items[i].qty)
                        }, { where: { itemcode: items[i].itemcode } });
                    }
                } else {
                    throw 'items';
                }
            }
            dayData = await saleData.updateAsync(data.totalQTY, null, data.totalTaxable, null);
            if (dayData) {
                res.send({ msg: 'done!', err: false, id: id });
            } else throw 'after up';
        } else throw 'return';
    } catch (e) {
        console.log(e);
        await mdb.Return.destroy({ where: { id: id } })
        await mdb.ReturnItem.destroy({ where: { returnid: id } })
        res.send({ msg: 'some error and deleted', err: true });
    }
}

function getBatch(req, res) {
    user.check(req, function (authData) {
        var page = req.body.page;
        var limit = req.body.limit;
        var orderBy = req.body.orderBy;
        var order = req.body.order;
        var searchText = req.body.searchText;
        if (authData) {
            var wh = {
                offset: (parseInt(page) - 1) * parseInt(limit),
                limit: parseInt(limit),
                order: [[orderBy, order]],
                include: [{ model: mdb.Vendor, as: 'vendors' }]
            };
            wh['where'] = {
                qtystock: { [Op.gt]: 0 }
            };
            if (searchText && searchText != '') {
                wh['where'] = {
                    ...wh['where'],
                    [Op.or]: [
                        { id: { [Op.like]: `%${searchText}%` } },
                        { purchaseId: { [Op.like]: `%${searchText}%` } },
                        { vendorid: { [Op.like]: `%${searchText}%` } }
                    ]
                }
            }
            if (req.body.vendorid) {
                wh['where']['vendorid'] = { [Op.like]: req.body.vendorid };
            }
            mdb.ItemUpdate.findAll(wh).then(function (data) {
                if (data) {
                    res.send(data);
                } else res.send([]);
            }).catch((err) => {
                console.log(err);
                res.send([]);
            });
        } else res.send([]);
    }, 2);
}


// get returns
async function getReturns(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 2);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var wh = {
            offset: (parseInt(req.body.page) - 1) * parseInt(req.body.limit),
            limit: parseInt(req.body.limit),
            order: [[req.body.orderBy, req.body.order]]
        };
        if (req.body.searchText && req.body.searchText != '') {
            wh['where'] = {
                [Op.or]: [
                    { id: { [Op.like]: `%${req.body.searchText}%` } },
                    { vendorID: { [Op.like]: `%${req.body.searchText}%` } },
                    { vendorFName: { [Op.like]: `%${req.body.searchText}%` } },
                    { vendorLName: { [Op.like]: `%${req.body.searchText}%` } },
                    { vendorCompany: { [Op.like]: `%${req.body.searchText}%` } },
                    { vendorID: { [Op.like]: `%${req.body.searchText}%` } },
                    { userID: { [Op.like]: `%${req.body.searchText}%` } },
                    { userName: { [Op.like]: `%${req.body.searchText}%` } }
                ]
            }
        }
        var data = await mdb.Return.findAll(wh);
        if (data) {
            res.send(data);
        } else res.send([]);
    } catch (e) {
        res.send([]);
    }
}

// get returns count
async function getReturnsCount(req, res) {
    try {
        var dataAuth = await user.checkAsync(req, 2);
        if (!dataAuth) {
            res.send({ msg: 'not permitted', err: true });
            return;
        }
        var wh = { };
        if (req.body.searchText && req.body.searchText != '') {
            wh['where'] = {
                [Op.or]: [
                    { id: { [Op.like]: `%${req.body.searchText}%` } },
                    { vendorID: { [Op.like]: `%${req.body.searchText}%` } },
                    { vendorFName: { [Op.like]: `%${req.body.searchText}%` } },
                    { vendorLName: { [Op.like]: `%${req.body.searchText}%` } },
                    { vendorCompany: { [Op.like]: `%${req.body.searchText}%` } },
                    { vendorID: { [Op.like]: `%${req.body.searchText}%` } },
                    { userID: { [Op.like]: `%${req.body.searchText}%` } },
                    { userName: { [Op.like]: `%${req.body.searchText}%` } }
                ]
            }
        }
        var data = await mdb.Return.findAll(wh);
        if (data) {
            res.send(data);
        } else res.send([]);
    } catch (e) {
        res.send([]);
    }
}

module.exports = { add, getBatch, getReturns, getReturnsCount }
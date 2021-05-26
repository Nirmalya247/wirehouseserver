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
        if (dataAuth) {
            var data = req.body;
            var items = data.items;
            var customerCredit = data.customerCredit;
            var cumulativeAmount = data.totalCost;
            delete data.items;
            delete data['SESSION_ID'];
            delete data['SESSION_USERID'];
            id = await idgen.getIDAsync(idgen.tableID.return, 'num', 1, false);
            itemIDs = await idgen.getID(idgen.tableID.returnItem, 'num', items.length, true);
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
        } else res.send({ msg: 'not permitted', err: true });
    } catch (e) {
        await mdb.Sale.destroy({ where: { id: id } })
        await mdb.SaleItem.destroy({ where: { saleId: id } })
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

module.exports = { add, getBatch }
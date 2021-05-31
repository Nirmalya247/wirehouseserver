const mdb = require('../db/init');
const { Op, Sequelize } = require('sequelize');

const tableID = {
    users: { id: '10', table: mdb.User, name: 'users' },
    sales: { id: '11', table: mdb.Sale, name: 'sales' },
    salesitem: { id: '12', table: mdb.SaleItem, name: 'salesitem' },
    customer: { id: '13', table: mdb.Customer, name: 'customer' },
    purchase: { id: '14', table: mdb.Purchase, name: 'purchase' },
    itemupdate: { id: '15', table: mdb.ItemUpdate, name: 'itemupdate' },
    vendor: { id: '16', table: mdb.Vendor, name: 'vendor' },
    itemtype: { id: '17', table: mdb.ItemType, name: 'itemtype' },
    shop: { id: '18', table: mdb.Shop, name: 'shop' },
    return: { id: '19', table: mdb.Return, name: 'return' },
    returnItem: { id: '20', table: mdb.ReturnItem, name: 'returnitem' },
    transaction: { id: '21', table: mdb.Transaction, name: 'transactions' }
}
function getID(table, idType, n, isMultiple, callback) {
    mdb.Counter.findOne({ where: { id: table.name } }).then(data => {
        if (data) {
            var t = data.val + 1;
            data.val += n;
            data.save();
            callback(getData(t, n, table.id, isMultiple));
        } else {
            mdb.Counter.create({
                id: table.name,
                val: n
            }).then(nData => {
                callback(getData(1, n, table.id, isMultiple));
            })
        }
    })
}
async function getIDAsync(table, idType, n, isMultiple) {
    var data = await mdb.Counter.findOne({ where: { id: table.name } });
    if (data) {
        var t = data.val + 1;
        data.val += n;
        await data.save();
        return getData(t, n, table.id, isMultiple);
    } else {
        await mdb.Counter.create({
            id: table.name,
            val: n
        });
        return getData(1, n, table.id, isMultiple);
    }
}
function getData(now, n, con, isMultiple) {
    if (isMultiple) {
        var ret = [];
        for (var i = 0; i < n; i++) {
            ret.push(con + (now + i));
        }
        return ret;
    } else {
        return con + now;
    }
}

module.exports = { getID, getIDAsync, tableID };
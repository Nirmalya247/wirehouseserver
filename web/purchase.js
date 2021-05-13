const mdb = require('../db/init');
const saleData = require('../db/saleData');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');

function add(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var data = req.body;
            var items = data.items;
            var salesmanCredit = data.salesmanCredit;
            delete data.items;
            delete data['SESSION_ID'];
            delete data['SESSION_USERID'];
            delete data['salesmanCredit'];

            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1;
            var yyyy = today.getYear();
            if (dd < 10) dd = '0' + dd;
            if (mm < 10) mm = '0' + mm;
            var idTemp = yyyy + mm + dd;
            var errorCount = 0;
            insertPurchase();

            function insertPurchase() {
                errorCount++;
                var id = idTemp + user.makeid(6);
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
                                mdb.Purchase.destroy({ where: { id: id }}).then(del => {
                                    mdb.ItemUpdate.destroy({ where: { purchaseId: id }}).then(del => {
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
                                                if (data.creditAmount > 0 || data.addCredit == 1) {
                                                    var cred = (data.addCredit == 1) ? data.creditAmount : (data.creditAmount + salesmanCredit);
                                                    //console.log
                                                    mdb.Salesman.update({ credit: cred }, { where: { id: data.salesmanID } }).then(function(uData) {
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
                                    if (items[i].itemname != 'credit amount') {
                                        //console.log('###########' + items[i].qty);
                                        mdb.Item.update(
                                            {
                                                qty: Sequelize.literal('qty + ' + items[i].qty)
                                            }, { where: { itemcode: items[i].itemcode }}).then( itemUp => {
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
            }
        } else res.send({ msg: 'some error', err: true });
    }, 1);
}

// get purchases
function getPurchases(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var wh = {
                offset: (parseInt(req.body.purchasePage) - 1) * parseInt(req.body.purchaseLimit),
                limit: parseInt(req.body.purchaseLimit),
                order: [[req.body.purchaseOrderBy, req.body.purchaseOrder]]
            };
            if (req.body.purchaseSearchText && req.body.purchaseSearchText != '') {
                wh['where'] = { [Op.or]: [
                    {id: { [Op.like]: `%${req.body.purchaseSearchText}%` } },
                    {salesmanName: { [Op.like]: `%${req.body.purchaseSearchText}%` } },
                    {salesmanID: { [Op.like]: `%${req.body.purchaseSearchText}%` } },
                    {userID: { [Op.like]: `%${req.body.purchaseSearchText}%` } },
                    {userName: { [Op.like]: `%${req.body.purchaseSearchText}%` } }
                ] }
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
    user.check(req, function (authData) {
        if (authData) {
            var wh = { };
            if (req.body.purchaseSearchText && req.body.purchaseSearchText != '') {
                wh['where'] = { [Op.or]: [
                    {id: { [Op.like]: `%${req.body.purchaseSearchText}%` } },
                    {salesmanName: { [Op.like]: `%${req.body.purchaseSearchText}%` } },
                    {salesmanID: { [Op.like]: `%${req.body.purchaseSearchText}%` } },
                    {userID: { [Op.like]: `%${req.body.purchaseSearchText}%` } },
                    {userName: { [Op.like]: `%${req.body.purchaseSearchText}%` } }
                ] }
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


module.exports = { add, getPurchases, getPurchasesCount }
const mdb = require('../db/init');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');

// get shop data
function getShop(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            // console.log('***********get', req.body);
            mdb.Shop.findOne({ where: { id: 1 } }).then(data => {
                if (data) {
                    data['err'] = false;
                    data['msg'] = 'got shop data';
                    res.send(data);
                } else {
                    res.send({ msg: 'no data', err: true })
                }
            });
        } else {
            res.send(res.send({ msg: 'not permitted', err: true }));
        }
    }, 10);
}

// save shop data
function saveShop(req, res) {
    user.check(req, function (dataAuth) {
        if (dataAuth) {
            var shopData = req.body;
            var id = shopData.id;
            delete shopData['SESSION_ID'];
            delete shopData['SESSION_USERID'];
            delete shopData['id'];
            // console.log('***********save', shopData);
            mdb.Shop.update(shopData, { where: { id: id } }).then(data => {
                if (data) {
                    data['err'] = false;
                    data['msg'] = 'got shop data';
                    res.send(data);
                } else {
                    res.send({ msg: 'no data', err: true })
                }
            });
        } else {
            res.send(res.send({ msg: 'not permitted', err: true }));
        }
    }, 10);
}

module.exports = { getShop, saveShop }
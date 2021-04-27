const mdb = require('../db/init');
const user = require('./user');


function addItem(req, res) {
    user.check(req, function (data3) {
        if (data3) {
            var it = req.body;
            delete it['SESSION_ID'];
            delete it['SESSION_USERID'];
            it['totalsold'] = 0;
            it['totalearned'] = 0;
            mdb.Item.create(it).then(function(data) {
                if (data) {
                    res.send({ msg: 'item added', err: false });
                } else res.send({ msg: 'some error', err: true });
            }).catch((err) => {
                res.send({ msg: 'same item code or some error', err: true });
            });
        } else res.send({ msg: 'you have no permit', err: true });
    }, 2)
}

// get items for inventory
function getItems(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            var it = req.body;
            delete it['SESSION_ID'];
            delete it['SESSION_USERID'];
            it['totalsold'] = 0;
            it['totalearned'] = 0;

            var wh = { limit: req.body.itemLimit, order: [[req.body.itemOrderBy, req.body.itemOrder]] };
            if (req.body.itemSearch && req.body.itemSearch != '') {
                if (!isNaN(parseFloat(req.body.itemSearch))) {

                }
                wh['where'] = { itemcode: { [Op.like]: `%${req.body.itemSearch}%` }, itemname: { [Op.like]: `%${req.body.itemSearch}%` } }
            }
            mdb.Item.findAll(wh).then(function(data) {
                if (data) {
                    res.send({ msg: 'got data', err: false, data: data });
                } else res.send({ msg: 'some error', err: true });
            }).catch((err) => {
                res.send({ msg: 'same item code or some error', err: true });
            });
        } else res.send({ msg: 'you have no permit', err: true });
    }, 2)
}

module.exports = { addItem, getItems }
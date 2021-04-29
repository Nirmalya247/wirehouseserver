const mdb = require('../db/init');
const user = require('./user');
const { Op } = require('sequelize');

function add(req, res) {
    user.check(req, function (authData) {
        if (authData) {
            



            var wh = { offset: (parseInt(req.body.itemPage) - 1) * parseInt(req.body.itemLimit), limit: parseInt(req.body.itemLimit), order: [[req.body.itemOrderBy, req.body.itemOrder]] };
            if (req.body.itemSearch && req.body.itemSearch != '') {
                wh['where'] = { [Op.or]: [{itemcode: { [Op.like]: `%${req.body.itemSearch}%` } }, {itemname: { [Op.like]: `%${req.body.itemSearch}%` } } ] }
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

module.exports = { add }
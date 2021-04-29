const mdb = require('../db/init');
const { Op } = require('sequelize');
function makeid(length) {
    var result = [];
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() *
            charactersLength)));
    }
    return result.join('');
}
function makeidSmall(length) {
    var result = [];
    var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() *
            charactersLength)));
    }
    return result.join('');
}

function check(req, callback, isadmin) {
    if (req.body.SESSION_ID && req.body.SESSION_USERID) {
        var wh = { id: req.body.SESSION_ID, uid: req.body.SESSION_USERID, active: 1 }
        mdb.Session.findOne({ where: wh }).then((data) => {
            if (data != null) {
                if (isadmin) {
                    wh = { id: req.body.SESSION_USERID, isadmin: { [Op.gte]: isadmin } }
                    mdb.User.findOne({ where: wh }).then((data2) => {
                        callback(data2 != null);
                    })
                } else callback(true);
            } else callback(false);
        })
    } else callback(false);
}

// all web
function login(req, res) {
    // console.log(req);
    check(req, function (data3) {
        if (data3) res.send({ SESSION_ID: req.body.SESSION_ID, SESSION_USERID: req.body.SESSION_USERID, msg: 'already logged in', loggedin: true, err: false });
        else {
            mdb.User.findOne({ where: { email: req.body.email, password: req.body.password }, attributes: { exclude: ['password'] } }).then((data) => {
                if (data != null) {
                    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                    var SESSION_ID = makeid(128);
                    mdb.Session.create({
                        id: SESSION_ID,
                        uid: data.dataValues.id,
                        ip: ip,
                        active: 1
                    }).then(function (data2) {
                        if (data2 != null) {
                            res.send({ SESSION_ID: SESSION_ID, SESSION_USERID: data.dataValues.id, msg: 'logged in', loggedin: true, err: false });
                        } else {
                            res.send({ SESSION_ID: '##', SESSION_USERID: 0, msg: 'some error', loggedin: false, err: true });
                        }
                    });
                } else {
                    res.send({ SESSION_ID: '##', SESSION_USERID: 0, msg: 'wrong email or password', loggedin: false, err: true });
                }
            })
        }
    })
}
function checklogin(req, res) {
    check(req, function (data3) {
        if (data3) res.send({ SESSION_ID: req.body.SESSION_ID, SESSION_USERID: req.body.SESSION_USERID, msg: 'logged in', loggedin: true, err: false });
        else res.send({ SESSION_ID: '##', SESSION_USERID: 0, msg: 'not logged in', loggedin: false, err: true });
    })
}
function logout(req, res) {
    check(req, function (data3) {
        if (data3) {
            mdb.User.update
            res.send({ SESSION_ID: req.body.SESSION_ID, SESSION_USERID: req.body.SESSION_USERID, msg: 'logged in', loggedin: true, err: false });
        } else res.send({ SESSION_ID: '##', SESSION_USERID: 0, msg: 'not logged in', loggedin: false, err: true });
    })
}

module.exports = { makeid, makeidSmall, check, login, checklogin }
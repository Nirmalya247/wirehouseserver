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
            mdb.User.findOne({ where: { email: req.body.email, password: req.body.password, active: 1, deleted: 0 }, attributes: { exclude: ['password'] } }).then((data) => {
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
    });
}
function checklogin(req, res) {
    var isadmin = 1;
    if (!isNaN(Number(req.body.isadmin))) isadmin = Number(req.body.isadmin);
    console.log(isadmin);
    check(req, function (data3) {
        console.log(data3);
        if (data3) res.send({ SESSION_ID: req.body.SESSION_ID, SESSION_USERID: req.body.SESSION_USERID, msg: 'logged in', loggedin: true, err: false });
        else res.send({ SESSION_ID: '##', SESSION_USERID: 0, msg: 'not logged in', loggedin: false, err: true });
    }, isadmin)
}
function logout(req, res) {
    check(req, function (dataAuth) {
        if (dataAuth) {
            mdb.Session.update({ active: 0 }, { where: { id: req.body.SESSION_ID } }).then((data) => {
                if (data != null) {
                    res.send({ msg: 'logged out', err: false });
                } else {
                    res.send({ msg: 'some error', err: true });
                }
            });
        } else res.send({ msg: 'some error', err: true });
    })
}

function get(req, res) {
    check(req, function (data3) {
        if (data3) {
            mdb.User.findOne({ where: { id: req.body.SESSION_USERID }, attributes: { exclude: ['password'] } }).then((data) => {
                if (data != null) {
                    data['msg'] = 'ok!';
                    data['err'] = false;
                    res.send(data);
                } else {
                    res.send({ msg: 'some error', err: true });
                }
            })
        } else res.send({ msg: 'some error', err: true });
    })
}

function create(req, res) {
    check(req, function (dataAuth) {
        if (dataAuth) {
            var dataUser = req.body;
            delete dataUser['SESSION_ID'];
            delete dataUser['SESSION_USERID'];
            mdb.User.create( dataUser ).then((data) => {
                if (data != null) {
                    res.send({ msg: 'user created', err: false });
                } else {
                    res.send({ msg: 'some error', err: true });
                }
            });
        }
        else {
            res.send({ msg: 'not permitted', err: true });
        }
    }, 10);
}

function update(req, res) {
    check(req, function (dataAuth) {
        if (dataAuth) {
            var dataUser = req.body;
            var id = req.body.id;
            delete dataUser['SESSION_ID'];
            delete dataUser['SESSION_USERID'];
            delete dataUser['id'];
            mdb.User.update(dataUser, { where: { id: id } }).then((data) => {
                if (data != null) {
                    res.send({ msg: 'user updated', err: false });
                } else {
                    res.send({ msg: 'some error', err: true });
                }
            });
        }
        else {
            res.send({ msg: 'not permitted', err: true });
        }
    }, 10);
}

function getUsers(req, res) {
    check(req, function (authData) {
        if (authData) {
            var wh = { offset: (parseInt(req.body.userPage) - 1) * parseInt(req.body.userLimit), limit: parseInt(req.body.userLimit), order: [[req.body.userOrderBy, req.body.userOrder]] };
            if (req.body.userSearchText && req.body.userSearchText != '') {
                wh['where'] = {
                    deleted: 0,
                    [Op.or]: [
                        {id: { [Op.like]: `%${req.body.userSearchText}%` } },
                        {name: { [Op.like]: `%${req.body.userSearchText}%` } },
                        {email: { [Op.like]: `%${req.body.userSearchText}%` } },
                        {phoneno: { [Op.like]: `%${req.body.userSearchText}%` } },
                        {userName: { [Op.like]: `%${req.body.userSearchText}%` } }
                    ]
                }
            } else wh['where'] = { deleted: 0 };
            mdb.User.findAll(wh).then(function(data) {
                if (data) {
                    res.send(data);
                } else res.send([]);
            }).catch((err) => {
                console.log(err);
                res.send([]);
            });
        } else res.send([]);
    }, 10);
}

function getUsersCount(req, res) {
    check(req, function (authData) {
        if (authData) {
            var wh = { };
            if (req.body.userSearchText && req.body.userSearchText != '') {
                wh['where'] = {
                    deleted: 0,
                    [Op.or]: [
                        {id: { [Op.like]: `%${req.body.userSearchText}%` } },
                        {name: { [Op.like]: `%${req.body.userSearchText}%` } },
                        {email: { [Op.like]: `%${req.body.userSearchText}%` } },
                        {phoneno: { [Op.like]: `%${req.body.userSearchText}%` } },
                        {userName: { [Op.like]: `%${req.body.userSearchText}%` } }
                    ]
                }
            } else wh['where'] = { deleted: 0 };
            mdb.User.count(wh).then(function(data) {
                if (data) {
                    res.send(data.toString());
                } else res.send('0');
            }).catch((err) => {
                console.log(err);
                res.send('0');
            });
        } else res.send('0');
    }, 10);
}

function deactivate(req, res) {
    check(req, function (dataAuth) {
        if (dataAuth) {
            var id = req.body.id;
            mdb.User.update({ active: 0 }, { where: { id: id } }).then((data) => {
                if (data != null) {
                    mdb.Session.update({ active: 0 }, { where: { uid: id } }).then((data2) => {
                        if (data2 != null) {
                            res.send({ msg: 'user deactive', err: false });
                        } else {
                            res.send({ msg: 'some error', err: true });
                        }
                    });
                } else {
                    res.send({ msg: 'some error', err: true });
                }
            });
        }
        else {
            res.send({ msg: 'not permitted', err: true });
        }
    }, 10);
}

function activate(req, res) {
    check(req, function (dataAuth) {
        if (dataAuth) {
            var id = req.body.id;
            mdb.User.update({ active: 1 }, { where: { id: id } }).then((data) => {
                if (data != null) {
                    res.send({ msg: 'user active', err: false });
                } else {
                    res.send({ msg: 'some error', err: true });
                }
            });
        }
        else {
            res.send({ msg: 'not permitted', err: true });
        }
    }, 10);
}

function deleteUser(req, res) {
    check(req, function (dataAuth) {
        if (dataAuth) {
            var id = req.body.id;
            mdb.User.update({ active: 0, deleted: 1 }, { where: { id: id } }).then((data) => {
                if (data != null) {
                    mdb.Session.update({ active: 0 }, { where: { uid: id } }).then((data2) => {
                        if (data2 != null) {
                            res.send({ msg: 'user deleted', err: false });
                        } else {
                            res.send({ msg: 'some error', err: true });
                        }
                    });
                } else {
                    res.send({ msg: 'some error', err: true });
                }
            });
        }
        else {
            res.send({ msg: 'not permitted', err: true });
        }
    }, 10);
}

module.exports = { makeid, makeidSmall, check, login, checklogin, logout, get, create, update, getUsers, getUsersCount, deactivate, activate, deleteUser }
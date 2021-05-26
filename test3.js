const express = require('express');
const cors = require('cors');
const mdb = require('./db/init');
const web = require('./web/init');
const idgen = require('./db/idgen');

mdb.sequelize.sync({ force: false }).then(function () {
    console.log('database connected');
    idgen.getID(idgen.tableID.shop, 'num', 4, false, data => console.log(data));
});
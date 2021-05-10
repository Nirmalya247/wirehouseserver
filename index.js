const express = require('express');
const cors = require('cors');
const mdb = require('./db/init');
const web = require('./web/init');


// session table


mdb.sequelize.sync({ force: false }).then(function () {
    console.log('database connected');
    /*
    mdb.User.create({
        //id: 5,
        phoneno: 12345,
        isadmin: 1,
        name: 'no name',
        password: 'nopass'
    }).then(function(jane) { console.log(jane.toJSON()); });
    */
});
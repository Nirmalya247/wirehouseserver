const express = require('express');
const cors = require('cors');
const http = require('http');
const mdb = require('./db/init');
const web = require('./web/init');
const customer = require('./web/customer');


// session table


mdb.sequelize.sync({ force: false }).then(function() {
    console.log('database connected');


    http.createServer(web.app).listen(process.env.PORT || 4210);
    console.log('*******web*******')
    setInterval(() => {
        customer.fetchCustomerFromHubSpotAsync(true, 1, null);
    }, 1000 * 60 * 10);
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
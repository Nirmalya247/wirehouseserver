const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const user = require('./user');
const item = require('./item');
const transaction = require('./transaction');
const customer = require('./customer');

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// user
app.post('/users/login', user.login);
app.all('/users/checklogin', user.checklogin);
app.all('/item/additem', item.addItem);
app.all('/item/getitems', item.getItems);
app.all('/item/getitemscount', item.getItemsCount);
app.all('/transaction/add', transaction.add);
app.all('/customer/get', customer.get);
app.all('/customer/add', customer.add);
app.all('/customer/update', customer.update);
http.createServer(app).listen(4210);

console.log('*******web*******');
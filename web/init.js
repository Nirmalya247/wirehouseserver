const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const user = require('./user');
const item = require('./item');

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// user
app.post('/users/login', user.login);
app.all('/users/checklogin', user.checklogin);
app.all('/item/additem', item.addItem);
app.all('/item/getitems', item.getItems);
http.createServer(app).listen(4210);

console.log('*******web*******');
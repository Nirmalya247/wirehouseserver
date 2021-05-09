const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const user = require('./user');
const item = require('./item');
const transaction = require('./transaction');
const customer = require('./customer');
const saleData = require('./saleData');
const shop = require('./shop');
const saleData2 = require('../db/saleData');

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());


app.all('/sale', saleData2.updateWeb);
// saleData2.updateWeb();

// user
app.all('/users/login', user.login);
app.all('/users/checklogin', user.checklogin);
app.all('/users/logout', user.logout);
app.all('/users/get', user.get);
app.all('/users/create', user.create);
app.all('/users/update', user.update);
app.all('/users/getusers', user.getUsers);
app.all('/users/getuserscount', user.getUsersCount);
app.all('/users/deactivate', user.deactivate);
app.all('/users/activate', user.activate);
app.all('/users/deleteuser', user.deleteUser);

app.all('/item/additem', item.addItem);
app.all('/item/getitems', item.getItems);
app.all('/item/getitemscount', item.getItemsCount);
app.all('/item/edit', item.edit);
app.all('/item/update', item.update);
app.all('/item/delete', item.deleteItem);
app.all('/item/getitemtypes', item.getItemTypes);

app.all('/transaction/add', transaction.add);
app.all('/transaction/gettransactionscount', transaction.getTransactionsCount);
app.all('/transaction/gettransactions', transaction.getTransactions);
app.all('/transaction/gettransactionitem', transaction.getTransactionItem);

app.all('/customer/get', customer.get);
app.all('/customer/add', customer.add);
app.all('/customer/update', customer.update);

app.all('/saledata/gettoday', saleData.getToday);
app.all('/saledata/getgraphdata', saleData.getGraphData);
app.all('/saledata/getstock', saleData.getStock);
app.all('/saledata/getstockcount', saleData.getStockCount);
app.all('/saledata/getdemand', saleData.getDemand);
app.all('/saledata/getdemandcount', saleData.getDemandCount);
app.all('/saledata/getexpiry', saleData.getExpiry);
app.all('/saledata/getexpirycount', saleData.getExpiryCount);

app.all('/shop/get', shop.getShop);
app.all('/shop/save', shop.saveShop);
http.createServer(app).listen(4210);

console.log('*******web*******');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const user = require('./user');
const item = require('./item');
const sale = require('./sale');
const purchase = require('./purchase');
const purchaseBarcode = require('./purchaseBarcode');
const returnItem = require('./return');
const customer = require('./customer');
const vendor = require('./vendor');
const saleData = require('./saleData');
const shop = require('./shop');
const message = require('./message');
const saleBill = require('./saleBill');
const returnBill = require('./returnBill');
const accounting = require('./accounting');

const saleData2 = require('../db/saleData');
const test_func = require('../test/bill_gen');
const test_func2 = require('../test/barcode_gen');

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());


app.all('/testweb', saleData2.testWeb);
app.all('/testdb', saleData2.testDB);
app.all('/testget', saleData2.testGet);
app.all('/testpost', saleData2.testPost);
app.all('/testpdf', test_func.bill_gen);
app.get('/testbarcode', test_func2.bill_gen);
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
app.all('/users/setsalary', user.setSalary);

app.all('/item/additem', item.addItem);
app.all('/item/getitems', item.getItems);
app.all('/item/getitemscount', item.getItemsCount);
app.all('/item/getitemsscan', item.getItemsScan);
app.all('/item/edit', item.edit);
app.all('/item/update', item.update);
app.all('/item/delete', item.deleteItem);
app.all('/item/getitemtypes', item.getItemTypes);
app.all('/item/racks', item.getRacks);

app.all('/sale/add', sale.add);
app.all('/sale/getsalescount', sale.getSalesCount);
app.all('/sale/getsales', sale.getSales);
app.all('/sale/getsaleitem', sale.getSaleItem);
app.all('/sale/getsaleitembystock', sale.getSaleItemByStock);
app.all('/sale/getlastsaleitem', sale.getLastSaleItem);
app.all('/sale/removecreditbysale', sale.removeCreditBySale);

app.all('/purchase/add', purchase.add);
app.all('/purchase/getpurchasescount', purchase.getPurchasesCount);
app.all('/purchase/getpurchases', purchase.getPurchases);
app.all('/purchase/removeduebypurchase', purchase.removeDueByPurchase);

app.all('/return/add', returnItem.add);
app.all('/return/getbatch', returnItem.getBatch);
app.all('/return/getreturns', returnItem.getReturns);
app.all('/return/getreturnscount', returnItem.getReturnsCount);
app.all('/return/removeduebyreturn', returnItem.removeDueByReturn);

app.all('/customer/get', customer.get);
app.all('/customer/add', customer.add);
app.all('/customer/update', customer.update);
app.all('/customer/delete', customer.deleteCustomer);
app.all('/customer/customerinfo', customer.customerInfo);
app.all('/customer/getcustomer', customer.getCustomer);
app.all('/customer/getcustomercount', customer.getCustomerCount);
app.all('/customer/fetchcustomerfromhubspot', customer.fetchCustomerFromHubSpot);

app.all('/vendor/get', vendor.get);
app.all('/vendor/add', vendor.add);
app.all('/vendor/update', vendor.update);
app.all('/vendor/delete', vendor.deleteVendor);
app.all('/vendor/getvendor', vendor.getVendor);
app.all('/vendor/getvendorcount', vendor.getVendorCount);

app.all('/saledata/gettoday', saleData.getToday);
app.all('/saledata/getgraphdata', saleData.getGraphData);
app.all('/saledata/getstock', saleData.getStock);
app.all('/saledata/getstockcount', saleData.getStockCount);
app.all('/saledata/getdemand', saleData.getDemand);
app.all('/saledata/getdemandcount', saleData.getDemandCount);
app.all('/saledata/getexpiry', saleData.getExpiry);
app.all('/saledata/getexpirycount', saleData.getExpiryCount);
app.all('/saledata/getcredit', saleData.getCredit);
app.all('/saledata/getcreditcount', saleData.getCreditCount);
app.all('/saledata/getpurchasedue', saleData.getPurchaseDue);
app.all('/saledata/getpurchaseduecount', saleData.getPurchaseDueCount);
app.all('/saledata/getreturndue', saleData.getReturnDue);
app.all('/saledata/getreturnduecount', saleData.getReturnDueCount);

app.all('/shop/get', shop.getShop);
app.all('/shop/save', shop.saveShop);

app.all('/message/add', message.add);
app.all('/message/update', message.update);
app.all('/message/deletemessage', message.deleteMessage);
app.all('/message/getmessage', message.getMessage);
app.all('/message/getmessagecount', message.getMessageCount);
app.all('/message/sendmessage', message.sendMessage);
app.all('/message/sendmessagemultiple', message.sendMessageMultiple);

app.all('/sale-bill', saleBill.getSaleBill);

app.all('/return-bill', returnBill.getReturnBill);

app.all('/purchase-barcode', purchaseBarcode.purchaseBarcode);

app.all('/accounting/csv', accounting.getCSV);
app.all('/accounting/getaccount', accounting.getAccount);
app.all('/accounting/addaccountdata', accounting.addAccountData);
app.all('/accounting/getreportdata', accounting.getReportData);

module.exports = { app }
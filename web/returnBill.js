const mdb = require('../db/init');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');
const NepaliDate = require('nepali-date');
const dateFormat = require('dateformat');
var pdf = require('html-pdf');

function getBillHtmlA4V2(shop, returns, items) {
    var header = `
        <style>
            body {
                font-family: sans-serif;
                font-size: 10pt;
                margin: 0;
                padding: 0;
            }
            th, td {
                font-family: sans-serif;
                font-size: 10pt;
            }
            
            .header {
                position: relative;
                padding: 0;
                border: 1px solid gainsboro;
                border-width: 0 0 1px 0;
                height: 38mm;
            }
            .header .logo {
                position: absolute;
                top: 4mm;
                left: 4mm;
                height: 30mm;
            }
            .header .holder {
                position: absolute;
                text-align: right;
                top: 4mm;
                right: 4mm;
            }
            .holder .name {
                font-size: 16pt;
            }
            .addr {
                margin: 0 0 14pt 0;
            }
            .phone {
            
            }
            .website {
            
            }
            .email {
            
            }
        </style>
        <div class="header" style="transform: scale(1); zoom: ${(process.env.PORT ? 0.70 : 1)};">
            <img class="logo" src="data:image/jpeg;base64,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" alt="" />
            <div class="holder">
                <div class="name">${shop.shopname}</div>
                <div class="addr">${shop.shopaddress}</div>
                <div class="phone">Phone: ${shop.shopphoneno} / ${shop.shopotherphoneno}</div>
                <div class="website">${shop.shopwebsite}</div>
                <div class="email">${shop.shopemail}</div>
            </div>
        </div>
    `;

    var footer = `
        <style>
            .footer {
                margin: 0 0 4mm 0;
                text-align: center;
            }
            .footer-holder {
                display: inline-block;
                color: gray;
            }
        </style>
        <div class="footer" style="transform: scale(1); zoom: ${(process.env.PORT ? 0.70 : 1)};">
            <div class="footer-holder">
                Page {{page}} of {{pages}} for ${shop.shopname} #${returns.id}
            </div>
        </div>
    `;

    var html = `
        <html>
            <head>
                <style>
                    body {
                        font-family: sans-serif;
                        font-size: 10pt;
                        margin: 0;
                        padding: 0;
                    }
                    th, td {
                        font-family: sans-serif;
                        font-size: 10pt;
                    }
                    
                    .header {
                        position: relative;
                        padding: 0;
                        border: 1px solid gainsboro;
                        border-width: 0 0 1px 0;
                        height: 38mm;
                    }
                    .header .logo {
                        position: absolute;
                        top: 4mm;
                        left: 4mm;
                        height: 30mm;
                    }
                    .header .holder {
                        position: absolute;
                        text-align: right;
                        top: 4mm;
                        right: 4mm;
                    }
                    .holder .name {
                        font-size: 16pt;
                    }
                    .addr {
                        margin: 0 0 14pt 0;
                    }
                    .phone {
                    
                    }
                    .website {
                    
                    }
                    .email {
                    
                    }
                    
                    .bill-info {
                        position: relative;
                        padding: 14pt;
                        width: 100%;
                    }
                    .bill-info .label {
                        color: gray;
                        font-weight: bold;
                        margin: 0 0 1pt 0;
                    }
                    .bill-info .name {
                        font-weight: bold;
                    }
                    .bill-info .phone {
                        
                    }
                    .bill-to {
                        margin: 0 0 6pt 0;
                    }
                    .bill-by {
                    }
                    .bill {
                        text-align: right;
                    }
                    .bill .label {
                        color: black;
                        display: inline-block;
                    }
                    .bill .value {
                        color: black;
                        display: inline-block;
                        width: 100pt;
                        text-align: left;
                        padding: 0 0 0 4pt;
                    }
                    .invoice-no {
                        margin: 6pt;
                    }
                    .invoice-date {
                        margin: 6pt;
                    }
                    .due-amount {
                        background-color: rgb(236, 236, 236);
                        border-radius: 4pt;
                        margin: 2pt;
                        padding: 4pt;
                    }
                    
                    .item-table {
                        width: 100%;
                        border-collapse: collapse;
                        border: 1px solid gainsboro;
                        border-width: 0 0 1px 0;
                    }
                    .item-tr {
                    
                    }
                    .item-tr-data {
                    
                    }
                    .item-th {
                        background-color: #1891b1;
                        color: white;
                        font-size: 11pt;
                        padding: 4pt;
                    }
                    .item-th-items {
                        text-align: left;
                        padding: 4pt 0pt 4pt 16pt;
                    }
                    .item-th-qty {
                        width: 30mm;
                        padding: 4pt 0pt 4pt 0pt;
                    }
                    .item-th-price {
                        text-align: left;
                        width: 20mm;
                        padding: 4pt 0pt 4pt 0pt;
                    }
                    .item-th-amount {
                        text-align: left;
                        width: 16mm;
                        padding: 4pt 16pt 4pt 0pt;
                    }
                    .item-td {
                    
                    }
                    .item-td-items {
                        padding: 4pt 4pt 4pt 16pt;
                    }
                    .item-td-qty {
                        text-align: center;
                    }
                    .item-name {
                        font-weight: bold;
                    }
                    
                    .total-holder {
                        text-align: right;
                    }
                    .total-sub-holder {
                        text-align: right;
                        display: inline-block;
                        margin: 8pt 0 0 0;
                    }
                    .total-sub-holder .label {
                        display: inline-block;
                        font-weight: bold;
                    }
                    .total-sub-holder .value {
                        display: inline-block;
                        width: 80pt;
                        text-align: left;
                        padding: 0 0 0 4pt;
                    }
                    .total {
                        border-radius: 4pt;
                        margin: 2pt;
                        padding: 4pt;
                    }
                    .total .label {
                    
                    }
                    .total .value {
                    
                    }
                    .tendered {
                        border-radius: 0;
                        margin: 2pt;
                        padding: 4pt;
                        border: 1px solid gainsboro;
                        border-width: 0 0 1px 0;
                    }
                    .tendered .label {
                    
                    }
                    .tendered .value {
                    
                    }
                    .payment-due {
                        border-radius: 4pt;
                        margin: 2pt;
                        padding: 4pt;
                    }
                    .payment-due .label {
                    
                    }
                    .payment-due .value {
                        font-weight: bold;
                    }
                    
                    .footer {
                        margin: 0 0 4mm 0;
                        text-align: center;
                    }
                    .footer-holder {
                        display: inline-block;
                        color: gray;
                    }
                </style>
            </head>
            <body style="transform: scale(1); zoom: ${(process.env.PORT ? 0.70 : 1)};">
                <div style="display: none;">
                    <img src="data:image/jpeg;base64,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" alt="" />
                </div>
                <table class="bill-info">
                    <tr>
                        <td>
                            <div class="bill-to">
                                <div class="label">BILL TO</div>
                                <div class="name">${ returns.vendorFName } ${ returns.vendorLName } ${ returns.vendorID }</div>
                                <div class="phone">${ returns.vendorPhone }</div>
                            </div>
                        </td>
                        <td rowspan="2" style="vertical-align: top; width: 50%;">
                            <div class="bill">
                                <div class="invoice-no">
                                    <div class="label">Invoice Number:</div>
                                    <div class="value">${ returns.id }</div>
                                </div>
                                <div class="invoice-date">
                                    <div class="label">Invoice Date:</div>
                                    <div class="value">${ (new NepaliDate(returns.createdAt)).format('DDD MMMM DD, YYYY') }</div>
                                </div>
                                <div class="invoice-date">
                                    <div class="label">Invoice Time:</div>
                                    <div class="value">${ dateFormat(returns.createdAt, 'hh:MM tt') }</div>
                                </div>
                                <div class="due-amount">
                                    <div class="label">Amount Due:</div>
                                    <div class="value">${ returns.dueAmount }</div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="bill-by">
                                <div class="label">INVOICE GENERATED BY/CASHIER</div>
                                <div class="name">${ returns.userName } ${ returns.userID }</div>
                            </div>
                        </td>
                    </tr>
                </div>
                <table class="item-table">
                    <tr class="item-tr">
                        <th class="item-th item-th-items">Items</th>
                        <th class="item-th item-th-qty">Quantity</th>
                        <th class="item-th item-th-price">Price</th>
                        <th class="item-th item-th-amount">Amount</th>
                    </tr>
    `;
    var totalCost = 0;
    for (var i = 0; i < items.length; i++) {
        var mfg = new NepaliDate(new Date(items[i].mfg));
        mfg = mfg.format('MMMM YYYY'); // months[mfg.getMonth()] + ' ' + mfg.getYear();
        var expiry = new NepaliDate(new Date(items[i].expiry));
        expiry = expiry.format('MMMM YYYY');
        var purchase = new NepaliDate(new Date(items[i].purchasedate));
        purchase = purchase.format('MMMM YYYY');
        html += `
            <tr class="item-tr item-tr-data">
                <td class="item-td item-td-items">
                    <div class="item-name">${ items[i].itemname }</div>
                    <div class="item-batch">Batch NO: ${ items[i].batchno }</div>
                    <div class="item-description">${ items[i].reason }</div>
                    <div class="item-batch">Purchase: ${ purchase } (${ dateFormat(new Date(items[i].purchasedate), 'mmmm yyyy') })</div>
                    <div class="item-batch">Mfg. Date: ${ mfg } (${ dateFormat(new Date(items[i].mfg), 'mmmm yyyy') })</div>
                    <div class="item-batch">Exp. Date: ${ expiry } (${ dateFormat(new Date(items[i].expiry), 'mmmm yyyy') })</div>
                </td>
                <td class="item-td item-td-qty">${ items[i].qty }</td>
                <td class="item-td item-td-price">${ items[i].price }</td>
                <td class="item-td item-td-amount">${ (Number(items[i].qty) * Number(items[i].price)).toFixed(2) }</td>
            </tr>
        `;
        totalCost += Number(items[i].qty) * Number(items[i].price);
    }
    var billDate = new NepaliDate(new Date(returns.createdAt));
    var change = Number(returns.changeDue);
    var dueAmount = Number(returns.dueAmount);
    html += `
            </table>
            <div class="total-holder">
                <div class="total-sub-holder">
                    <div class="total">
                        <div class="label">Total:</div>
                        <div class="value">Rs. ${ totalCost.toFixed(2) }</div>
                    </div>
                    <div class="total">
                        <div class="label">Discount:</div>
                        <div class="value">Rs. ${ (totalCost - Number(returns.totalAmount)).toFixed(2) }</div>
                    </div>
                    <div class="total">
                        <div class="label">Payable:</div>
                        <div class="value">Rs. ${ returns.totalAmount }</div>
                    </div>
                    <div class="tendered">
                        <div class="label">Payment on ${ billDate.format('MMMM DD, YYYY') } (${ dateFormat(billDate.getEnglishDate(), 'mmmm dd, yyyy') }) using ${ returns.paymentMode }:</div>
                        <div class="value">Rs. ${ returns.totalTendered }</div>
                    </div>
                    <div class="payment-due">
                        <div class="label">${ (dueAmount > 0 ? 'Amount Due:' : 'Change:') }</div>
                        <div class="value">Rs. ${ (dueAmount > 0 ? dueAmount.toFixed(2) : change.toFixed(2)) }</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    var options = {
        format: 'A4',
        orientation: "potrate",
        "header": {
            "height": "46mm",
            "contents": header
        },
        "footer": {
            "height": "8mm",
            "contents": {
                default: footer
            }
        },
        "renderDelay": 1000,
        "border": "0"
    };
    return { html: html, options: options };
}

function getReturnBill(req, res) {
    var returnId = req.query.returnId;
    mdb.Shop.findOne({ where: { id: 1 } }).then(resShop => {
        mdb.Return.findOne({ where: { id: returnId } }).then(resReturn => {
            mdb.ReturnItem.findAll({ where: { returnid: returnId } }).then(resReturnItem => {
                if (req.query.paper == 'A4V2') {
                    var data = getBillHtmlA4V2(resShop, resReturn, resReturnItem);
                    res.setHeader('Content-Type', 'application/pdf');
                    pdf.create(data.html, data.options).toStream(function(err, stream) {
                        stream.pipe(res);
                    });
                    // res.send(resReturnItem);
                } else if (req.query.paper == 'HTML') {
                    res.send(getBillHtmlA4V2(resShop, resReturn, resReturnItem));
                } else {
                    res.send('some error');
                }
            });
        });
    });
}

module.exports = { getReturnBill }
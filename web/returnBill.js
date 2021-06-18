const mdb = require('../db/init');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');
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
                width: 30mm;
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
                        width: 30mm;
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
                        width: 80pt;
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
                        <td rowspan="2" style="vertical-align: top; width: 40%;">
                            <div class="bill">
                                <div class="invoice-no">
                                    <div class="label">Invoice Number:</div>
                                    <div class="value">${returns.id}</div>
                                </div>
                                <div class="invoice-date">
                                    <div class="label">Invoice Date:</div>
                                    <div class="value">${returns.createdAt.toDateString()}</div>
                                </div>
                                <div class="due-amount">
                                    <div class="label">Amount Due:</div>
                                    <div class="value">${returns.dueAmount}</div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="bill-by">
                                <div class="label">PRODUCED BY</div>
                                <div class="name">${returns.userName} ${returns.userID}</div>
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
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (var i = 0; i < items.length; i++) {
        var mfg = new Date(items[i].mfg);
        mfg = months[mfg.getMonth()] + ' ' + mfg.getFullYear();
        var expiry = new Date(items[i].expiry);
        expiry = months[expiry.getMonth()] + ' ' + expiry.getFullYear();
        var purchase = new Date(items[i].purchasedate);
        purchase = months[purchase.getMonth()] + ' ' + purchase.getFullYear();
        html += `
            <tr class="item-tr item-tr-data">
                <td class="item-td item-td-items">
                    <div class="item-name">${items[i].itemname}</div>
                    <div class="item-batch">Batch NO: ${items[i].batchno}</div>
                    <div class="item-description">${items[i].reason}</div>
                    <div class="item-batch">Purchase: ${ purchase }</div>
                    <div class="item-batch">Mfg. Date: ${ mfg }</div>
                    <div class="item-batch">Exp. Date: ${ expiry }</div>
                </td>
                <td class="item-td item-td-qty">${items[i].qty}</td>
                <td class="item-td item-td-price">${items[i].price}</td>
                <td class="item-td item-td-amount">${items[i].totalcost}</td>
            </tr>
        `;
    }
    html += `
            </table>
            <div class="total-holder">
                <div class="total-sub-holder">
                    <div class="total">
                        <div class="label">Total:</div>
                        <div class="value">${ returns.totalAmount }</div>
                    </div>
                    <div class="tendered">
                        <div class="label">Payment on May 25, 2021 using cash:</div>
                        <div class="value">${ returns.totalTendered }</div>
                    </div>
                    <div class="payment-due">
                        <div class="label">Amount Due:</div>
                        <div class="value">${ returns.dueAmount }</div>
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
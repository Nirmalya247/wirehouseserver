const mdb = require('../db/init');
const user = require('./user');
const { Op, Sequelize } = require('sequelize');
var pdf = require('html-pdf');

// shop ->
//  shopname

function getBillHtmlA4(shop, transaction, items) {
    var header = `
    <table width="100%" style="text-align: left; border-collapse: collapse;">
        <tr style="padding: 0; height: 6mm;">
            <td rowspan="2" width="16mm" style="border: solid 1px #bbb; border-width: 1px 0 1px 1px; vertical-align:top;">
                <div class="titleShopLogo">
                    <img src="${mdb.ui}assets/img/brand/shop-logo.png" style="width: 14mm;">
                </div>
            </td>
            <td rowspan="2" width="40%" style="border: solid 1px #bbb; border-width: 1px 1px 1px 0; vertical-align:top;">
                <div class="titleShopBody">
                    <div style="font-size: 6mm; text-transform: uppercase; margin: 0 0 4px 0;">${shop.shopname}</div>
                    <div style="font-size: 11pt; margin: 0 0 4px 0;">${shop.shopdetails}</div>
                    <div style="font-size: 10pt; margin: 0 0 2px 0;">${shop.shopaddress}</div>
                    <div style="font-size: 10pt; margin: 0 0 2px 0;">${shop.shopphoneno}, ${shop.shopotherphoneno}</div>
                </div>
            </td>
            <td style="border: solid 1px #bbb; padding: 0;">
                <div class="titleLabel">Bill No :</div>
                <div class="titleData">${transaction.id}</div><br>
            </td>
            <td style="border: solid 1px #bbb; padding: 0;">
                <div class="titleLabel">Bill Date :</div>
                <div class="titleData">${transaction.createdAt}</div>
            </td>
        </tr>
        <tr>
            <td colspan="2" style="border: solid 1px #bbb; vertical-align:top;">
                <div class="titleLabel">Reg ID</div>
                <div class="titleData">: ${transaction.customerID}</div>
                <div class="titleLabel">Custome Name</div>
                <div class="titleData">: ${transaction.customerName}</div><br>
                <div class="titleLabel">Custome No</div>
                <div class="titleData">: ${transaction.customerPhone}</div><br>
            </td>
        </tr>
    </table>
    `
    var noOfPage = Math.ceil(items.length / 17);
    var html = `
        <style>
        body {
            padding: 0 4mm;
        }
        .mainBody {
            width: 100%;
            background-color: white;
            text-align: left;
            font-family: monospace;
            display: inline-block;
            padding: 2mm 0;
        }

        .titleShopBody {
        }

        .titleBody {
            text-align: left;
        }

        .titleLabel {
            display: inline-block;
            font-weight: bold;
        }

        .titleData {
            display: inline-block;
        }

        .titleDateLabel {
            float: right;
            width: 20mm;
        }

        .titleDateData {
            float: right;
        }

        .tableDiv {
            padding: 0;
        }

        .thItem {
            border: solid 1px #bbb;
            border-width: 0 1px;
        }

        .trItem {
            border: solid 1px #bbb;
            border-width: 0 1px;
        }

        .tdItem {
            padding: 2mm 0;
            border: solid 1px #bbb;
            border-width: 0 1px;
            height: 29px;
        }

        .trTotal {
            border: solid 1px #bbb;
        }

        .tdTotal {
            padding: 2mm 0;
            border: solid 1px #bbb;
            border-width: 0 1px;
        }

        .amountBody {
            height: 22mm;
            border: solid 1px #bbb;
            border-width: 1px;
        }

        .amountLabel {
            display: inline-block;
            font-weight: bold;
            float: right;
        }

        .amountData {
            text-align: right;
            width: 28mm;
            float: right;
            display: inline-block;
        }
        
        .footerBody {
            border: solid 1px #bbb;
            text-align: left;
            padding: 0;
        }

        .footerLabel {
            display: inline-block;
            font-weight: bold;
            padding: 1mm 0 0 0;
        }

        .footerData {
            display: inline-block;
            padding: 1mm 0 0 0;
        }
    </style>
    `;
    var i = 0;
    var total = 0;
    for (var p = 0; p < noOfPage; p++) {
        html += `<div class="mainBody">` + header;
        html += `
            <div class="tableDiv">
            <table width="100%" style="text-align: left; border-collapse: collapse;">
                <thead>
                    <tr style="font-size: 10pt; margin: 6px 0 10px 0; border: solid 1px #bbb;">
                        <th class="thItem" style="padding: 0 0 5px 0; width: 3%;">#</th>
                        <th class="thItem" style="padding: 0 0 5px 0; width: 27%;">Item Name</th>
                        <th class="thItem" style="padding: 0 0 5px 0; width: 10%;">Expiry Date</th>
                        <th class="thItem" style="padding: 0 0 5px 0; width: 10%;">QTY</th>
                        <th class="thItem" style="padding: 0 0 5px 0; width: 10%;">Price/Unit</th>
                        <th class="thItem" style="padding: 0 0 5px 0; width: 10%;">Amount</th>
                        <th class="thItem" style="padding: 0 0 5px 0; width: 9%;">Disc Amount</th>
                        <th class="thItem" style="padding: 0 0 5px 0; width: 6%;">Taxable</th>
                        <th class="thItem" style="padding: 0 0 5px 0; width: 5%;">VAT</th>
                        <th class="thItem" style="padding: 0 0 5px 0; width: 10%; text-align: right; border: solid 1px #bbb; border-width: 0 0 0 1px;">Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        var tQty = 0;
        var tAmount = 0;
        var tDiscount = 0;
        var tTaxable = 0;
        var tVat = 0;
        var tTotal = 0;
        for (; i < (p * 17 + 17); i++) {
            if (i < items.length) {
                var tot = Number((items[i].qty * Number(items[i].price)).toFixed(2));
                var disc = Number((tot * Number(items[i].discount) / 100).toFixed(2));
                tQty += items[i].qty;
                tAmount += tot;
                tDiscount += disc;
                tTaxable += Number((tot - disc).toFixed(2));
                tVat += Number(((tot - disc) * (1 + Number(items[i].vat) / 100)).toFixed(2));
                tTotal += Number(items[i].totalPrice);
                html += `
                <tr class="trItem">
                    <td class="tdItem">${i + 1}</td>
                    <td class="tdItem">${items[i].itemname}</td>
                    <td class="tdItem">${items[i].expiry}</td>
                    <td class="tdItem">${items[i].qty}</td>
                    <td class="tdItem">${items[i].price}</td>
                    <td class="tdItem">${tot}</td>
                    <td class="tdItem">${disc}</td>
                    <td class="tdItem">${(tot - disc).toFixed(2)}</td>
                    <td class="tdItem">${((tot - disc) * (Number(items[i].vat) / 100)).toFixed(2)}</td>
                    <td class="tdItem" style="text-align: right; border: solid 1px #bbb; border-width: 0 0 0 1px;">${items[i].totalPrice}</td>
                </tr>
                `;
            } else {
                html += `
                <tr class="trItem">
                    <td class="tdItem"> </td>
                    <td class="tdItem"></td>
                    <td class="tdItem"></td>
                    <td class="tdItem"></td>
                    <td class="tdItem"></td>
                    <td class="tdItem"></td>
                    <td class="tdItem"></td>
                    <td class="tdItem"></td>
                    <td class="tdItem"></td>
                    <td class="tdItem" style="text-align: right; border: solid 1px #bbb; border-width: 0 0 0 1px;"></td>
                </tr>
                `;
            }
        }
        total += tTotal;
        html += `
                <tr class="trTotal">
                    <td class="tdTotal"></td>
                    <td>Total</td>
                    <td></td>
                    <td class="tdTotal">${tQty}</td>
                    <td class="tdTotal">-</td>
                    <td class="tdTotal">${tAmount.toFixed(2)}</td>
                    <td class="tdTotal">${tDiscount.toFixed(2)}</td>
                    <td class="tdTotal">${tTaxable.toFixed(2)}</td>
                    <td class="tdTotal">${tVat.toFixed(2)}</td>
                    <td class="tdTotal" style="text-align: right; border: solid 1px #bbb; border-width: 0 0 0 1px;">${tTotal.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
        </div>
        `;
        if (p == noOfPage - 1) {
            html += `
            <div class="amountBody">
                <div class="amountData">${Math.floor(total)}</div>
                <div class="amountLabel">Total Amount :</div><br><br>
                <div class="amountData">${transaction.totalTendered}</div>
                <div class="amountLabel">Payment :</div><br>
                <div class="amountData">${transaction.changeDue}</div>
                <div class="amountLabel">Due :</div><br>
                <div class="amountData">${transaction.creditAmount}</div>
                <div class="amountLabel">Credit :</div>
            </div>
            `;
        } else {
            html += `
            <div class="amountBody">
            </div>
            `;
        }
        html += `
            <table width="100%" style="text-align: left; border-collapse: collapse;">
                <tr>
                    <td width="30%" style="border: solid 1px #bbb; border-width: 0 0 1px 1px;">
                        <div class="footerLabel">License No: </div>
                        <div class="footerData">${shop.licenseno}</div>
                    </td>
                    <td width="55%" style="border: solid 1px #bbb; border-width: 0 0 1px 0;">
                        <div class="footerLabel">Prepared By :</div>
                        <div class="footerData">${transaction.userName}</div>
                    </td>
                    <td width="" style="border: solid 1px #bbb; border-width: 0 1px 1px 0;">
                        <div class="footerLabel">Page :</div>
                        <div class="footerData">${p + 1} of ${noOfPage}</div>
                    </td>
                </tr>
            </table>
        </div>
        `;
    }
    return html;
}

function getTransactionBill(req, res) {
    var transactionId = req.query.transactionId;
    mdb.Shop.findOne({ where: { id: 1 } }).then(resShop => {
        mdb.Transaction.findOne({ where: { id: transactionId } }).then(resTransaction => {
            mdb.TransactionItem.findAll({ where: { transactionId: transactionId } }).then(resTransactionItem => {
                if (req.query.paper == 'A4') {
                    var html = getBillHtmlA4(resShop, resTransaction, resTransactionItem);
                    var options = {
                        format: 'a4',
                        orientation: "landscape"
                    };
                    pdf.create(html, options).toStream(function (err, stream) {
                        stream.pipe(res);
                    });
                } else {
                    res.send('some error');
                }
            });
        });
    });
}

module.exports = { getTransactionBill }
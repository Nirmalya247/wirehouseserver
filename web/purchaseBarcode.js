const { Op, Sequelize } = require('sequelize');
var pdf = require('html-pdf');
var JsBarcode = require('jsbarcode');
const { DOMImplementation, XMLSerializer } = require('xmldom');
const mdb = require('../db/init');



async function purchaseBarcode(req, res) {
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
            </style>
        </head>
        <body style="margin: 10px; transform: scale(1); zoom: ${ (process.env.PORT ? 0.70 : 1) };">
            <div style="width: 100%;">
    `;
    var options = {
        format: 'A4',
        orientation: "potrate",
        "renderDelay": 1000,
        "border": "0"
    };
    var purchaseId = req.query.purchaseId;
    if (req.query.billId) {
        var purchase = await mdb.Purchase.findOne({ where: { billID: req.query.billId } });
        purchaseId = purchase.id;
    }
    var data = await mdb.ItemUpdate.findAll({ where: { purchaseId: purchaseId } });
    for (var i = 0; i < data.length; i++) {
        const xmlSerializer = new XMLSerializer();
        const documentItem = new DOMImplementation().createDocument('http://www.w3.org/1999/xhtml', 'html', null);
        const svgNodeItem = documentItem.createElementNS('http://www.w3.org/2000/svg', 'svg');

        JsBarcode(svgNodeItem, data[i].itemcode, {
            xmlDocument: documentItem,
            height: 40,
        });

        const svgTextItem = xmlSerializer.serializeToString(svgNodeItem);


        const documentStock = new DOMImplementation().createDocument('http://www.w3.org/1999/xhtml', 'html', null);
        const svgNodeStock = documentStock.createElementNS('http://www.w3.org/2000/svg', 'svg');

        JsBarcode(svgNodeStock, data[i].id, {
            xmlDocument: documentStock,
            height: 40,
        });

        const svgTextStock = xmlSerializer.serializeToString(svgNodeStock);
        html += `<div style="display: inline-block; width: 46%; text-align: center; padding: 2%;">${ svgTextItem } ${ svgTextStock }<br>${ data[i].itemname }</div>`;
    };
    html += `</div></body></html>`;
    // console.log(html);
    // res.send(html);
    res.setHeader('Content-Type', 'application/pdf');
    pdf.create(html, options).toStream(function(err, stream) {
        stream.pipe(res);
    });
}

module.exports = { purchaseBarcode }
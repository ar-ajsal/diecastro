const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoice = (order, filePath) => {
  // Create folder if it doesn't exist
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  doc.pipe(fs.createWriteStream(filePath));

  // --- HEADER ---
  doc
    .fillColor('#ff9900') // Amazon orange
    .fontSize(28)
    .font('Helvetica-Bold')
    .text(' Store', 50, 40);

  // Add tagline or website
  doc
    .fontSize(10)
    .fillColor('gray')
    .text('Your one-stop e-commerce shop', 50, 70);

  // Draw a line below header
  doc
    .moveTo(50, 90)
    .lineTo(550, 90)
    .strokeColor('#ccc')
    .stroke();

  // --- CUSTOMER & ORDER INFO ---
  doc
    .fillColor('black')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Invoice', 50, 110);

  // Order details block
  const infoTop = 130;
  doc.font('Helvetica');
  doc.text(`Order ID: ${order.orderId}`, 50, infoTop);
  doc.text(`Date: ${new Date(order.createdOn).toLocaleDateString()}`, 50, infoTop + 15);
  doc.text(`Status: ${order.status}`, 50, infoTop + 30);

  // Shipping Address block on the right
  const addressTop = 130;
  doc.font('Helvetica-Bold').text('Shipping Address:', 350, addressTop);
  doc.font('Helvetica');
  doc.text(order.address?.name || '', 350, addressTop + 15);
  doc.text(order.address?.street || '', 350, addressTop + 30);
  doc.text(`${order.address?.city || ''}, ${order.address?.state || ''} - ${order.address?.zip || ''}`, 350, addressTop + 45);
  doc.text(order.address?.country || '', 350, addressTop + 60);

  // --- ITEMS TABLE HEADER ---
  const tableTop = 190;
  doc
    .fillColor('#000')
    .fontSize(12)
    .font('Helvetica-Bold');

  doc.text('Item', 50, tableTop);
  doc.text('Qty', 300, tableTop, { width: 50, align: 'right' });
  doc.text('Price', 370, tableTop, { width: 90, align: 'right' });
  doc.text('Total', 470, tableTop, { width: 90, align: 'right' });

  // Draw table header line
  doc
    .moveTo(50, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .strokeColor('#eee')
    .stroke();

  // --- ITEMS TABLE ROWS ---
  doc.font('Helvetica').fontSize(11);

  let y = tableTop + 30;
  order.orderedItems.forEach(item => {
    const total = item.price * item.quantity;

    doc.text(item.product?.name || 'Product', 50, y);
    doc.text(item.quantity.toString(), 300, y, { width: 50, align: 'right' });
    doc.text(`₹${item.price.toFixed(2)}`, 370, y, { width: 90, align: 'right' });
    doc.text(`₹${total.toFixed(2)}`, 470, y, { width: 90, align: 'right' });

    y += 25;

    // Draw line below each item row
    doc
      .moveTo(50, y - 5)
      .lineTo(550, y - 5)
      .strokeColor('#eee')
      .stroke();
  });

  // --- TOTALS ---
  y += 20;
  doc.font('Helvetica-Bold');

  doc.text('Subtotal', 370, y, { width: 90, align: 'right' });
  doc.text(`₹${order.totalPrice.toFixed(2)}`, 470, y, { width: 90, align: 'right' });

  y += 20;
  doc.text('Discount', 370, y, { width: 90, align: 'right' });
  doc.text(`₹${order.discount.toFixed(2)}`, 470, y, { width: 90, align: 'right' });

  y += 20;
  doc.text('Final Amount', 370, y, { width: 90, align: 'right' });
  doc.text(`₹${order.finalAmount.toFixed(2)}`, 470, y, { width: 90, align: 'right' });

  // --- FOOTER ---
  doc
    .fontSize(10)
    .fillColor('gray')
    .text('Thank you for shopping with  Store!', 50, 750, {
      align: 'center',
      width: 500
    });

  doc.end();
};

module.exports = generateInvoice;

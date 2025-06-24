const Order = require('../../models/orderSchema');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

function buildFilter(range, from, to) {
  let filter = {};
  if (range === 'daily') {
    const today = new Date();
    today.setHours(0,0,0,0);
    filter.createdOn = { $gte: today };
  } else if (range === 'weekly') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    filter.createdOn = { $gte: d };
  } else if (range === 'monthly') {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    filter.createdOn = { $gte: d };
  } else if (range === 'custom' && from && to) {
    filter.createdOn = { $gte: new Date(from), $lte: new Date(to) };
  }
  return filter;
}

exports.getSalesData = async (req, res) => {
  try {
    const { range, from, to, page = 1, limit = 10 } = req.query;
    const filter = buildFilter(range, from, to);
    const currentPage = parseInt(page), perPage = parseInt(limit);

    const totalOrders = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdOn: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    const totalAmount = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0);
    const totalFinalAmount = orders.reduce((sum, o) => sum + o.finalAmount, 0);

    res.render('sales-report', {
      orders,
      report: { totalOrders, totalAmount, totalDiscount, totalFinalAmount },
      range, from, to, currentPage,
      totalPages: Math.ceil(totalOrders / perPage)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading sales data');
  }
};

exports.downloadSalesReport = async (req, res) => {
  try {
    const { type, range, from, to } = req.query;
    const filter = buildFilter(range, from, to);
    const orders = await Order.find(filter).sort({ createdOn: -1 });

    if (type === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Sales Report');
      ws.columns = [
        { header: 'Order ID', key: 'orderId', width: 30 },
        { header: 'Total Price', key: 'totalPrice' },
        { header: 'Discount', key: 'discount' },
        { header: 'Final Amount', key: 'finalAmount' },
        { header: 'Date', key: 'createdOn', width: 20 }
      ];
      orders.forEach(o => {
        ws.addRow({
          orderId: o.orderId,
          totalPrice: o.totalPrice,
          discount: o.discount,
          finalAmount: o.finalAmount,
          createdOn: o.createdOn.toLocaleDateString()
        });
      });
      res.setHeader('Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition',
        'attachment; filename="sales-report.xlsx"');
      await workbook.xlsx.write(res);
      res.end();

    } else if (type === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition',
        'attachment; filename="sales-report.pdf"');
      doc.pipe(res);
      doc.fontSize(18).text('Sales Report', { align: 'center' }).moveDown();

      orders.forEach(o => {
        doc.fontSize(12)
           .text(`Order ID: ${o.orderId}`)
           .text(`Total: ₹${o.totalPrice}`)
           .text(`Discount: ₹${o.discount}`)
           .text(`Final: ₹${o.finalAmount}`)
           .text(`Date: ${o.createdOn.toLocaleDateString()}`)
           .moveDown();
      });
      doc.end();
    } else {
      res.status(400).send('Invalid type');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Download failed');
  }
};

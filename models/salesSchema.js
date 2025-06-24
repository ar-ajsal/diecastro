// === salesSchema.js ===
const mongoose = require('mongoose');
const { Schema } = mongoose;

const salesSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  totalPrice: Number,
  discount: Number,
  finalAmount: Number,
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sales', salesSchema);

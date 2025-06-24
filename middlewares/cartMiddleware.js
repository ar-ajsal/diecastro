// In middleware/cartMiddleware.js
const Cart = require('../models/cartSchema');

const loadCartData = async (req, res, next) => {
  try {
    if (req.session.user) {
      const userCart = await Cart.findOne({ userId: req.session.user }).populate({
        path: 'items.productId',
        populate: { path: 'category' }
      });
      res.locals.cart = userCart || { items: [] };
    } else {
      res.locals.cart = { items: [] };
    }
    next();
  } catch (error) {
    console.error('Error loading cart data:', error);
    res.locals.cart = { items: [] };
    next();
  }
};

module.exports = { loadCartData };
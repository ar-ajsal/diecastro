
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Cart = require("../../models/cartSchema");
const Wishlist = require("../../models/wishlistSchema");
const mongoose = require("mongoose");
const isValidObjectId = mongoose.Types.ObjectId.isValid;
const crypto = require('crypto');

console.log('Cart:', Cart);
console.log('Cart.findOne:', typeof Cart.findOne);

const getCartPage = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findById(userId);

    if (!userId) {
      return res.redirect('/login');
    }

    const userCart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      populate: { path: 'category' }
    });

    if (!userCart || userCart.items.length === 0) {
      return res.render('cart', { cartItems: [], grandTotal: 0, count: 0, user: userData, session: req.session });
    }

    const validCartItems = userCart.items.filter(item => {
      return item.productId && !item.productId.isBlocked && item.productId.category && item.productId.category.isListed;
    });

    const cartItems = validCartItems.map(item => ({
      product: item.productId,
      quantity: item.quantity,
      totalPrice: item.productId.salePrice * item.quantity
    }));

    const grandTotal = cartItems.reduce((total, item) => total + item.totalPrice, 0);
    const cartCount = cartItems.length;

    res.render('cart', {
      cartItems,
      grandTotal,
      count: cartCount,
      user: userData,
      session: req.session
    });
  } catch (error) {
    console.error('Error loading cart page:', error);
    res.status(500).send('Something went wrong');
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.session.user;
    const maxQuantityLimit = 5;

    if (!userId) {
      return res.status(401).json({ status: false, message: "User not authenticated" });
    }

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ status: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(productId).populate('category');
    if (!product) {
      return res.status(404).json({ status: false, message: "Product not found" });
    }

    if (product.isBlocked) {
      return res.status(400).json({ status: false, message: "Product is blocked" });
    }
    if (!product.category || !product.category.isListed) {
      return res.status(400).json({ status: false, message: "Product category is unlisted" });
    }

    if (product.quantity <= 0) {
      return res.status(400).json({ status: false, message: "Product is out of stock" });
    }

    const requestedQuantity = parseInt(quantity) || 1;
    if (requestedQuantity > product.quantity) {
      return res.status(400).json({ status: false, message: `Only ${product.quantity} items in stock` });
    }
    if (requestedQuantity > maxQuantityLimit) {
      return res.status(400).json({ status: false, message: `Maximum ${maxQuantityLimit} items allowed per product` });
    }

    let userCart = await Cart.findOne({ userId });

    if (!userCart) {
      userCart = new Cart({
        userId,
        items: [{
          productId,
          quantity: requestedQuantity,
          price: product.salePrice,
          totalPrice: product.salePrice * requestedQuantity,
        }]
      });
    } else {
      const existingProduct = userCart.items.find(item => item.productId.toString() === productId);

      if (existingProduct) {
        const newQuantity = existingProduct.quantity + requestedQuantity;

        if (newQuantity > maxQuantityLimit) {
          return res.json({ status: false, message: `Maximum ${maxQuantityLimit} items allowed per product` });
        }
        if (newQuantity > product.quantity) {
          return res.json({ status: false, message: `Only ${product.quantity} items in stock` });
        }

        existingProduct.quantity = newQuantity;
        existingProduct.totalPrice = newQuantity * existingProduct.price;
      } else {
        userCart.items.push({
          productId,
          quantity: requestedQuantity,
          price: product.salePrice,
          totalPrice: product.salePrice * requestedQuantity,
        });
      }
    }

    await userCart.save();

    await Wishlist.updateOne(
      { userId },
      { $pull: { items: { productId } } }
    );

    return res.json({
      status: true,
      message: "Product added to cart",
      cartLength: userCart.items.length
    });
  } catch (error) {
    console.error('Error in addToCart:', error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while adding to cart"
    });
  }
};

const changeQuantity = async (req, res) => {
  try {
    const { productId, action } = req.body;
    const userId = req.session.user;
    const maxQuantityLimit = 5;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ status: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(productId).populate('category');
    if (!product) {
      return res.status(404).json({ status: false, message: "Product not found" });
    }

    if (product.isBlocked) {
      return res.status(400).json({ status: false, message: "Product is blocked" });
    }
    if (!product.category || !product.category.isListed) {
      return res.status(400).json({ status: false, message: "Product category is unlisted" });
    }

    const userCart = await Cart.findOne({ userId });
    if (!userCart) {
      return res.status(404).json({ status: false, message: "Cart not found" });
    }

    const itemIndex = userCart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ status: false, message: "Product not found in cart" });
    }

    let item = userCart.items[itemIndex];
    let newQuantity = item.quantity;

    if (action === 'increase') {
      if (newQuantity >= maxQuantityLimit) {
        return res.status(400).json({ status: false, message: `Maximum ${maxQuantityLimit} items allowed per product` });
      }
      if (newQuantity >= product.quantity) {
        return res.status(400).json({ status: false, message: `Only ${product.quantity} items in stock` });
      }
      newQuantity++;
    } else if (action === 'decrease') {
      if (newQuantity > 1) {
        newQuantity--;
      } else {
        userCart.items.splice(itemIndex, 1);
        await userCart.save();
        return res.json({ 
          status: true, 
          message: "Product removed from cart", 
          quantity: 0,
          productPrice: item.price,
          grandTotal: userCart.items.reduce((acc, item) => acc + item.totalPrice, 0)
        });
      }
    } else {
      return res.status(400).json({ status: false, message: "Invalid action" });
    }

    item.quantity = newQuantity;
    item.totalPrice = newQuantity * item.price;

    await userCart.save();

    const grandTotal = userCart.items.reduce((acc, item) => acc + item.totalPrice, 0);

    return res.json({
      status: true,
      message: "Cart updated",
      quantity: newQuantity,
      productPrice: item.price,
      grandTotal
    });
  } catch (error) {
    console.error('Error in changeQuantity:', error);
    return res.status(500).json({ status: false, message: "Something went wrong" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const userId = req.session.user;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ status: false, message: "Invalid product ID" });
    }

    const userCart = await Cart.findOne({ userId });
    if (!userCart) {
      return res.status(404).json({ status: false, message: "Cart not found" });
    }

    const itemIndex = userCart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ status: false, message: "Product not in cart" });
    }

    userCart.items.splice(itemIndex, 1);
    await userCart.save();

    const grandTotal = userCart.items.reduce((acc, item) => acc + item.totalPrice, 0);

    return res.json({ 
      status: true, 
      message: "Product removed from cart",
      grandTotal
    });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    return res.status(500).json({ status: false, message: "Something went wrong" });
  }
};

const getCartTotal = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).json({ status: false, message: "User not authenticated" });
    }

    const userCart = await Cart.findOne({ userId });
    if (!userCart) {
      return res.json({ status: true, grandTotal: 0 });
    }

    const grandTotal = userCart.items.reduce((acc, item) => acc + item.totalPrice, 0);
    return res.json({ status: true, grandTotal });
  } catch (error) {
    console.error('Error in getCartTotal:', error);
    return res.status(500).json({ status: false, message: "Something went wrong" });
  }
};

const shareCart = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) return res.status(401).json({ status: false, message: "Not authenticated" });

    let userCart = await Cart.findOne({ userId });
    if (!userCart || userCart.items.length === 0) {
      return res.status(400).json({ status: false, message: "Cart is empty" });
    }

    let token;
    do {
      token = crypto.randomBytes(5).toString('hex');
    } while (await Cart.findOne({ shareToken: token }));

    userCart.shareToken = token;
    await userCart.save();

    const shareUrl = `${req.protocol}://${req.get('host')}/shared-cart/${token}`;
    return res.json({ status: true, shareUrl });
  } catch (error) {
    console.error('Error in shareCart:', error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

const getSharedCart = async (req, res) => {
  try {
    const { token } = req.params;

    const cart = await Cart.findOne({ shareToken: token }).populate({
      path: 'items.productId',
      populate: { path: 'category' }
    });

    if (!cart || cart.items.length === 0) {
      return res.render('sharedCart', { cartItems: [], grandTotal: 0, count: 0, message: 'Cart is empty or invalid link' });
    }

    const validCartItems = cart.items.filter(item => {
      return item.productId && !item.productId.isBlocked && item.productId.category && item.productId.category.isListed;
    });

    const cartItems = validCartItems.map(item => ({
      product: item.productId,
      quantity: item.quantity,
      totalPrice: item.productId.salePrice * item.quantity
    }));

    const grandTotal = cartItems.reduce((total, item) => total + item.totalPrice, 0);
    const cartCount = cartItems.length;

    res.render('sharedCart', {
      cartItems,
      grandTotal,
      count: cartCount,
      message: null
    });
  } catch (error) {
    console.error('Error loading shared cart:', error);
    res.status(500).send('Something went wrong');
  }
};

module.exports = {
  getCartPage,
  addToCart,
  changeQuantity,
  deleteProduct,
  getCartTotal,
  shareCart,
  getSharedCart
};
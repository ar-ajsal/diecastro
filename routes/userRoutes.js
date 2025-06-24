
// const express = require('express');
// const router = express.Router();
// const passport = require('passport');
// const userController = require('../controllers/user/userController');
// const profileController = require("../controllers/user/profileController");
// const productController = require("../controllers/user/productController");
// const cartController = require("../controllers/user/cartController");
// const wishlistController = require("../controllers/user/wishlistController");
// const checkoutController = require("../controllers/user/checkoutController");
// const orderController = require("../controllers/user/orderController");
// const couponController = require("../controllers/user/couponController");
// const multer = require("multer");
// const Address = require("../models/addressSchema");
// const staticController = require("../controllers/user/staticController");
// const walletController = require("../controllers/user/walletController");
// const Order = require("../models/orderSchema");
// const bannerController = require("../controllers/admin/bannerController");
// const blogController = require("../controllers/user/blogController");
// const addressController = require("../controllers/user/AddressController");
// const { userAuth, addCartWishlist, checkUserAuthWish, ajaxAuth } = require('../middlewares/auth');
// const { resetPasswordMiddleware, blockLoggedInUsers, checkBlockedUser, checkLoggedIn } = require("../middlewares/profileAuth");
// const path = require('path');
// const mongoose = require('mongoose');


// // Multer setup for image uploads (shared for profile and blog uploads)
// const storage = multer.diskStorage({
//   destination: './public/uploads/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // Middleware to validate ObjectId
// const isValidObjectId = (req, res, next) => {
//   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//     return res.status(404).send('Invalid blog ID');
//   }
//   next();
// };

// // Handle favicon.ico request
// router.get('/favicon.ico', (req, res) => {
//   res.status(204).end();
// });

// // General Routes
// router.get('/pagenotfound', userController.pageNotFound);

// // Authentication Routes
// router.get('/signup', checkLoggedIn, userController.loadSignUpPage);
// router.post('/signup', checkLoggedIn, userController.signUp);
// router.post('/verify-otp', userController.verifyOtp);
// router.post('/resend-otp', userController.resendOtp);

// router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// router.get('/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/signup' }),
//   (req, res) => {
//     req.session.user = req.user._id;
//     res.redirect('/');
//   });

// router.get('/login', checkLoggedIn, userController.loadLoginPage);
// router.post('/login', checkLoggedIn, userController.login);
// router.get('/logout', userController.logout);

// // Password Management
// router.get("/forgot-password", blockLoggedInUsers, profileController.getForgotPassPage);
// router.post("/forgot-email-valid", blockLoggedInUsers, profileController.forgotEmailValid);
// router.post("/verify-passForgot-otp", blockLoggedInUsers, profileController.verifyForgotPassOtp);
// router.get("/reset-password", resetPasswordMiddleware, profileController.getResetPassPage);
// router.post("/resend-forgot-otp", blockLoggedInUsers, profileController.resendOtp);
// router.post("/reset-password", resetPasswordMiddleware, profileController.postNewPassword);

// router.get('/change-password', userAuth, profileController.changePassword);
// router.post('/change-password', userAuth, profileController.changePassEmailValid);
// router.post('/change-password-otp', userAuth, profileController.verifypassemailOtp);
// router.get('/new-password', userAuth, profileController.getnewpasspage);
// router.post("/new-password", resetPasswordMiddleware, profileController.NewPassword);

// // Email Management
// router.get('/change-email', userAuth, profileController.changeEmail);
// router.post('/change-email', userAuth, profileController.changeEmailValid);
// router.post('/change-email-otp', userAuth, profileController.verifyemailOtp);
// router.get('/reset-email', userAuth, profileController.getresetemailpage);
// router.post("/reset-email", resetPasswordMiddleware, profileController.postNewEmail);

// // Profile Management
// router.get("/userProfile", userAuth, profileController.userProfile);
// router.get("/editProfile", userAuth, profileController.loadeditprofile);
// router.post("/editProfile", userAuth, upload.fields([{ name: 'image', maxCount: 1 }]), profileController.editprofile);

// // Home and Shop
// router.get('/', checkBlockedUser, userController.loadHomePage);
// router.get("/shop", userController.loadShoppingPage);
// router.get("/filter", userController.filterProduct);
// router.get('/search', userController.searchProducts);

// // Product Management
// router.get("/productDetails", productController.productDetails);
// router.post("/submitReview", userAuth, productController.submitReview);
// router.get("/getReviews", productController.getReviews);
// router.post("/compare/add/:id", productController.addToCompare);
// router.get("/compare/remove/:id", productController.removeFromCompare);
// router.get("/compare", productController.showCompare);

// // Wishlist Management
// router.get("/wishlist", userAuth, wishlistController.loadWishlist);
// router.post("/addToWishlist", ajaxAuth, wishlistController.addToWishlist);
// router.get("/removeFromWishList", userAuth, wishlistController.removeProduct);

// // Cart Management
// router.get("/cart", userAuth, cartController.getCartPage);
// router.post("/addToCart", userAuth, cartController.addToCart);
// router.post("/changeQuantity", userAuth, cartController.changeQuantity);
// router.get("/deleteItem", userAuth, cartController.deleteProduct);
// router.post('/shareCart', userAuth, cartController.shareCart);
// router.get('/shared-cart/:token', cartController.getSharedCart);

// // Checkout Management
// router.get("/checkout", userAuth, checkoutController.loadCheckoutPage);
// router.get("/addAddressCheckout", userAuth, checkoutController.addAddressCheckout);
// router.post("/addAddressCheckout", userAuth, checkoutController.postAddAddressCheckout);
// router.post("/checkStock", userAuth, checkoutController.checkStock);

// // Address Management
// router.post('/get-address-from-coordinates', addressController.getAddressFromCoordinates);
// router.get('/address', userAuth, addressController.loadAddress);
// router.post('/add-address', userAuth, addressController.postAddress);
// router.post('/editAddress', userAuth, addressController.editAddress);
// router.post('/delete-address/:id', userAuth, addressController.deleteAddress);
// router.post('/set-default-address', userAuth, async (req, res) => {
//   const { addressId } = req.body;
//   const userId = req.session.user;
//   try {
//     await Address.updateMany(
//       { userId, "address.isDefault": true },
//       { $set: { "address.$.isDefault": false } }
//     );
//     await Address.updateOne(
//       { userId, "address._id": addressId },
//       { $set: { "address.$.isDefault": true } }
//     );
//     console.log("Default address set successfully");
//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error setting default address:", error);
//     res.status(500).json({ success: false, message: "Failed to set default address" });
//   }
// });

// // Order Management
// router.post("/placeOrder", userAuth, orderController.placeOrder);
// router.post('/createRazorpayOrder', userAuth, orderController.createRazorpayOrder);
// router.post('/verifyPayment', userAuth, orderController.verifyPayment);
// router.get("/orders", userAuth, orderController.getOrders);
// router.get("/order-details", userAuth, orderController.loadOrderDetails);
// router.post("/orders/cancel", userAuth, orderController.cancelOrder);
// router.patch("/orders/return", userAuth, orderController.returnOrder);
// router.get("/download-invoice/:orderId", userAuth, orderController.downloadInvoice);
// router.post('/tester', userAuth, orderController.tester);

// // Coupon Management
// router.get("/coupons", userAuth, couponController.loadCoupons);
// router.post("/apply-coupon", userAuth, checkoutController.applyCoupon);

// // Wallet Management
// router.get('/wallet', userAuth, walletController.loadWallet);
// router.post('/wallet/create-razorpay-order', userAuth, walletController.createRazorpayOrder);
// router.post('/wallet/verify-payment', userAuth, walletController.verifyPayment);
// router.post('/wallet/withdraw-money', userAuth, walletController.withdrawMoney);
// router.post('/place-wallet-order', userAuth, orderController.placeWalletOrder);

// // Contact
// router.get("/contact", userController.loadContactPage);

// // Blog Routes
// router.get('/blogs', blogController.getBlogs);
// router.get('/blogs/add', userAuth, blogController.getAddBlog);
// router.post('/blogs/add', userAuth, upload.single('image'), blogController.postBlog);
// router.get('/blogs/:slug', blogController.getBlogDetails);
// router.post('/blogs/:slug/comment', userAuth, blogController.postComment);
// router.post('/blogs/:slug/like', userAuth, blogController.likeBlog);



// // Static Pages
// // router.get("/contact",staticController.loadContact)
// router.get("/about",staticController.loadAbout)


// module.exports = router;
const express = require('express');
const router = express.Router();
const passport = require('passport');
const userController = require('../controllers/user/userController');
const profileController = require("../controllers/user/profileController");
const productController = require("../controllers/user/productController");
const cartController = require("../controllers/user/cartController");
const wishlistController = require("../controllers/user/wishlistController");
const checkoutController = require("../controllers/user/checkoutController");
const orderController = require("../controllers/user/orderController");
const couponController = require("../controllers/user/couponController");
const multer = require("multer");
const Address = require("../models/addressSchema");
const staticController = require("../controllers/user/staticController");
const walletController = require("../controllers/user/walletController");
const Order = require("../models/orderSchema");
const bannerController = require("../controllers/admin/bannerController");
const blogController = require("../controllers/user/blogController");
const addressController = require("../controllers/user/AddressController");
const { userAuth, addCartWishlist, checkUserAuthWish, ajaxAuth } = require('../middlewares/auth');
const { resetPasswordMiddleware, blockLoggedInUsers, checkBlockedUser, checkLoggedIn } = require("../middlewares/profileAuth");
const path = require('path');
const mongoose = require('mongoose');

// Multer setup for image uploads (shared for profile and blog uploads)
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Middleware to validate ObjectId
const isValidObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).send('Invalid blog ID');
  }
  next();
};

// Handle favicon.ico request
router.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// General Routes
router.get('/pagenotfound', userController.pageNotFound);

// Authentication Routes
router.get('/signup', checkLoggedIn, userController.loadAuthPage);
router.post('/signup', checkLoggedIn, userController.signUp);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userController.resendOtp);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/signup' }),
  (req, res) => {
    req.session.user = req.user._id;
    res.redirect('/');
  });

router.get('/login', checkLoggedIn, userController.loadAuthPage);
router.post('/login', checkLoggedIn, userController.login);
router.get('/logout', userController.logout);

// Password Management
router.get("/forgot-password", blockLoggedInUsers, profileController.getForgotPassPage);
router.post("/forgot-email-valid", blockLoggedInUsers, profileController.forgotEmailValid);
router.post("/verify-passForgot-otp", blockLoggedInUsers, profileController.verifyForgotPassOtp);
router.get("/reset-password", resetPasswordMiddleware, profileController.getResetPassPage);
router.post("/resend-forgot-otp", blockLoggedInUsers, profileController.resendOtp);
router.post("/reset-password", resetPasswordMiddleware, profileController.postNewPassword);

router.get('/change-password', userAuth, profileController.changePassword);
router.post('/change-password', userAuth, profileController.changePassEmailValid);
router.post('/change-password-otp', userAuth, profileController.verifypassemailOtp);
router.get('/new-password', userAuth, profileController.getnewpasspage);
router.post("/new-password", resetPasswordMiddleware, profileController.NewPassword);

// Email Management
router.get('/change-email', userAuth, profileController.changeEmail);
router.post('/change-email', userAuth, profileController.changeEmailValid);
router.post('/change-email-otp', userAuth, profileController.verifyemailOtp);
router.get('/reset-email', userAuth, profileController.getresetemailpage);
router.post("/reset-email", resetPasswordMiddleware, profileController.postNewEmail);

// Profile Management
router.get("/userProfile", userAuth, profileController.userProfile);
router.get("/editProfile", userAuth, profileController.loadeditprofile);
router.post("/editProfile", userAuth, upload.fields([{ name: 'image', maxCount: 1 }]), profileController.editprofile);

// Home and Shop
router.get('/', checkBlockedUser, userController.loadHomePage);
router.get("/shop", userController.loadShoppingPage);
router.get("/filter", userController.filterProduct);
router.get('/search', userController.searchProducts);

// Product Management
router.get("/productDetails", productController.productDetails);
router.post("/submitReview", userAuth, productController.submitReview);
router.get("/getReviews", productController.getReviews);
router.post("/compare/add/:id", productController.addToCompare);
router.get("/compare/remove/:id", productController.removeFromCompare);
router.get("/compare", productController.showCompare);

// Wishlist Management
router.get("/wishlist", userAuth, wishlistController.loadWishlist);
router.post("/addToWishlist", ajaxAuth, wishlistController.addToWishlist);
router.get("/removeFromWishList", userAuth, wishlistController.removeProduct);

// Cart Management
router.get("/cart", userAuth, cartController.getCartPage);
router.post("/addToCart", userAuth, cartController.addToCart);
router.post("/changeQuantity", userAuth, cartController.changeQuantity);
router.get("/deleteItem", userAuth, cartController.deleteProduct);
router.post('/shareCart', userAuth, cartController.shareCart);
router.get('/shared-cart/:token', cartController.getSharedCart);

// Checkout Management
router.get("/checkout", userAuth, checkoutController.loadCheckoutPage);
router.get("/addAddressCheckout", userAuth, checkoutController.addAddressCheckout);
router.post("/addAddressCheckout", userAuth, checkoutController.postAddAddressCheckout);
router.post("/checkStock", userAuth, checkoutController.checkStock);

// Address Management
router.post('/get-address-from-coordinates', addressController.getAddressFromCoordinates);
router.get('/address', userAuth, addressController.loadAddress);
router.post('/add-address', userAuth, addressController.postAddress);
router.post('/editAddress', userAuth, addressController.editAddress);
router.post('/delete-address/:id', userAuth, addressController.deleteAddress);
router.post('/set-default-address', userAuth, async (req, res) => {
  const { addressId } = req.body;
  const userId = req.session.user;
  try {
    await Address.updateMany(
      { userId, "address.isDefault": true },
      { $set: { "address.$.isDefault": false } }
    );
    await Address.updateOne(
      { userId, "address._id": addressId },
      { $set: { "address.$.isDefault": true } }
    );
    console.log("Default address set successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ success: false, message: "Failed to set default address" });
  }
});

// Order Management
router.post("/placeOrder", userAuth, orderController.placeOrder);
router.post('/createRazorpayOrder', userAuth, orderController.createRazorpayOrder);
router.post('/verifyPayment', userAuth, orderController.verifyPayment);
router.get("/orders", userAuth, orderController.getOrders);
router.get("/order-details", userAuth, orderController.loadOrderDetails);
router.post("/orders/cancel", userAuth, orderController.cancelOrder);
router.patch("/orders/return", userAuth, orderController.returnOrder);
router.get("/download-invoice/:orderId", userAuth, orderController.downloadInvoice);
router.post('/tester', userAuth, orderController.tester);

// Coupon Management
router.get("/coupons", userAuth, couponController.loadCoupons);
router.post("/apply-coupon", userAuth, checkoutController.applyCoupon);

// Wallet Management
router.get('/wallet', userAuth, walletController.loadWallet);
router.post('/wallet/create-razorpay-order', userAuth, walletController.createRazorpayOrder);
router.post('/wallet/verify-payment', userAuth, walletController.verifyPayment);
router.post('/wallet/withdraw-money', userAuth, walletController.withdrawMoney);
router.post('/place-wallet-order', userAuth, orderController.placeWalletOrder);

// Contact
router.get("/contact", userController.loadContactPage);

// Blog Routes
router.get('/blogs', blogController.getBlogs);
router.get('/blogs/add', userAuth, blogController.getAddBlog);
router.post('/blogs/add', userAuth, upload.single('image'), blogController.postBlog);
router.get('/blogs/:slug', blogController.getBlogDetails);
router.post('/blogs/:slug/comment', userAuth, blogController.postComment);
router.post('/blogs/:slug/like', userAuth, blogController.likeBlog);

// Static Pages
router.get("/about", staticController.loadAbout);

module.exports = router;
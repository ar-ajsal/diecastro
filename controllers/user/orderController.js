
// const User = require("../../models/userSchema");
// const Product = require("../../models/productSchema");
// const Category = require("../../models/categorySchema");
// const Coupon = require("../../models/couponSchema");
// const Address = require("../../models/addressSchema");
// const Wallet = require("../../models/walletSchema");
// const Transaction = require("../../models/transactionSchema");
// const Razorpay = require("razorpay");
// const crypto = require("crypto");
// const env = require("dotenv").config();
// const Order = require("../../models/orderSchema");
// const fs = require("fs");
// const path = require("path");
// const ejs = require("ejs");
// const puppeteer = require("puppeteer");
// const Cart = require("../../models/cartSchema");

// const DELIVERY_CHARGE = 50;

// const distributeDiscount = (cartItems, totalDiscount) => {
//   const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
//   return cartItems.map((item) => {
//     const itemTotal = item.price * item.quantity;
//     const discountShare = totalDiscount > 0 ? (itemTotal / totalAmount) * totalDiscount : 0;
//     return {
//       ...item,
//       discountedPrice: item.price - discountShare / item.quantity,
//     };
//   });
// };

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// const placeOrder = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     const { addressId, paymentMethod, couponCode } = req.body;

//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     // Get cart
//     const cart = await Cart.findOne({ userId }).populate({
//       path: "items.productId",
//       model: "Product",
//     });

//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({ success: false, message: "Cart is empty" });
//     }

//     // Check stock availability
//     for (const item of cart.items) {
//       if (!item.productId) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid product in cart`,
//         });
//       }
//       if (item.productId.isBlocked || item.quantity > item.productId.quantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Product ${item.productId.productName} is ${item.productId.isBlocked ? "unavailable" : "out of stock"} (Available: ${item.productId.quantity}, Requested: ${item.quantity})`,
//         });
//       }
//     }

//     const address = await Address.findOne({ userId, "address._id": addressId });
//     if (!address) {
//       return res.status(400).json({ success: false, message: "Address not found" });
//     }

//     const selectedAddress = address.address.find((addr) => addr._id.toString() === addressId);

//     // Calculate total and apply coupon
//     const totalAmount = cart.items.reduce((sum, item) => sum + item.productId.salePrice * item.quantity, 0);
//     let discount = 0;
//     let couponApplied = false;

//     if (couponCode) {
//       const coupon = await Coupon.findOne({ name: couponCode, isList: true });
//       if (coupon && !coupon.userId.includes(userId)) {
//         if (new Date() > coupon.expireOn) {
//           return res.status(400).json({ success: false, message: "Coupon has expired" });
//         }
//         if (totalAmount < coupon.minimumPrice) {
//           return res.status(400).json({
//             success: false,
//             message: `Minimum purchase amount should be ₹${coupon.minimumPrice}`,
//           });
//         }
//         discount = coupon.offerPrice;
//         couponApplied = true;
//         await Coupon.findByIdAndUpdate(coupon._id, { $push: { userId } });
//       }
//     }

//     const finalAmount = totalAmount - discount + DELIVERY_CHARGE;
//     const discountedItems = distributeDiscount(
//       cart.items.map((item) => ({
//         product: item.productId._id,
//         productName: item.productId.productName,
//         productImages: item.productId.productImage,
//         quantity: item.quantity,
//         price: item.productId.salePrice,
//       })),
//       discount
//     );

//     // Create orders
//     const orders = await Promise.all(
//       discountedItems.map(async (item) => {
//         const product = await Product.findById(item.product).select("regularPrice productName productImage");
//         const order = new Order({
//           userId,
//           orderedItems: [
//             {
//               product: item.product,
//               productName: product.productName,
//               productImages: product.productImage,
//               quantity: item.quantity,
//               price: item.discountedPrice,
//               regularPrice: product.regularPrice,
//               status: "pending",
//             },
//           ],
//           totalPrice: item.price * item.quantity,
//           discount: item.price * item.quantity - item.discountedPrice * item.quantity,
//           finalAmount: item.discountedPrice * item.quantity + DELIVERY_CHARGE / discountedItems.length,
//           address: selectedAddress,
//           status: "pending",
//           paymentMethod,
//           couponApplied,
//           deliveryCharge: DELIVERY_CHARGE / discountedItems.length,
//           createdOn: new Date(),
//         });

//         await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
//         return order.save();
//       })
//     );

//     // Clear cart
//     await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

//     return res.json({
//       success: true,
//       orderIds: orders.map((order) => order.orderId),
//       message: "Orders placed successfully",
//     });
//   } catch (error) {
//     console.error("Error in placeOrder:", error.message, error.stack);
//     return res.status(500).json({ success: false, message: `Failed to place order: ${error.message}` });
//   }
// };

// const createRazorpayOrder = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const { addressId, couponCode } = req.body;

//     const cart = await Cart.findOne({ userId }).populate({
//       path: "items.productId",
//       model: "Product",
//     });

//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({ success: false, message: "Cart is empty" });
//     }

//     // Check stock availability
//     for (const item of cart.items) {
//       if (!item.productId) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid product in cart`,
//         });
//       }
//       if (item.productId.isBlocked || item.quantity > item.productId.quantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Product ${item.productId.productName} is ${item.productId.isBlocked ? "unavailable" : "out of stock"} (Available: ${item.productId.quantity}, Requested: ${item.quantity})`,
//         });
//       }
//     }

//     const address = await Address.findOne({ userId, "address._id": addressId });
//     if (!address) {
//       return res.status(400).json({ success: false, message: "Address not found" });
//     }

//     // Calculate total and apply coupon
//     const totalAmount = cart.items.reduce((sum, item) => sum + item.productId.salePrice * item.quantity, 0);
//     let discount = 0;

//     if (couponCode) {
//       const coupon = await Coupon.findOne({ name: couponCode, isList: true });
//       if (coupon && !coupon.userId.includes(userId)) {
//         if (new Date() > coupon.expireOn) {
//           return res.status(400).json({ success: false, message: "Coupon has expired" });
//         }
//         if (totalAmount < coupon.minimumPrice) {
//           return res.status(400).json({
//             success: false,
//             message: `Minimum purchase amount should be ₹${coupon.minimumPrice}`,
//           });
//         }
//         discount = coupon.offerPrice;
//       }
//     }

//     const finalAmount = totalAmount - discount + DELIVERY_CHARGE;

//     const user = await User.findById(userId);

//     const razorpayOrder = await razorpay.orders.create({
//       amount: Math.round(finalAmount * 100),
//       currency: "INR",
//       receipt: `order_${Date.now()}`,
//     });

//     res.json({
//       success: true,
//       razorpayKeyId: process.env.RAZORPAY_KEY_ID,
//       orderId: razorpayOrder.id,
//       amount: Math.round(finalAmount * 100),
//       currency: "INR",
//       customerName: user.name || "",
//       customerEmail: user.email || "",
//       customerPhone: user.phone || "",
//     });
//   } catch (error) {
//     console.error("Error in createRazorpayOrder:", error.message, error.stack);
//     res.status(500).json({ success: false, message: `Failed to create Razorpay order: ${error.message}` });
//   }
// };

// const verifyPayment = async (req, res) => {
//   try {
//     const { paymentResponse, orderData } = req.body;
//     const userId = req.session.user;

//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     // Verify payment signature
//     const sign = paymentResponse.razorpay_order_id + "|" + paymentResponse.razorpay_payment_id;
//     const expectedSign = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(sign)
//       .digest("hex");

//     if (expectedSign !== paymentResponse.razorpay_signature) {
//       return res.status(400).json({ success: false, message: "Invalid payment signature" });
//     }

//     const cart = await Cart.findOne({ userId }).populate({
//       path: "items.productId",
//       model: "Product",
//     });

//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({ success: false, message: "Cart is empty" });
//     }

//     // Check stock availability
//     for (const item of cart.items) {
//       if (!item.productId) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid product in cart`,
//         });
//       }
//       if (item.productId.isBlocked || item.quantity > item.productId.quantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Product ${item.productId.productName} is ${item.productId.isBlocked ? "unavailable" : "out of stock"} (Available: ${item.productId.quantity}, Requested: ${item.quantity})`,
//         });
//       }
//     }

//     const address = await Address.findOne({ userId, "address._id": orderData.addressId });
//     if (!address) {
//       return res.status(400).json({ success: false, message: "Address not found" });
//     }

//     const selectedAddress = address.address.find((addr) => addr._id.toString() === orderData.addressId);

//     // Calculate total and apply coupon
//     const totalAmount = cart.items.reduce((sum, item) => sum + item.productId.salePrice * item.quantity, 0);
//     let discount = 0;
//     let couponApplied = false;

//     if (orderData.couponCode) {
//       const coupon = await Coupon.findOne({ name: orderData.couponCode, isList: true });
//       if (coupon && !coupon.userId.includes(userId)) {
//         if (new Date() > coupon.expireOn) {
//           return res.status(400).json({ success: false, message: "Coupon has expired" });
//         }
//         if (totalAmount < coupon.minimumPrice) {
//           return res.status(400).json({
//             success: false,
//             message: `Minimum purchase amount should be ₹${coupon.minimumPrice}`,
//           });
//         }
//         discount = coupon.offerPrice;
//         couponApplied = true;
//         await Coupon.findByIdAndUpdate(coupon._id, { $push: { userId } });
//       }
//     }

//     const finalAmount = totalAmount - discount + DELIVERY_CHARGE;
//     const discountedItems = distributeDiscount(
//       cart.items.map((item) => ({
//         product: item.productId._id,
//         productName: item.productId.productName,
//         productImages: item.productId.productImage,
//         quantity: item.quantity,
//         price: item.productId.salePrice,
//       })),
//       discount
//     );

//     // Create orders
//     const orders = await Promise.all(
//       discountedItems.map(async (item) => {
//         const product = await Product.findById(item.product).select("regularPrice productName productImage");
//         const order = new Order({
//           userId,
//           orderedItems: [
//             {
//               product: item.product,
//               productName: product.productName,
//               productImages: product.productImage,
//               quantity: item.quantity,
//               price: item.discountedPrice,
//               regularPrice: product.regularPrice,
//               status: "pending",
//             },
//           ],
//           totalPrice: item.price * item.quantity,
//           discount: item.price * item.quantity - item.discountedPrice * item.quantity,
//           finalAmount: item.discountedPrice * item.quantity + DELIVERY_CHARGE / discountedItems.length,
//           address: selectedAddress,
//           status: "pending",
//           paymentMethod: "online",
//           couponApplied,
//           deliveryCharge: DELIVERY_CHARGE / discountedItems.length,
//           createdOn: new Date(),
//         });

//         await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
//         return order.save();
//       })
//     );

//     // Create transaction record
//     await Transaction.create({
//       userId,
//       amount: finalAmount,
//       transactionType: "debit",
//       paymentMethod: "online",
//       paymentGateway: "razorpay",
//       gatewayTransactionId: paymentResponse.razorpay_payment_id,
//       status: "completed",
//       purpose: "purchase",
//       description: "Online payment for order",
//       orders: orders.map((order) => ({
//         orderId: order.orderId,
//         amount: order.finalAmount,
//       })),
//     });

//     // Clear cart
//     await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

//     return res.json({
//       success: true,
//       orderIds: orders.map((order) => order.orderId),
//       message: "Orders placed successfully",
//     });
//   } catch (error) {
//     console.error("Error in verifyPayment:", error.message, error.stack);
//     return res.status(500).json({ success: false, message: `Payment verification failed: ${error.message}` });
//   }
// };

// const placeWalletOrder = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const { addressId, couponCode } = req.body;

//     const user = await User.findById(userId);
//     const cart = await Cart.findOne({ userId }).populate({
//       path: "items.productId",
//       model: "Product",
//     });

//     if (!user || !cart || cart.items.length === 0) {
//       return res.status(400).json({ success: false, message: "Cart is empty" });
//     }

//     // Check stock availability
//     for (const item of cart.items) {
//       if (!item.productId) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid product in cart`,
//         });
//       }
//       if (item.productId.isBlocked || item.quantity > item.productId.quantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Product ${item.productId.productName} is ${item.productId.isBlocked ? "unavailable" : "out of stock"} (Available: ${item.productId.quantity}, Requested: ${item.quantity})`,
//         });
//       }
//     }

//     const address = await Address.findOne({ userId, "address._id": addressId });
//     if (!address) {
//       return res.status(400).json({ success: false, message: "Address not found" });
//     }

//     const selectedAddress = address.address.find((addr) => addr._id.toString() === addressId);

//     const totalAmount = cart.items.reduce((sum, item) => sum + item.productId.salePrice * item.quantity, 0);
//     let discount = 0;
//     let couponApplied = false;

//     if (couponCode) {
//       const coupon = await Coupon.findOne({ name: couponCode, isList: true });
//       if (coupon && !coupon.userId.includes(userId)) {
//         if (new Date() > coupon.expireOn) {
//           return res.status(400).json({ success: false, message: "Coupon has expired" });
//         }
//         if (totalAmount < coupon.minimumPrice) {
//           return res.status(400).json({
//             success: false,
//             message: `Minimum purchase amount should be ₹${coupon.minimumPrice}`,
//           });
//         }
//         discount = coupon.offerPrice;
//         couponApplied = true;
//         await Coupon.findByIdAndUpdate(coupon._id, { $push: { userId } });
//       }
//     }

//     const finalAmount = totalAmount - discount + DELIVERY_CHARGE;

//     const wallet = await Wallet.findOne({ userId });
//     if (!wallet || wallet.balance < finalAmount) {
//       return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
//     }

//     const discountedItems = distributeDiscount(
//       cart.items.map((item) => ({
//         product: item.productId._id,
//         productName: item.productId.productName,
//         productImages: item.productId.productImage,
//         quantity: item.quantity,
//         price: item.productId.salePrice,
//       })),
//       discount
//     );

//     const orders = await Promise.all(
//       discountedItems.map(async (item) => {
//         const product = await Product.findById(item.product).select("regularPrice productName productImage");
//         const order = new Order({
//           userId,
//           orderedItems: [
//             {
//               product: item.product,
//               productName: product.productName,
//               productImages: product.productImage,
//               quantity: item.quantity,
//               price: item.discountedPrice,
//               regularPrice: product.regularPrice,
//               status: "pending",
//             },
//           ],
//           totalPrice: item.price * item.quantity,
//           discount: item.price * item.quantity - item.discountedPrice * item.quantity,
//           finalAmount: item.discountedPrice * item.quantity + DELIVERY_CHARGE / discountedItems.length,
//           address: selectedAddress,
//           status: "pending",
//           paymentMethod: "wallet",
//           couponApplied,
//           deliveryCharge: DELIVERY_CHARGE / discountedItems.length,
//           createdOn: new Date(),
//         });

//         await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
//         return order.save();
//       })
//     );

//     wallet.balance -= finalAmount;
//     wallet.totalDebited += finalAmount;
//     wallet.transactions.push({
//       amount: finalAmount,
//       transactionType: "debit",
//       transactionPurpose: "purchase",
//       description: "Order payment from wallet",
//     });

//     await wallet.save();

//     await Transaction.create({
//       userId,
//       amount: finalAmount,
//       transactionType: "debit",
//       paymentMethod: "wallet",
//       paymentGateway: "wallet",
//       status: "completed",
//       purpose: "purchase",
//       description: "Order payment from wallet",
//       orders: orders.map((order) => ({
//         orderId: order.orderId,
//         amount: order.finalAmount,
//       })),
//       walletBalanceAfter: wallet.balance,
//     });

//     await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

//     return res.json({
//       success: true,
//       orderIds: orders.map((order) => order.orderId),
//       message: "Orders placed successfully",
//     });
//   } catch (error) {
//     console.error("Error in placeWalletOrder:", error.message, error.stack);
//     return res.status(500).json({ success: false, message: `Failed to place order: ${error.message}` });
//   }
// };

// const getOrders = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const orders = await Order.find({ userId })
//       .populate({
//         path: "orderedItems.product",
//         select: "productName productImage price",
//       })
//       .sort({ createdOn: -1 });

//     const user = await User.findById(userId);

//     res.render("orders", {
//       orders,
//       user,
//       count: 10,
//       session: req.session.user,
//     });
//   } catch (error) {
//     console.error("Error in getOrders:", error.message, error.stack);
//     res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
//   }
// };

// const loadOrderDetails = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const orderId = req.query.orderId;
//     const order = await Order.findOne({ orderId, userId }).populate("orderedItems.product");
//     if (!order) {
//       return res.status(404).send("Order not found");
//     }

//     const user = await User.findById(userId);

//     res.render("order-details", {
//       order,
//       user,
//       count: 10,
//       session: req.session.user,
//     });
//   } catch (error) {
//     console.error("Error in loadOrderDetails:", error.message, error.stack);
//     res.status(500).send(`Internal server error: ${error.message}`);
//   }
// };

// const cancelOrder = async (req, res) => {
//   try {
//     const { orderId, reason } = req.body;
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const order = await Order.findOne({ _id: orderId, userId });
//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     if (order.status !== "cancelled" && order.status !== "delivered") {
//       order.status = "cancelled";
//       order.cancelReason = reason;
//       order.orderedItems.forEach((item) => {
//         item.status = "cancelled";
//         item.cancelReason = reason;
//       });

//       for (const item of order.orderedItems) {
//         await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
//       }

//       if (order.paymentMethod !== "cod") {
//         await processRefund(userId, order);
//       }

//       await order.save();
//       res.json({ success: true, message: "Order cancelled successfully" });
//     } else {
//       res.status(400).json({ success: false, message: "Order cannot be cancelled" });
//     }
//   } catch (error) {
//     console.error("Error in cancelOrder:", error.message, error.stack);
//     res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
//   }
// };

// const returnOrder = async (req, res) => {
//   try {
//     const { orderId, reason } = req.body;
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const order = await Order.findOne({ _id: orderId, userId });
//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     if (order.status === "delivered") {
//       order.status = "return_requested";
//       order.returnReason = reason;
//       order.orderedItems.forEach((item) => {
//         item.status = "return_requested";
//         item.returnReason = reason;
//       });

//       await order.save();
//       res.json({ success: true, message: "Return request submitted successfully" });
//     } else {
//       res.status(400).json({ success: false, message: "Only delivered orders can be returned" });
//     }
//   } catch (error) {
//     console.error("Error in returnOrder:", error.message, error.stack);
//     res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
//   }
// };

// const processRefund = async (userId, order) => {
//   try {
//     let wallet = await Wallet.findOne({ userId });
//     if (!wallet) {
//       wallet = new Wallet({ userId, balance: 0 });
//     }

//     const refundAmount = order.finalAmount - order.deliveryCharge;

//     wallet.balance += refundAmount;
//     wallet.refundAmount += refundAmount;
//     wallet.transactions.push({
//       amount: refundAmount,
//       transactionType: "credit",
//       transactionPurpose: "refund",
//       description: `Refund for ${order.status === "cancelled" ? "cancelled" : "returned"} order #${order.orderId}`,
//     });

//     await wallet.save();

//     await Transaction.create({
//       userId,
//       amount: refundAmount,
//       transactionType: "credit",
//       paymentMethod: "refund",
//       paymentGateway: order.paymentMethod === "online" ? "razorpay" : "wallet",
//       status: "completed",
//       purpose: order.status === "cancelled" ? "cancellation" : "return",
//       description: `Refund for ${order.status === "cancelled" ? "cancelled" : "returned"} order #${order.orderId}`,
//       orders: [{ orderId: order.orderId, amount: refundAmount }],
//       walletBalanceAfter: wallet.balance,
//     });

//     return true;
//   } catch (error) {
//     console.error("Error processing refund:", error.message, error.stack);
//     return false;
//   }
// };

// const cancelReturnRequest = async (req, res) => {
//   try {
//     const { orderId } = req.body;
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const order = await Order.findOne({ _id: orderId, userId });
//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     if (order.status !== "return_requested" || order.requestStatus !== "pending") {
//       return res.status(400).json({ success: false, message: "Return request cannot be cancelled" });
//     }

//     order.status = "delivered";
//     order.returnReason = undefined;
//     order.requestStatus = undefined;
//     order.adminMessage = undefined;
//     order.updatedOn = new Date();

//     await order.save();

//     res.json({ success: true, message: "Return request cancelled successfully" });
//   } catch (error) {
//     console.error("Error in cancelReturnRequest:", error.message, error.stack);
//     res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
//   }
// };

// const generateInvoice = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const orderId = req.query.orderId;
//     const order = await Order.findOne({ orderId, userId });
//     if (!order) {
//       return res.status(404).send("Order not found");
//     }

//     if (order.status !== "delivered") {
//       return res.status(400).send("Invoice is only available for delivered orders");
//     }

//     if (!order.invoiceDate) {
//       order.invoiceDate = new Date();
//       await order.save();
//     }

//     const templatePath = path.join(__dirname, "../../views/user/invoice-template.ejs");
//     const html = await ejs.renderFile(templatePath, { order });

//     const browser = await puppeteer.launch({ headless: true });
//     const page = await browser.newPage();

//     await page.setContent(html, { waitUntil: "networkidle0" });

//     const invoiceDir = path.join(__dirname, "../../public/invoices");
//     if (!fs.existsSync(invoiceDir)) {
//       fs.mkdirSync(invoiceDir, { recursive: true });
//     }

//     const fileName = `invoice-${order.orderId}.pdf`;
//     const filePath = path.join(invoiceDir, fileName);

//     await page.pdf({
//       path: filePath,
//       format: "A4",
//       printBackground: true,
//       margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
//     });

//     await browser.close();

//     res.download(filePath, fileName, (err) => {
//       if (err) {
//         console.error("Error sending file:", err.message, err.stack);
//         res.status(500).send(`Error generating invoice: ${err.message}`);
//       }
//     });
//   } catch (error) {
//     console.error("Error generating invoice:", error.message, error.stack);
//     res.status(500).send(`Error generating invoice: ${err.message}`);
//   }
// };

// module.exports = {
//   placeOrder,
//   getOrders,
//   loadOrderDetails,
//   cancelOrder,
//   returnOrder,
//   generateInvoice,
//   createRazorpayOrder,
//   verifyPayment,
//   placeWalletOrder,
//   processRefund,
//   cancelReturnRequest,
// };

// const User = require("../../models/userSchema");
// const Product = require("../../models/productSchema");
// const Category = require("../../models/categorySchema");
// const Coupon = require("../../models/couponSchema");
// const Address = require("../../models/addressSchema");
// const Wallet = require("../../models/walletSchema");
// const Transaction = require("../../models/transactionSchema");
// const Razorpay = require("razorpay");
// const crypto = require("crypto");
// const env = require("dotenv").config();
// const Order = require("../../models/orderSchema");
// const fs = require("fs");
// const generateInvoice = require('../../utils/generateInvoice');
// const path = require('path');
// const ejs = require("ejs");

// const Cart = require("../../models/cartSchema");

// const DELIVERY_CHARGE = 50;

// const distributeDiscount = (cartItems, totalDiscount) => {
//   const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
//   return cartItems.map((item) => {
//     const itemTotal = item.price * item.quantity;
//     const discountShare = totalDiscount > 0 ? (itemTotal / totalAmount) * totalDiscount : 0;
//     return {
//       ...item,
//       discountedPrice: item.price - discountShare / item.quantity,
//     };
//   });
// };

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// const placeOrder = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     const { addressId, paymentMethod, couponCode } = req.body;

//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     // Get cart
//     const cart = await Cart.findOne({ userId }).populate({
//       path: "items.productId",
//       model: "Product",
//     });

//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({ success: false, message: "Cart is empty" });
//     }

//     // Check stock availability
//     for (const item of cart.items) {
//       if (!item.productId) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid product in cart`,
//         });
//       }
//       if (item.productId.isBlocked || item.quantity > item.productId.quantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Product ${item.productId.productName} is ${item.productId.isBlocked ? "unavailable" : "out of stock"} (Available: ${item.productId.quantity}, Requested: ${item.quantity})`,
//         });
//       }
//     }
    

//     const address = await Address.findOne({ userId, "address._id": addressId });
//     if (!address) {
//       return res.status(400).json({ success: false, message: "Address not found" });
//     }

//     const selectedAddress = address.address.find((addr) => addr._id.toString() === addressId);

//     // Calculate total and apply coupon
//     const totalAmount = cart.items.reduce((sum, item) => sum + item.productId.salePrice * item.quantity, 0);
//     let discount = 0;
//     let couponApplied = false;

//     if (couponCode) {
//       const coupon = await Coupon.findOne({ name: couponCode, isList: true });
//       if (coupon && !coupon.userId.includes(userId)) {
//         if (new Date() > coupon.expireOn) {
//           return res.status(400).json({ success: false, message: "Coupon has expired" });
//         }
//         if (totalAmount < coupon.minimumPrice) {
//           return res.status(400).json({
//             success: false,
//             message: `Minimum purchase amount should be ₹${coupon.minimumPrice}`,
//           });
//         }
//         discount = coupon.offerPrice;
//         couponApplied = true;
//         await Coupon.findByIdAndUpdate(coupon._id, { $push: { userId } });
//       }
//     }

//     const finalAmount = totalAmount - discount + DELIVERY_CHARGE;
//     const discountedItems = distributeDiscount(
//       cart.items.map((item) => ({
//         product: item.productId._id,
//         productName: item.productId.productName,
//         productImages: item.productId.productImage,
//         quantity: item.quantity,
//         price: item.productId.salePrice,
//       })),
//       discount
//     );

//     // Create orders
//     const orders = await Promise.all(
//       discountedItems.map(async (item) => {
//         const product = await Product.findById(item.product).select("regularPrice productName productImage");
//         const order = new Order({
//           userId,
//           orderedItems: [
//             {
//               product: item.product,
//               productName: product.productName,
//               productImages: product.productImage,
//               quantity: item.quantity,
//               price: item.discountedPrice,
//               regularPrice: product.regularPrice,
//               status: "pending",
//             },
//           ],
//           totalPrice: item.price * item.quantity,
//           discount: item.price * item.quantity - item.discountedPrice * item.quantity,
//           finalAmount: item.discountedPrice * item.quantity + DELIVERY_CHARGE / discountedItems.length,
//           address: selectedAddress,
//           status: "pending",
//           paymentMethod,
//           couponApplied,
//           deliveryCharge: DELIVERY_CHARGE / discountedItems.length,
//           createdOn: new Date(),
//         });

//         await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
//         return order.save();
//       })
//     );

//     // Clear cart
//     await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

//     // Fetch user details for rendering
//     const user = await User.findById(userId);

//     // Render order success page
//     return res.render("order-success", {
//       user,
//       orderIds: orders.map((order) => order.orderId),
//       session: req.session.user,
//     });
//   } catch (error) {
//     console.error("Error in placeOrder:", error.message, error.stack);
//     return res.status(500).json({ success: false, message: `Failed to place order: ${error.message}` });
//   }
// };

// const createRazorpayOrder = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const { addressId, couponCode } = req.body;

//     const cart = await Cart.findOne({ userId }).populate({
//       path: "items.productId",
//       model: "Product",
//     });

//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({ success: false, message: "Cart is empty" });
//     }

//     // Check stock availability
//     for (const item of cart.items) {
//       if (!item.productId) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid product in cart`,
//         });
//       }
//       if (item.productId.isBlocked || item.quantity > item.productId.quantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Product ${item.productId.productName} is ${item.productId.isBlocked ? "unavailable" : "out of stock"} (Available: ${item.productId.quantity}, Requested: ${item.quantity})`,
//         });
//       }
//     }

//     const address = await Address.findOne({ userId, "address._id": addressId });
//     if (!address) {
//       return res.status(400).json({ success: false, message: "Address not found" });
//     }

//     // Calculate total and apply coupon
//     const totalAmount = cart.items.reduce((sum, item) => sum + item.productId.salePrice * item.quantity, 0);
//     let discount = 0;

//     if (couponCode) {
//       const coupon = await Coupon.findOne({ name: couponCode, isList: true });
//       if (coupon && !coupon.userId.includes(userId)) {
//         if (new Date() > coupon.expireOn) {
//           return res.status(400).json({ success: false, message: "Coupon has expired" });
//         }
//         if (totalAmount < coupon.minimumPrice) {
//           return res.status(400).json({
//             success: false,
//             message: `Minimum purchase amount should be ₹${coupon.minimumPrice}`,
//           });
//         }
//         discount = coupon.offerPrice;
//       }
//     }

//     const finalAmount = totalAmount - discount + DELIVERY_CHARGE;

//     const user = await User.findById(userId);

//     const razorpayOrder = await razorpay.orders.create({
//       amount: Math.round(finalAmount * 100),
//       currency: "INR",
//       receipt: `order_${Date.now()}`,
//     });

//     res.json({
//       success: true,
//       razorpayKeyId: process.env.RAZORPAY_KEY_ID,
//       orderId: razorpayOrder.id,
//       amount: Math.round(finalAmount * 100),
//       currency: "INR",
//       customerName: user.name || "",
//       customerEmail: user.email || "",
//       customerPhone: user.phone || "",
//     });
//   } catch (error) {
//     console.error("Error in createRazorpayOrder:", error.message, error.stack);
//     res.status(500).json({ success: false, message: `Failed to create Razorpay order: ${error.message}` });
//   }
// };

// const verifyPayment = async (req, res) => {
//   try {
//     const { paymentResponse, orderData } = req.body;
//     const userId = req.session.user;

//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     // Verify payment signature
//     const sign = paymentResponse.razorpay_order_id + "|" + paymentResponse.razorpay_payment_id;
//     const expectedSign = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(sign)
//       .digest("hex");

//     if (expectedSign !== paymentResponse.razorpay_signature) {
//       return res.status(400).json({ success: false, message: "Invalid payment signature" });
//     }

//     const cart = await Cart.findOne({ userId }).populate({
//       path: "items.productId",
//       model: "Product",
//     });

//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({ success: false, message: "Cart is empty" });
//     }

//     // Check stock availability
//     for (const item of cart.items) {
//       if (!item.productId) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid product in cart`,
//         });
//       }
//       if (item.productId.isBlocked || item.quantity > item.productId.quantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Product ${item.productId.productName} is ${item.productId.isBlocked ? "unavailable" : "out of stock"} (Available: ${item.productId.quantity}, Requested: ${item.quantity})`,
//         });
//       }
//     }

//     const address = await Address.findOne({ userId, "address._id": orderData.addressId });
//     if (!address) {
//       return res.status(400).json({ success: false, message: "Address not found" });
//     }

//     const selectedAddress = address.address.find((addr) => addr._id.toString() === orderData.addressId);

//     // Calculate total and apply coupon
//     const totalAmount = cart.items.reduce((sum, item) => sum + item.productId.salePrice * item.quantity, 0);
//     let discount = 0;
//     let couponApplied = false;

//     if (orderData.couponCode) {
//       const coupon = await Coupon.findOne({ name: orderData.couponCode, isList: true });
//       if (coupon && !coupon.userId.includes(userId)) {
//         if (new Date() > coupon.expireOn) {
//           return res.status(400).json({ success: false, message: "Coupon has expired" });
//         }
//         if (totalAmount < coupon.minimumPrice) {
//           return res.status(400).json({
//             success: false,
//             message: `Minimum purchase amount should be ₹${coupon.minimumPrice}`,
//           });
//         }
//         discount = coupon.offerPrice;
//         couponApplied = true;
//         await Coupon.findByIdAndUpdate(coupon._id, { $push: { userId } });
//       }
//     }

//     const finalAmount = totalAmount - discount + DELIVERY_CHARGE;
//     const discountedItems = distributeDiscount(
//       cart.items.map((item) => ({
//         product: item.productId._id,
//         productName: item.productId.productName,
//         productImages: item.productId.productImage,
//         quantity: item.quantity,
//         price: item.productId.salePrice,
//       })),
//       discount
//     );

//     // Create orders
//     const orders = await Promise.all(
//       discountedItems.map(async (item) => {
//         const product = await Product.findById(item.product).select("regularPrice productName productImage");
//         const order = new Order({
//           userId,
//           orderedItems: [
//             {
//               product: item.product,
//               productName: product.productName,
//               productImages: product.productImage,
//               quantity: item.quantity,
//               price: item.discountedPrice,
//               regularPrice: product.regularPrice,
//               status: "pending",
//             },
//           ],
//           totalPrice: item.price * item.quantity,
//           discount: item.price * item.quantity - item.discountedPrice * item.quantity,
//           finalAmount: item.discountedPrice * item.quantity + DELIVERY_CHARGE / discountedItems.length,
//           address: selectedAddress,
//           status: "pending",
//           paymentMethod: "online",
//           couponApplied,
//           deliveryCharge: DELIVERY_CHARGE / discountedItems.length,
//           createdOn: new Date(),
//         });

//         await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
//         return order.save();
//       })
//     );

//     // Create transaction record
//     await Transaction.create({
//       userId,
//       amount: finalAmount,
//       transactionType: "debit",
//       paymentMethod: "online",
//       paymentGateway: "razorpay",
//       gatewayTransactionId: paymentResponse.razorpay_payment_id,
//       status: "completed",
//       purpose: "purchase",
//       description: "Online payment for order",
//       orders: orders.map((order) => ({
//         orderId: order.orderId,
//         amount: order.finalAmount,
//       })),
//     });

//     // Clear cart
//     await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

//     // Fetch user details for rendering
//     const user = await User.findById(userId);

//     // Render order success page
//     return res.render("order-success", {
//       user,
//       orderIds: orders.map((order) => order.orderId),
//       session: req.session.user,
//     });
//   } catch (error) {
//     console.error("Error in verifyPayment:", error.message, error.stack);
//     return res.status(500).json({ success: false, message: `Payment verification failed: ${error.message}` });
//   }
// };

// const placeWalletOrder = async (req, res) => {
//   try {
//     const userId = req.session.user;
 
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const { addressId, couponCode } = req.body;

//     const user = await User.findById(userId);
//     const cart = await Cart.findOne({ userId }).populate({
//       path: "items.productId",
//       model: "Product",
//     });

//     if (!user || !cart || cart.items.length === 0) {
//       return res.status(400).json({ success: false, message: "Cart is empty" });
//     }

//     // Check stock availability
//     for (const item of cart.items) {
//       if (!item.productId) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid product in cart`,
//         });
//       }
//       if (item.productId.isBlocked || item.quantity > item.productId.quantity) {
//         return res.status(400).json({
//           success: false,
//           message: `Product ${item.productId.productName} is ${item.productId.isBlocked ? "unavailable" : "out of stock"} (Available: ${item.productId.quantity}, Requested: ${item.quantity})`,
//         });
//       }
//     }
  

//     const address = await Address.findOne({ userId, "address._id": addressId });
//     if (!address) {
//       return res.status(400).json({ success: false, message: "Address not found" });
//     }

//     const selectedAddress = address.address.find((addr) => addr._id.toString() === addressId);

//     const totalAmount = cart.items.reduce((sum, item) => sum + item.productId.salePrice * item.quantity, 0);
//     let discount = 0;
//     let couponApplied = false;

//     if (couponCode) {
//       const coupon = await Coupon.findOne({ name: couponCode, isList: true });
//       if (coupon && !coupon.userId.includes(userId)) {
//         if (new Date() > coupon.expireOn) {
//           return res.status(400).json({ success: false, message: "Coupon has expired" });
//         }
//         if (totalAmount < coupon.minimumPrice) {
//           return res.status(400).json({
//             success: false,
//             message: `Minimum purchase amount should be ₹${coupon.minimumPrice}`,
//           });
//         }
//         discount = coupon.offerPrice;
//         couponApplied = true;
//         await Coupon.findByIdAndUpdate(coupon._id, { $push: { userId } });
//       }
//     }



//     const finalAmount = totalAmount - discount + DELIVERY_CHARGE;

//     const wallet = await Wallet.findOne({ userId });
//     if (!wallet || wallet.balance < finalAmount) {
//       return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
//     }

//     const discountedItems = distributeDiscount(
//       cart.items.map((item) => ({
//         product: item.productId._id,
//         productName: item.productId.productName,
//         productImages: item.productId.productImage,
//         quantity: item.quantity,
//         price: item.productId.salePrice,
//       })),
//       discount
//     );


    

//     const orders = await Promise.all(
//       discountedItems.map(async (item) => {
//         const product = await Product.findById(item.product).select("regularPrice productName productImage");
//         const order = new Order({
//           userId,
//           orderedItems: [
//             {
//               product: item.product,
//               productName: product.productName,
//               productImages: product.productImage,
//               quantity: item.quantity,
//               price: item.discountedPrice,
//               regularPrice: product.regularPrice,
//               status: "pending",
//             },
//           ],
//           totalPrice: item.price * item.quantity,
//           discount: item.price * item.quantity - item.discountedPrice * item.quantity,
//           finalAmount: item.discountedPrice * item.quantity + DELIVERY_CHARGE / discountedItems.length,
//           address: selectedAddress,
//           status: "pending",
//           paymentMethod: "wallet",
//           couponApplied,
//           deliveryCharge: DELIVERY_CHARGE / discountedItems.length,
//           createdOn: new Date(),
//         });

//         await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
//         return order.save();
//       })
//     );


//     wallet.balance -= finalAmount;
//     wallet.totalDebited += finalAmount;
//     wallet.transactions.push({
//       amount: finalAmount,
//       transactionType: "debit",
//       transactionPurpose: "purchase",
//       type:"debit",
//       description: "Order payment from wallet",
//     });

//     await wallet.save();

//     await Transaction.create({
//       userId,
//       amount: finalAmount,
//       transactionType: "debit",
//       paymentMethod: "wallet",
//       paymentGateway: "wallet",
//       status: "completed",
//       purpose: "purchase",
//       description: "Order payment from wallet",
//       orders: orders.map((order) => ({
//         orderId: order.orderId,
//         amount: order.finalAmount,
//       })),
//       walletBalanceAfter: wallet.balance,
//     });

//     await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

//     // Render order success page
//     return res.render("order-success", {
//       user,
//       orderIds: orders.map((order) => order.orderId),
//       session: req.session.user,
//     });

//   } catch (error) {
//     console.error("Error in placeWalletOrder:", error.message, error.stack);
//     return res.status(500).json({ success: false, message: `Failed to place order: ${error.message}` });
//   }
// };

// // Other functions (getOrders, loadOrderDetails, etc.) remain unchanged
// // const getOrders = async (req, res) => {
// //   try {
// //     const userId = req.session.user;
// //     if (!userId) {
// //       return res.status(401).json({ success: false, message: "User not authenticated" });
// //     }

// //     const orders = await Order.find({ userId })
// //       .populate({
// //         path: "orderedItems.product",
// //         select: "productName productImage price",
// //       })
// //       .sort({ createdOn: -1 });

// //     const user = await User.findById(userId);

// //     res.render("orders", {
// //       orders,
// //       user,
// //       count: 10,
// //       session: req.session.user,
// //     });
// //   } catch (error) {
// //     console.error("Error in getOrders:", error.message, error.stack);
// //     res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
// //   }
// // };
// const getOrders = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const page = parseInt(req.query.page) || 1;
//     const limit = 5; // or any number you prefer
//     const skip = (page - 1) * limit;

//     const [orders, totalOrders, user] = await Promise.all([
//       Order.find({ userId })
//         .populate({
//           path: "orderedItems.product",
//           select: "productName productImage price",
//         })
//         .sort({ createdOn: -1 })
//         .skip(skip)
//         .limit(limit),
//       Order.countDocuments({ userId }),
//       User.findById(userId)
//     ]);

//     const totalPages = Math.ceil(totalOrders / limit);

//     res.render("orders", {
//       orders,
//       user,
//       currentPage: page,
//       totalPages,
//       session: req.session.user,
//     });
//   } catch (error) {
//     console.error("Error in getOrders:", error.message, error.stack);
//     res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
//   }
// };

// const loadOrderDetails = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const orderId = req.query.orderId;
//     const order = await Order.findOne({ orderId, userId }).populate("orderedItems.product");
//     if (!order) {
//       return res.status(404).send("Order not found");
//     }

//     const user = await User.findById(userId);

//     res.render("order-details", {
//       order,
//       user,
//       count: 10,
//       session: req.session.user,
//     });
//   } catch (error) {
//     console.error("Error in loadOrderDetails:", error.message, error.stack);
//     res.status(500).send(`Internal server error: ${error.message}`);
//   }
// };

// const cancelOrder = async (req, res) => {
//   try {
//     const { orderId, reason } = req.body;
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const order = await Order.findOne({ _id: orderId, userId });
//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     if (order.status !== "cancelled" && order.status !== "delivered") {
//       order.status = "cancelled";
//       order.cancelReason = reason;
//       order.orderedItems.forEach((item) => {
//         item.status = "cancelled";
//         item.cancelReason = reason;
//       });

//       for (const item of order.orderedItems) {
//         await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
//       }

//       if (order.paymentMethod !== "cod") {
//         await processRefund(userId, order);
//       }

//       await order.save();
//       res.json({ success: true, message: "Order cancelled successfully" });
//     } else {
//       res.status(400).json({ success: false, message: "Order cannot be cancelled" });
//     }
//   } catch (error) {
//     console.error("Error in cancelOrder:", error.message, error.stack);
//     res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
//   }
// };

// const returnOrder = async (req, res) => {
//   try {
//     const { orderId, reason } = req.body;
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const order = await Order.findOne({ _id: orderId, userId });
//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     if (order.status === "delivered") {
//       order.status = "return_requested";
//       order.returnReason = reason;
//       order.orderedItems.forEach((item) => {
//         item.status = "return_requested";
//         item.returnReason = reason;
//       });

//       await order.save();
//       res.json({ success: true, message: "Return request submitted successfully" });
//     } else {
//       res.status(400).json({ success: false, message: "Only delivered orders can be returned" });
//     }
//   } catch (error) {
//     console.error("Error in returnOrder:", error.message, error.stack);
//     res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
//   }
// };

// // const processRefund = async (userId, order) => {
// //   try {
// //     let wallet = await Wallet.findOne({ userId });
// //     if (!wallet) {
// //       wallet = new Wallet({ userId, balance: 0 });
// //     }

// //     const refundAmount = order.finalAmount - order.deliveryCharge;

// //     wallet.balance += refundAmount;
// //     wallet.refundAmount += refundAmount;
// //     wallet.transactions.push({
// //       amount: refundAmount,
// //       transactionType: "credit",
// //       transactionPurpose: "refund",
// //       description: `Refund for ${order.status === "cancelled" ? "cancelled" : "returned"} order #${order.orderId}`,
// //     });

// //     await wallet.save();

// //     await Transaction.create({
// //       userId,
// //       amount: refundAmount,
// //       transactionType: "credit",
// //       paymentMethod: "refund",
// //       paymentGateway: order.paymentMethod === "online" ? "razorpay" : "wallet",
// //       status: "completed",
// //       purpose: order.status === "cancelled" ? "cancellation" : "return",
// //       description: `Refund for ${order.status === "cancelled" ? "cancelled" : "returned"} order #${order.orderId}`,
// //       orders: [{ orderId: order.orderId, amount: refundAmount }],
// //       walletBalanceAfter: wallet.balance,
// //     });

// //     return true;
// //   } catch (error) {
// //     console.error("Error processing refund:", error.message, error.stack);
// //     return false;
// //   }
// // };
// const processRefund = async (userId, order) => {
//   try {
//     let wallet = await Wallet.findOne({ userId });
//     if (!wallet) {
//       wallet = new Wallet({ userId, balance: 0 });
//     }

//     const finalAmount = Number(order.finalAmount) || 0;
//     const deliveryCharge = Number(order.deliveryCharge) || 0;
//     const refundAmount = finalAmount - deliveryCharge;
    
//     if (isNaN(refundAmount) || refundAmount < 0) {
//       throw new Error("Invalid refund amount");
//     }

//     wallet.balance = Number(wallet.balance) + refundAmount;

//     wallet.transactions.push({
//       amount: refundAmount,
//       type: "credit",
//       description: `Refund for ${order.status === "cancelled" ? "cancelled" : "returned"} order #${order.orderId}`,
//       referenceId: order._id?.toString(),
//     });

//     await wallet.save();

//     await Transaction.create({
//       userId,
//       amount: refundAmount,
//       transactionType: "credit",
//       paymentMethod: "refund",
//       paymentGateway: order.paymentMethod === "online" ? "razorpay" : "wallet",
//       status: "completed",
//       purpose: order.status === "cancelled" ? "cancellation" : "return",
//       description: `Refund for ${order.status === "cancelled" ? "cancelled" : "returned"} order #${order.orderId}`,
//       orders: [{ orderId: order.orderId, amount: refundAmount }],
//       walletBalanceAfter: wallet.balance,
//     });

//     return true;
//   } catch (error) {
//     console.error("Error processing refund:", error.message, error.stack);
//     return false;
//   }
// };

// const cancelReturnRequest = async (req, res) => {
//   try {
//     const { orderId } = req.body;
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const order = await Order.findOne({ _id: orderId, userId });
//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     if (order.status !== "return_requested" || order.requestStatus !== "pending") {
//       return res.status(400).json({ success: false, message: "Return request cannot be cancelled" });
//     }

//     order.status = "delivered";
//     order.returnReason = undefined;
//     order.requestStatus = undefined;
//     order.adminMessage = undefined;
//     order.updatedOn = new Date();

//     await order.save();

//     res.json({ success: true, message: "Return request cancelled successfully" });
//   } catch (error) {
//     console.error("Error in cancelReturnRequest:", error.message, error.stack);
//     res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
//   }
// };



// const downloadInvoice = async (req, res) => {
//   try {
//     const order = await Order.findOne({ orderId: req.params.orderId }).populate('orderedItems.product');
//     if (!order) return res.status(404).send('Order not found');

//     const invoicePath = path.join(__dirname, '../invoices', `invoice-${order.orderId}.pdf`);

//     generateInvoice(order, invoicePath);

//     setTimeout(() => {
//       res.download(invoicePath);
//     }, 1000);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error generating invoice');
//   }
// };


// const tester = async (req, res) => {
//   try {
//     console.log("tester wallet is working ...")
//   }catch (error) {
//     console.error("Error in placeWalletOrder:", error.message, error.stack);
//     return res.status(500).json({ success: false, message: `Failed to place order: ${error.message}` });
//   }
// }
// module.exports = {
//   placeOrder,
//   getOrders,
//   loadOrderDetails,
//   cancelOrder,
//   returnOrder,
//   downloadInvoice,
//   createRazorpayOrder,
//   verifyPayment,
//   placeWalletOrder,
//   processRefund,
//   cancelReturnRequest,
//   tester
// };
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Coupon = require("../../models/couponSchema");
const Address = require("../../models/addressSchema");
const Wallet = require("../../models/walletSchema");
const Transaction = require("../../models/transactionSchema");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const env = require("dotenv").config();
const Order = require("../../models/orderSchema");
const fs = require("fs");
const generateInvoice = require('../../utils/generateInvoice');
const path = require('path');
const ejs = require("ejs");

const Cart = require("../../models/cartSchema");

const DELIVERY_CHARGE = 50;

const distributeDiscount = (cartItems, totalDiscount) => {
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return cartItems.map((item) => {
    const itemTotal = item.price * item.quantity;
    const discountShare = totalDiscount > 0 ? (itemTotal / totalAmount) * totalDiscount : 0;
    return {
      ...item,
      discountedPrice: item.price - discountShare / item.quantity,
    };
  });
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const { addressId, paymentMethod, couponCode } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // Get cart
    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      model: "Product",
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Check stock availability
    for (const item of cart.items) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          message: `Invalid product in cart`,
        });
      }
      if (item.productId.isBlocked || item.quantity > item.productId.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId.productName} is ${item.productId.isBlocked ? "unavailable" : "out of stock"} (Available: ${item.productId.quantity}, Requested: ${item.quantity})`,
        });
      }
    }

    const address = await Address.findOne({ userId, "address._id": addressId });
    if (!address) {
      return res.status(400).json({ success: false, message: "Address not found" });
    }

    const selectedAddress = address.address.find((addr) => addr._id.toString() === addressId);

    // Calculate total and apply coupon
    const totalAmount = cart.items.reduce((sum, item) => sum + item.productId.salePrice * item.quantity, 0);
    let discount = 0;
    let couponApplied = false;

    if (couponCode) {
      const coupon = await Coupon.findOne({ name: couponCode, isList: true });
      if (coupon && !coupon.userId.includes(userId)) {
        if (new Date() > coupon.expireOn) {
          return res.status(400).json({ success: false, message: "Coupon has expired" });
        }
        if (totalAmount < coupon.minimumPrice) {
          return res.status(400).json({
            success: false,
            message: `Minimum purchase amount should be ₹${coupon.minimumPrice}`,
          });
        }
        discount = coupon.offerPrice;
        couponApplied = true;
        await Coupon.findByIdAndUpdate(coupon._id, { $push: { userId } });
      }
    }

    const finalAmount = totalAmount - discount + DELIVERY_CHARGE;
    const discountedItems = distributeDiscount(
      cart.items.map((item) => ({
        product: item.productId._id,
        productName: item.productId.productName,
        productImages: item.productId.productImage,
        quantity: item.quantity,
        price: item.productId.salePrice,
      })),
      discount
    );

    // Create orders
    const orders = await Promise.all(
      discountedItems.map(async (item) => {
        const product = await Product.findById(item.product).select("regularPrice productName productImage");
        const order = new Order({
          userId,
          orderedItems: [
            {
              product: item.product,
              productName: product.productName,
              productImages: product.productImage,
              quantity: item.quantity,
              price: item.discountedPrice,
              regularPrice: product.regularPrice,
              status: "pending",
            },
          ],
          totalPrice: item.price * item.quantity,
          discount: item.price * item.quantity - item.discountedPrice * item.quantity,
          finalAmount: item.discountedPrice * item.quantity + DELIVERY_CHARGE / discountedItems.length,
          address: selectedAddress,
          status: "pending",
          paymentMethod,
          couponApplied,
          deliveryCharge: DELIVERY_CHARGE / discountedItems.length,
          createdOn: new Date(),
        });

        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
        return order.save();
      })
    );

    // Clear cart
    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

    // Fetch user details for rendering
    const user = await User.findById(userId);

    // Render order success page
    return res.render("order-success", {
      user,
      orderIds: orders.map((order) => order.orderId),
      session: req.session.user,
    });
  } catch (error) {
    console.error("Error in placeOrder:", error.message, error.stack);
    return res.status(500).json({ success: false, message: `Failed to place order: ${error.message}` });
  }
};

const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { addressId, couponCode } = req.body;

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      model: "Product",
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Check stock availability
    for (const item of cart.items) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          message: `Invalid product in cart`,
        });
      }
      if (item.productId.isBlocked || item.quantity > item.productId.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId.productName} is ${item.productId.isBlocked ? "unavailable" : "out of stock"} (Available: ${item.productId.quantity}, Requested: ${item.quantity})`,
        });
      }
    }

    const address = await Address.findOne({ userId, "address._id": addressId });
    if (!address) {
      return res.status(400).json({ success: false, message: "Address not found" });
    }

    // Calculate total and apply coupon
    const totalAmount = cart.items.reduce((sum, item) => sum + item.productId.salePrice * item.quantity, 0);
    let discount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ name: couponCode, isList: true });
      if (coupon && !coupon.userId.includes(userId)) {
        if (new Date() > coupon.expireOn) {
          return res.status(400).json({ success: false, message: "Coupon has expired" });
        }
        if (totalAmount < coupon.minimumPrice) {
          return res.status(400).json({
            success: false,
            message: `Minimum purchase amount should be ₹${coupon.minimumPrice}`,
          });
        }
        discount = coupon.offerPrice;
      }
    }

    const finalAmount = totalAmount - discount + DELIVERY_CHARGE;

    const user = await User.findById(userId);

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      receipt: `order_${Date.now()}`,
    });

    res.json({
      success: true,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      orderId: razorpayOrder.id,
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      customerName: user.name || "",
      customerEmail: user.email || "",
      customerPhone: user.phone || "",
    });
  } catch (error) {
    console.error("Error in createRazorpayOrder:", error.message, error.stack);
    res.status(500).json({ success: false, message: `Failed to create Razorpay order: ${error.message}` });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { paymentResponse, orderData } = req.body;
    const userId = req.session.user;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // Verify payment signature
    const sign = paymentResponse.razorpay_order_id + "|" + paymentResponse.razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== paymentResponse.razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      model: "Product",
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Check stock availability
    for (const item of cart.items) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          message: `Invalid product in cart`,
        });
      }
      if (item.productId.isBlocked || item.quantity > item.productId.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId.productName} is ${item.productId.isBlocked ? "unavailable" : "out of stock"} (Available: ${item.productId.quantity}, Requested: ${item.quantity})`,
        });
      }
    }

    const address = await Address.findOne({ userId, "address._id": orderData.addressId });
    if (!address) {
      return res.status(400).json({ success: false, message: "Address not found" });
    }

    const selectedAddress = address.address.find((addr) => addr._id.toString() === orderData.addressId);

    // Calculate total and apply coupon
    const totalAmount = cart.items.reduce((sum, item) => sum + item.productId.salePrice * item.quantity, 0);
    let discount = 0;
    let couponApplied = false;

    if (orderData.couponCode) {
      const coupon = await Coupon.findOne({ name: orderData.couponCode, isList: true });
      if (coupon && !coupon.userId.includes(userId)) {
        if (new Date() > coupon.expireOn) {
          return res.status(400).json({ success: false, message: "Coupon has expired" });
        }
        if (totalAmount < coupon.minimumPrice) {
          return res.status(400).json({
            success: false,
            message: `Minimum purchase amount should be ₹${coupon.minimumPrice}`,
          });
        }
        discount = coupon.offerPrice;
        couponApplied = true;
        await Coupon.findByIdAndUpdate(coupon._id, { $push: { userId } });
      }
    }

    const finalAmount = totalAmount - discount + DELIVERY_CHARGE;
    const discountedItems = distributeDiscount(
      cart.items.map((item) => ({
        product: item.productId._id,
        productName: item.productId.productName,
        productImages: item.productId.productImage,
        quantity: item.quantity,
        price: item.productId.salePrice,
      })),
      discount
    );

    // Create orders
    const orders = await Promise.all(
      discountedItems.map(async (item) => {
        const product = await Product.findById(item.product).select("regularPrice productName productImage");
        const order = new Order({
          userId,
          orderedItems: [
            {
              product: item.product,
              productName: product.productName,
              productImages: product.productImage,
              quantity: item.quantity,
              price: item.discountedPrice,
              regularPrice: product.regularPrice,
              status: "pending",
            },
          ],
          totalPrice: item.price * item.quantity,
          discount: item.price * item.quantity - item.discountedPrice * item.quantity,
          finalAmount: item.discountedPrice * item.quantity + DELIVERY_CHARGE / discountedItems.length,
          address: selectedAddress,
          status: "pending",
          paymentMethod: "online",
          couponApplied,
          deliveryCharge: DELIVERY_CHARGE / discountedItems.length,
          createdOn: new Date(),
        });

        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
        return order.save();
      })
    );

    // Create transaction record
    await Transaction.create({
      userId,
      amount: finalAmount,
      transactionType: "debit",
      paymentMethod: "online",
      paymentGateway: "razorpay",
      gatewayTransactionId: paymentResponse.razorpay_payment_id,
      status: "completed",
      purpose: "purchase",
      description: "Online payment for order",
      orders: orders.map((order) => ({
        orderId: order.orderId,
        amount: order.finalAmount,
      })),
    });

    // Clear cart
    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

    // Fetch user details for rendering
    const user = await User.findById(userId);

    // Render order success page
    return res.render("order-success", {
      user,
      orderIds: orders.map((order) => order.orderId),
      session: req.session.user,
    });
  } catch (error) {
    console.error("Error in verifyPayment:", error.message, error.stack);
    return res.status(500).json({ success: false, message: `Payment verification failed: ${error.message}` });
  }
};

const placeWalletOrder = async (req, res) => {
  try {
    const userId = req.session.user;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { addressId, couponCode } = req.body;

    const user = await User.findById(userId);
    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      model: "Product",
    });

    if (!user || !cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Check stock availability
    for (const item of cart.items) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          message: `Invalid product in cart`,
        });
      }
      if (item.productId.isBlocked || item.quantity > item.productId.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId.productName} is ${item.productId.isBlocked ? "unavailable" : "out of stock"} (Available: ${item.productId.quantity}, Requested: ${item.quantity})`,
        });
      }
    }

    const address = await Address.findOne({ userId, "address._id": addressId });
    if (!address) {
      return res.status(400).json({ success: false, message: "Address not found" });
    }

    const selectedAddress = address.address.find((addr) => addr._id.toString() === addressId);

    const totalAmount = cart.items.reduce((sum, item) => sum + item.productId.salePrice * item.quantity, 0);
    let discount = 0;
    let couponApplied = false;

    if (couponCode) {
      const coupon = await Coupon.findOne({ name: couponCode, isList: true });
      if (coupon && !coupon.userId.includes(userId)) {
        if (new Date() > coupon.expireOn) {
          return res.status(400).json({ success: false, message: "Coupon has expired" });
        }
        if (totalAmount < coupon.minimumPrice) {
          return res.status(400).json({
            success: false,
            message: `Minimum purchase amount should be ₹${coupon.minimumPrice}`,
          });
        }
        discount = coupon.offerPrice;
        couponApplied = true;
        await Coupon.findByIdAndUpdate(coupon._id, { $push: { userId } });
      }
    }

    const finalAmount = totalAmount - discount + DELIVERY_CHARGE;

    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.balance < finalAmount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    const discountedItems = distributeDiscount(
      cart.items.map((item) => ({
        product: item.productId._id,
        productName: item.productId.productName,
        productImages: item.productId.productImage,
        quantity: item.quantity,
        price: item.productId.salePrice,
      })),
      discount
    );

    const orders = await Promise.all(
      discountedItems.map(async (item) => {
        const product = await Product.findById(item.product).select("regularPrice productName productImage");
        const order = new Order({
          userId,
          orderedItems: [
            {
              product: item.product,
              productName: product.productName,
              productImages: product.productImage,
              quantity: item.quantity,
              price: item.discountedPrice,
              regularPrice: product.regularPrice,
              status: "pending",
            },
          ],
          totalPrice: item.price * item.quantity,
          discount: item.price * item.quantity - item.discountedPrice * item.quantity,
          finalAmount: item.discountedPrice * item.quantity + DELIVERY_CHARGE / discountedItems.length,
          address: selectedAddress,
          status: "pending",
          paymentMethod: "wallet",
          couponApplied,
          deliveryCharge: DELIVERY_CHARGE / discountedItems.length,
          createdOn: new Date(),
        });

        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
        return order.save();
      })
    );

    wallet.balance -= finalAmount;
    wallet.totalDebited += finalAmount;
    wallet.transactions.push({
      amount: finalAmount,
      transactionType: "debit",
      transactionPurpose: "purchase",
      type: "debit",
      description: "Order payment from wallet",
    });

    await wallet.save();

    await Transaction.create({
      userId,
      amount: finalAmount,
      transactionType: "debit",
      paymentMethod: "wallet",
      paymentGateway: "wallet",
      status: "completed",
      purpose: "purchase",
      description: "Order payment from wallet",
      orders: orders.map((order) => ({
        orderId: order.orderId,
        amount: order.finalAmount,
      })),
      walletBalanceAfter: wallet.balance,
    });

    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

    // Render order success page
    return res.render("order-success", {
      user,
      orderIds: orders.map((order) => order.orderId),
      session: req.session.user,
    });

  } catch (error) {
    console.error("Error in placeWalletOrder:", error.message, error.stack);
    return res.status(500).json({ success: false, message: `Failed to place order: ${error.message}` });
  }
};

const getOrders = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const [orders, totalOrders, user] = await Promise.all([
      Order.find({ userId })
        .populate({
          path: "orderedItems.product",
          select: "productName productImage price",
        })
        .sort({ createdOn: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ userId }),
      User.findById(userId)
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    res.render("orders", {
      orders,
      user,
      currentPage: page,
      totalPages,
      session: req.session.user,
    });
  } catch (error) {
    console.error("Error in getOrders:", error.message, error.stack);
    res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
  }
};

const loadOrderDetails = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const orderId = req.query.orderId;
    const order = await Order.findOne({ orderId, userId }).populate("orderedItems.product");
    if (!order) {
      return res.status(404).send("Order not found");
    }

    const user = await User.findById(userId);

    res.render("order-details", {
      order,
      user,
      count: 10,
      session: req.session.user,
    });
  } catch (error) {
    console.error("Error in loadOrderDetails:", error.message, error.stack);
    res.status(500).send(`Internal server error: ${error.message}`);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "cancelled" && order.status !== "delivered") {
      order.status = "cancelled";
      order.cancelReason = reason;
      order.orderedItems.forEach((item) => {
        item.status = "cancelled";
        item.cancelReason = reason;
      });

      for (const item of order.orderedItems) {
        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
      }

      if (order.paymentMethod !== "cod") {
        await processRefund(userId, order);
      }

      await order.save();
      res.json({ success: true, message: "Order cancelled successfully" });
    } else {
      res.status(400).json({ success: false, message: "Order cannot be cancelled" });
    }
  } catch (error) {
    console.error("Error in cancelOrder:", error.message, error.stack);
    res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
  }
};

const returnOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "delivered") {
      order.status = "return_requested";
      order.returnReason = reason;
      order.requestStatus = "pending"; // Ensure request status is set
      order.orderedItems.forEach((item) => {
        item.status = "return_requested";
        item.returnReason = reason;
      });

      await order.save();
      res.json({ success: true, message: "Return request submitted successfully" });
    } else {
      res.status(400).json({ success: false, message: "Only delivered orders can be returned" });
    }
  } catch (error) {
    console.error("Error in returnOrder:", error.message, error.stack);
    res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
  }
};

const processRefund = async (userId, order) => {
  try {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0 });
    }

    const finalAmount = Number(order.finalAmount) || 0;
    const deliveryCharge = Number(order.deliveryCharge) || 0;
    const refundAmount = finalAmount - deliveryCharge;

    if (isNaN(refundAmount) || refundAmount < 0) {
      throw new Error("Invalid refund amount");
    }

    wallet.balance = Number(wallet.balance) + refundAmount;

    wallet.transactions.push({
      amount: refundAmount,
      type: "credit",
      description: `Refund for ${order.status === "cancelled" ? "cancelled" : "returned"} order #${order.orderId}`,
      referenceId: order._id?.toString(),
    });

    await wallet.save();

    await Transaction.create({
      userId,
      amount: refundAmount,
      transactionType: "credit",
      paymentMethod: "refund",
      paymentGateway: order.paymentMethod === "online" ? "razorpay" : "wallet",
      status: "completed",
      purpose: order.status === "cancelled" ? "cancellation" : "return",
      description: `Refund for ${order.status === "cancelled" ? "cancelled" : "returned"} order #${order.orderId}`,
      orders: [{ orderId: order.orderId, amount: refundAmount }],
      walletBalanceAfter: wallet.balance,
    });

    return true;
  } catch (error) {
    console.error("Error processing refund:", error.message, error.stack);
    return false;
  }
};

const cancelReturnRequest = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "return_requested" || order.requestStatus !== "pending") {
      return res.status(400).json({ success: false, message: "Return request cannot be cancelled" });
    }

    order.status = "delivered";
    order.returnReason = undefined;
    order.requestStatus = undefined;
    order.adminMessage = undefined;
    order.updatedOn = new Date();

    await order.save();

    res.json({ success: true, message: "Return request cancelled successfully" });
  } catch (error) {
    console.error("Error in cancelReturnRequest:", error.message, error.stack);
    res.status(500).json({ success: false, message: `Internal server error: ${error.message}` });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId }).populate('orderedItems.product');
    if (!order) return res.status(404).send('Order not found');

    const invoicePath = path.join(__dirname, '../invoices', `invoice-${order.orderId}.pdf`);

    generateInvoice(order, invoicePath);

    setTimeout(() => {
      res.download(invoicePath);
    }, 1000);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating invoice');
  }
};

const tester = async (req, res) => {
  try {
    console.log("tester wallet is working ...")
  } catch (error) {
    console.error("Error in placeWalletOrder:", error.message, error.stack);
    return res.status(500).json({ success: false, message: `Failed to place order: ${error.message}` });
  }
};

module.exports = {
  placeOrder,
  getOrders,
  loadOrderDetails,
  cancelOrder,
  returnOrder,
  downloadInvoice,
  createRazorpayOrder,
  verifyPayment,
  placeWalletOrder,
  processRefund,
  cancelReturnRequest,
  tester
};
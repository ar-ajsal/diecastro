
// const Product = require("../../models/productSchema");
// const Category = require("../../models/categorySchema");
// const Address = require("../../models/addressSchema");
// const Coupon = require("../../models/couponSchema");
// const Wallet = require("../../models/walletSchema");
// const Cart = require("../../models/cartSchema");
// const User = require("../../models/userSchema");
// const transactionSchema = require("../../models/transactionSchema");  
// const mongoose = require("mongoose");
// const loadCheckoutPage = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     const cart = await Cart.findOne({ userId }).populate({
//       path: "items.productId",
//       model: "Product",
//       populate: {
//         path: "category",
//         model: "Category",
//       },
//     });
//     const wallet = await Wallet.findOne({ userId });
//     const addressData = await Address.findOne({ userId });

//     if (!cart || !cart.items.length) {
//       return res.render("checkout", {
//         user,
//         cartItems: [],
//         subtotal: 0,
//         shippingCharge: 50,
//         grandTotal: 0,
//         discount: 0,
//         userAddress: addressData,
//         wallet: wallet || { balance: 0, refundAmount: 0, totalDebited: 0 },
//         session: req.session,
//       });
//     }

//     // Adjust cart quantities based on current product stock
//     for (let item of cart.items) {
//       if (!item.productId) {
//         // Remove invalid items
//         cart.items = cart.items.filter(
//           (cartItem) => cartItem.productId?.toString() !== item.productId?.toString()
//         );
//         continue;
//       }
//       if (item.quantity > item.productId.quantity) {
//         item.quantity = item.productId.quantity;
//         if (item.quantity === 0) {
//           cart.items = cart.items.filter(
//             (cartItem) => cartItem.productId.toString() !== item.productId.toString()
//           );
//         }
//       }
//     }
//     await cart.save();

//     // Filter out blocked products, unlisted categories, and products with quantity <= 0
//     const cartItems = cart.items
//       .filter(
//         (item) =>
//           item.productId &&
//           !item.productId.isBlocked &&
//           item.productId.category &&
//           item.productId.category.isListed &&
//           item.productId.quantity > 0
//       )
//       .map((item) => ({
//         product: item.productId,
//         quantity: item.quantity,
//         totalPrice: item.productId.salePrice * item.quantity,
//       }));

//     const subtotal = cartItems.reduce((total, item) => total + item.totalPrice, 0);
//     const shippingCharge = 50;
//     const grandTotal = subtotal + shippingCharge;

//     res.render("checkout", {
//       user,
//       cartItems,
//       subtotal,
//       shippingCharge,
//       grandTotal,
//       discount: 0,
//       userAddress: addressData,
//       wallet: wallet || { balance: 0, refundAmount: 0, totalDebited: 0 },
//       session: req.session,
//     });
//   } catch (error) {
//     console.error("Error in loadCheckoutPage:", error.message, error.stack);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// const addAddressCheckout = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }
//     const userData = await User.findById(userId);
//     res.render("add-address-checkout", {
//       theUser: userId,
//       user: userData,
//       session: req.session,
//     });
//   } catch (error) {
//     console.error("Error in addAddressCheckout:", error.message, error.stack);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// const postAddAddressCheckout = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }
//     const userData = await User.findOne({ _id: userId });
//     const { addressType, name, country, city, landMark, state, streetAddress, pincode, phone, email, altPhone } = req.body;

//     const userAddress = await Address.findOne({ userId });
    
//     if (!userAddress) {
//       const newAddress = new Address({
//         userId,
//         address: [{ addressType, name, country, city, landMark, state, streetAddress, pincode, phone, email, altPhone }],
//       });
//       await newAddress.save();
//     } else {
//       userAddress.address.push({ addressType, name, country, city, landMark, state, streetAddress, pincode, phone, email, altPhone });
//       await userAddress.save();
//     }

//     res.redirect("/checkout");
//   } catch (error) {
//     console.error("Error adding address:", error.message, error.stack);
//     res.status(500).json({ success: false, message: "Failed to add address" });
//   }
// };

// const applyCoupon = async (req, res) => {
//   try {
//     const { couponCode, subtotal } = req.body;
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const coupon = await Coupon.findOne({ name: couponCode, isList: true });

//     if (!coupon) {
//       return res.status(400).json({ success: false, message: "Invalid coupon code" });
//     }

//     if (new Date() > coupon.expireOn) {
//       return res.status(400).json({ success: false, message: "Coupon has expired" });
//     }

//     if (subtotal < coupon.minimumPrice) {
//       return res.status(400).json({ success: false, message: `Minimum purchase amount should be ₹${coupon.minimumPrice}` });
//     }

//     if (coupon.userId.includes(userId)) {
//       return res.status(400).json({ success: false, message: "You have already used this coupon" });
//     }

//     res.json({ success: true, coupon: { offerPrice: coupon.offerPrice } });
//   } catch (error) {
//     console.error("Error applying coupon:", error.message, error.stack);
//     res.status(500).json({ success: false, message: "An error occurred while applying the coupon" });
//   }
// };

// const checkStock = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     const cart = await Cart.findOne({ userId }).populate({
//       path: "items.productId",
//       model: "Product",
//     });

//     if (!cart) {
//       return res.json({
//         success: false,
//         message: "Cart not found",
//         items: [],
//       });
//     }

//     if (!cart.items.length) {
//       return res.json({
//         success: false,
//         message: "Cart is empty",
//         items: [],
//       });
//     }

//     const stockChanges = [];
//     for (const item of cart.items) {
//       if (!item.productId) {
//         console.warn(`Invalid productId in cart for user ${userId}, item:`, item);
//         stockChanges.push({
//           productId: item.productId,
//           stockChanged: true,
//           availableQty: 0,
//           requestedQty: item.quantity,
//           isBlocked: true,
//           error: "Product not found",
//         });
//         continue;
//       }

//       const product = item.productId;
//       const requestedQty = item.quantity;
//       const availableQty = product.quantity || 0;

//       stockChanges.push({
//         productId: product._id,
//         stockChanged: requestedQty > availableQty,
//         availableQty,
//         requestedQty,
//         isBlocked: product.isBlocked || false,
//         productName: product.productName,
//       });
//     }

//     // Update cart quantities if needed
//     for (const item of stockChanges) {
//       if (item.stockChanged || item.isBlocked) {
//         await Cart.updateOne(
//           { userId, "items.productId": item.productId },
//           { $set: { "items.$.quantity": item.availableQty } }
//         );
//       }
//     }

//     // Remove blocked or invalid products from cart
//     const blockedOrInvalidItems = stockChanges.filter((item) => item.isBlocked || item.error);
//     if (blockedOrInvalidItems.length > 0) {
//       await Cart.updateOne(
//         { userId },
//         { $pull: { items: { productId: { $in: blockedOrInvalidItems.map((item) => item.productId) } } } }
//       );
//     }

//     res.json({
//       success: true,
//       items: stockChanges,
//     });
//   } catch (error) {
//     console.error("Error in checkStock:", error.message, error.stack);
//     res.status(500).json({
//       success: false,
//       message: `Error checking stock availability: ${error.message}`,
//     });
//   }
// };

// module.exports = {
//   loadCheckoutPage,
//   postAddAddressCheckout,
//   addAddressCheckout,
//   applyCoupon,
//   checkStock,
// };

const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Address = require("../../models/addressSchema");
const Coupon = require("../../models/couponSchema");
const Wallet = require("../../models/walletSchema");
const Cart = require("../../models/cartSchema");
const User = require("../../models/userSchema");
const Transaction = require("../../models/transactionSchema");
const mongoose = require("mongoose");

const loadCheckoutPage = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const [cart, wallet, addressData] = await Promise.all([
      Cart.findOne({ userId }).populate({
        path: "items.productId",
        model: "Product",
        populate: {
          path: "category",
          model: "Category",
        },
      }),
      Wallet.findOne({ userId }),
      Address.findOne({ userId }),
    ]);

    if (!cart || !cart.items.length) {
      return res.render("checkout", {
        user,
        cartItems: [],
        subtotal: 0,
        shippingCharge: 50,
        grandTotal: 0,
        discount: 0,
        userAddress: addressData,
        wallet: wallet || { balance: 0, refundAmount: 0, totalDebited: 0 },
        session: req.session,
        stockAdjusted: false,
        adjustedItems: [],
      });
    }

    // Track stock adjustments
    let stockAdjusted = false;
    const adjustedItems = [];

    // Adjust cart quantities based on current product stock
    for (let item of cart.items) {
      if (!item.productId) {
        adjustedItems.push({
          productName: "Unknown Product",
          originalQuantity: item.quantity,
          newQuantity: 0,
          reason: "Product not found",
        });
        cart.items = cart.items.filter(
          (cartItem) => cartItem.productId?.toString() !== item.productId?.toString()
        );
        stockAdjusted = true;
        continue;
      }

      const originalQuantity = item.quantity;
      if (item.quantity > item.productId.quantity) {
        item.quantity = item.productId.quantity;
        stockAdjusted = true;
        adjustedItems.push({
          productName: item.productId.productName,
          originalQuantity,
          newQuantity: item.quantity,
          reason: `Only ${item.productId.quantity} available in stock`,
        });
        if (item.quantity === 0) {
          cart.items = cart.items.filter(
            (cartItem) => cartItem.productId.toString() !== item.productId.toString()
          );
        }
      }
    }

    await cart.save();

    // Filter out blocked products, unlisted categories, and products with quantity <= 0
    const cartItems = cart.items
      .filter(
        (item) =>
          item.productId &&
          !item.productId.isBlocked &&
          item.productId.category &&
          item.productId.category.isListed &&
          item.productId.quantity > 0
      )
      .map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        totalPrice: item.productId.salePrice * item.quantity,
      }));

    const subtotal = cartItems.reduce((total, item) => total + item.totalPrice, 0);
    const shippingCharge = 50;
    const grandTotal = subtotal + shippingCharge;

    res.render("checkout", {
      user,
      cartItems,
      subtotal,
      shippingCharge,
      grandTotal,
      discount: 0,
      userAddress: addressData,
      wallet: wallet || { balance: 0, refundAmount: 0, totalDebited: 0 },
      session: req.session,
      stockAdjusted,
      adjustedItems,
    });
  } catch (error) {
    console.error("Error in loadCheckoutPage:", error.message, error.stack);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const addAddressCheckout = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    const userData = await User.findById(userId);
    res.render("add-address-checkout", {
      theUser: userId,
      user: userData,
      session: req.session,
    });
  } catch (error) {
    console.error("Error in addAddressCheckout:", error.message, error.stack);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const postAddAddressCheckout = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }
    const { addressType, name, country, city, landMark, state, streetAddress, pincode, phone, email, altPhone } = req.body;

    const userAddress = await Address.findOne({ userId });

    if (!userAddress) {
      const newAddress = new Address({
        userId,
        address: [{ addressType, name, country, city, landMark, state, streetAddress, pincode, phone, email, altPhone }],
      });
      await newAddress.save();
    } else {
      userAddress.address.push({ addressType, name, country, city, landMark, state, streetAddress, pincode, phone, email, altPhone });
      await userAddress.save();
    }

    res.redirect("/checkout");
  } catch (error) {
    console.error("Error adding address:", error.message, error.stack);
    res.status(500).json({ success: false, message: "Failed to add address" });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, subtotal } = req.body;
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const coupon = await Coupon.findOne({ name: couponCode, isList: true });

    if (!coupon) {
      return res.status(400).json({ success: false, message: "Invalid coupon code" });
    }

    if (new Date() > coupon.expireOn) {
      return res.status(400).json({ success: false, message: "Coupon has expired" });
    }

    if (subtotal < coupon.minimumPrice) {
      return res.status(400).json({ success: false, message: `Minimum purchase amount should be ₹${coupon.minimumPrice}` });
    }

    if (coupon.userId.includes(userId)) {
      return res.status(400).json({ success: false, message: "You have already used this coupon" });
    }

    res.json({ success: true, coupon: { name: couponCode, offerPrice: coupon.offerPrice } });
  } catch (error) {
    console.error("Error applying coupon:", error.message, error.stack);
    res.status(500).json({ success: false, message: "An error occurred while applying the coupon" });
  }
};

const checkStock = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      model: "Product",
      populate: {
        path: "category",
        model: "Category",
      },
    });

    if (!cart) {
      return res.json({
        success: false,
        message: "Cart not found",
        items: [],
        stockAdjusted: false,
      });
    }

    if (!cart.items.length) {
      return res.json({
        success: false,
        message: "Cart is empty",
        items: [],
        stockAdjusted: false,
      });
    }

    let stockAdjusted = false;
    const stockChanges = [];
    const adjustedItems = [];

    for (const item of cart.items) {
      if (!item.productId) {
        stockChanges.push({
          productId: item.productId,
          stockChanged: true,
          availableQty: 0,
          requestedQty: item.quantity,
          isBlocked: true,
          error: "Product not found",
        });
        adjustedItems.push({
          productName: "Unknown Product",
          originalQuantity: item.quantity,
          newQuantity: 0,
          reason: "Product not found",
        });
        stockAdjusted = true;
        continue;
      }

      const product = item.productId;
      const requestedQty = item.quantity;
      const availableQty = product.quantity || 0;
      const isBlocked = product.isBlocked || !product.category || !product.category.isListed;

      if (requestedQty > availableQty || isBlocked) {
        stockAdjusted = true;
        adjustedItems.push({
          productId: product._id,
          productName: product.productName,
          originalQuantity: requestedQty,
          newQuantity: isBlocked ? 0 : availableQty,
          reason: isBlocked ? "Product is blocked or unlisted" : `Only ${availableQty} available in stock`,
        });
      }

      stockChanges.push({
        productId: product._id,
        productName: product.productName,
        stockChanged: requestedQty > availableQty,
        availableQty,
        requestedQty,
        newQuantity: isBlocked ? 0 : Math.min(requestedQty, availableQty),
        isBlocked,
        salePrice: product.salePrice,
      });
    }

    // Update cart quantities
    for (const item of stockChanges) {
      if (item.isBlocked || item.newQuantity === 0) {
        await Cart.updateOne(
          { userId },
          { $pull: { items: { productId: item.productId } } }
        );
      } else if (item.stockChanged) {
        await Cart.updateOne(
          { userId, "items.productId": item.productId },
          { $set: { "items.$.quantity": item.newQuantity, "items.$.totalPrice": item.newQuantity * item.salePrice } }
        );
      }
    }

    // Fetch updated cart for response
    const updatedCart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      model: "Product",
    });

    const cartItems = updatedCart ? updatedCart.items
      .filter(
        (item) =>
          item.productId &&
          !item.productId.isBlocked &&
          item.productId.quantity > 0
      )
      .map((item) => ({
        productId: item.productId._id,
        productName: item.productId.productName,
        quantity: item.quantity,
        totalPrice: item.productId.salePrice * item.quantity,
        salePrice: item.productId.salePrice,
      })) : [];

    res.json({
      success: true,
      items: cartItems,
      stockAdjusted,
      adjustedItems,
    });
  } catch (error) {
    console.error("Error in checkStock:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: `Error checking stock availability: ${error.message}`,
    });
  }
};

module.exports = {
  loadCheckoutPage,
  postAddAddressCheckout,
  addAddressCheckout,
  applyCoupon,
  checkStock,
};
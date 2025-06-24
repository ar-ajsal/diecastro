
// const Order = require("../../models/orderSchema");
// const User = require("../../models/userSchema");
// const Product = require("../../models/productSchema");
// const sendEmail = require('../../utils/sendEmail');
// const { processRefund } = require("../../controllers/user/orderController"); // Import processRefund
// require("dotenv").config();

// const getOrders = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const skip = (page - 1) * limit;
//         const search = req.query.search || '';

//         let query = {};
//         if (search) {
//             query = {
//                 $or: [
//                     { orderId: { $regex: search, $options: 'i' } },
//                     { 'address.name': { $regex: search, $options: 'i' } },
//                     { 'orderedItems.product.productName': { $regex: search, $options: 'i' } }
//                 ]
//             };
//         }

//         const orders = await Order.find(query)
//             .populate({
//                 path: "orderedItems.product",
//                 select: "productName productImage price quantity",
//             })
//             .sort({ createdOn: -1 })
//             .skip(skip)
//             .limit(limit);

//         const totalOrders = await Order.countDocuments(query);

//         res.render("admin-orders", {
//             orders,
//             title: "Order Management",
//             currentPage: page,
//             totalPages: Math.ceil(totalOrders / limit),
//             limit,
//             search
//         });
//     } catch (error) {
//         console.error("Error fetching orders:", error);
//         res.status(500).send("Internal Server Error");
//     }
// };

// const getOrderDetails = async (req, res) => {
//     try {
//         const orderId = req.params.id;
//         const order = await Order.findById(orderId)
//             .populate({
//                 path: "orderedItems.product",
//                 select: "productName productImage price quantity",
//             });

//         if (!order) {
//             return res.status(404).send("Order not found");
//         }

//         res.render("admin-order-details", {
//             order,
//             title: "Order Details",
//         });
//     } catch (error) {
//         console.error("Error fetching order details:", error);
//         res.status(500).send("Internal Server Error");
//     }
// };

// const updateOrderStatus = async (req, res) => {
//     try {
//         const { orderId, status } = req.body;
//         const order = await Order.findById(orderId).populate('userId').populate('orderedItems.product');

//         if (!order) {
//             return res.status(404).json({ success: false, message: "Order not found" });
//         }

//         if (order.status === 'cancelled') {
//             return res.status(400).json({ success: false, message: "Cannot update cancelled order" });
//         }

//         order.status = status;
//         order.orderedItems.forEach(item => {
//             item.status = status;
//         });

//         await order.save();

//         const userEmail = order.userId.email;
//         const subject = `Order ${order.orderId} Status Updated`;

//         const html = `
//         <div style="font-family: Arial, sans-serif; color: #333;">
//           <h2 style="color: #4CAF50;">Hey ${order.userId.name},</h2>
//           <p>We're updating you on the status of your order <strong>#${order.orderId}</strong>.</p>
          
//           <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
//             <strong>Status:</strong> <span style="color: #2196F3; font-size: 16px;">${status.toUpperCase()}</span>
//           </div>
      
//           <h4 style="margin-top: 30px;">🛍️ What you ordered:</h4>
//           <ul style="line-height: 1.8;">
//             ${order.orderedItems.map(item => 
//               `<li><strong>${item.product.productName}</strong> - Qty: ${item.quantity}</li>`).join('')}
//           </ul>
      
//           <p style="margin-top: 30px;">We’ll keep you posted until your order reaches you. Track it anytime from your dashboard.</p>
      
//           <p>Thanks for choosing <strong>Senkaii</strong> – we love having you here! 🧡</p>
      
//           <hr style="margin: 30px 0;">
//           <p style="font-size: 12px; color: #777;">If you have any questions, just reply to this email – we're here to help.</p>
//         </div>
//       `;
      
//         await sendEmail(userEmail, subject, html);

//         res.json({ success: true, message: "Order status updated and email sent" });

//     } catch (error) {
//         console.error("Error updating order status:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// };

// const cancelOrder = async (req, res) => {
//     try {
//         const { orderId } = req.body;
//         const order = await Order.findById(orderId);

//         if (!order) {
//             return res.status(404).json({ success: false, message: "Order not found" });
//         }

//         if (order.status !== 'cancelled' && order.status !== 'delivered') {
//             order.status = 'cancelled';
//             order.orderedItems.forEach(item => {
//                 item.status = 'cancelled';
//             });

//             for (const item of order.orderedItems) {
//                 await Product.findByIdAndUpdate(item.product, {
//                     $inc: { quantity: item.quantity }
//                 });
//             }

//             if (order.paymentMethod !== "cod") {
//                 await processRefund(order.userId, order);
//             }

//             await order.save();
//             res.json({ success: true, message: "Order cancelled successfully" });
//         } else {
//             res.status(400).json({ success: false, message: "Order cannot be cancelled" });
//         }
//     } catch (error) {
//         console.error("Error cancelling order:", error);
//         res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };

// const handleReturnRequest = async (req, res) => {
//     try {
//         const { orderId, action } = req.body;

//         const order = await Order.findById(orderId).populate("orderedItems.product").populate("userId");
//         if (!order) {
//             return res.status(404).json({ success: false, message: "Order not found" });
//         }

//         if (order.status !== "return_requested") {
//             return res.status(400).json({ success: false, message: "No return request found for this order" });
//         }

//         if (action === 'approve') {
//             order.status = "returned";
//             order.requestStatus = "approved";
//             for (const item of order.orderedItems) {
//                 item.status = "returned";
//                 await Product.findByIdAndUpdate(
//                     item.product._id,
//                     { $inc: { quantity: item.quantity } }
//                 );
//             }

//             // Process refund if payment was not COD
//             if (order.paymentMethod !== "cod") {
//                 const refundSuccess = await processRefund(order.userId, order);
//                 if (!refundSuccess) {
//                     throw new Error("Failed to process refund");
//                 }
//             }

//             // Send email notification
//             const userEmail = order.userId.email;
//             const subject = `Return Request Approved for Order ${order.orderId}`;
//             const html = `
//                 <div style="font-family: Arial, sans-serif; color: #333;">
//                     <h2 style="color: #4CAF50;">Hey ${order.userId.name},</h2>
//                     <p>Your return request for order <strong>#${order.orderId}</strong> has been approved.</p>
//                     <p>The refund amount has been credited to your wallet (if applicable).</p>
//                     <h4 style="margin-top: 30px;">🛍️ Returned Items:</h4>
//                     <ul style="line-height: 1.8;">
//                         ${order.orderedItems.map(item => 
//                             `<li><strong>${item.product.productName}</strong> - Qty: ${item.quantity}</li>`).join('')}
//                     </ul>
//                     <p>Thank you for shopping with <strong>Senkaii</strong>!</p>
//                     <hr style="margin: 30px 0;">
//                     <p style="font-size: 12px; color: #777;">If you have any questions, just reply to this email.</p>
//                 </div>
//             `;
//             await sendEmail(userEmail, subject, html);

//         } else if (action === 'deny') {
//             order.status = "return_denied";
//             order.requestStatus = "denied";
//             for (const item of order.orderedItems) {
//                 item.status = "return_denied";
//             }

//             // Send email notification
//             const userEmail = order.userId.email;
//             const subject = `Return Request Denied for Order ${order.orderId}`;
//             const html = `
//                 <div style="font-family: Arial, sans-serif; color: #333;">
//                     <h2 style="color: #4CAF50;">Hey ${order.userId.name},</h2>
//                     <p>Your return request for order <strong>#${order.orderId}</strong> has been denied.</p>
//                     <p>Please contact support for more details.</p>
//                     <h4 style="margin-top: 30px;">🛍️ Items:</h4>
//                     <ul style="line-height: 1.8;">
//                         ${order.orderedItems.map(item => 
//                             `<li><strong>${item.product.productName}</strong> - Qty: ${item.quantity}</li>`).join('')}
//                     </ul>
//                     <p>Thank you for shopping with <strong>Senkaii</strong>!</p>
//                     <hr style="margin: 30px 0;">
//                     <p style="font-size: 12px; color: #777;">If you have any questions, just reply to this email.</p>
//                 </div>
//             `;
//             await sendEmail(userEmail, subject, html);
//         }

//         await order.save();

//         res.redirect('/admin/orders');
//     } catch (error) {
//         console.error("Error handling return request:", error);
//         res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };

// module.exports = {
//     getOrders,
//     getOrderDetails,
//     updateOrderStatus,
//     cancelOrder,
//     handleReturnRequest
// };


const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const sendEmail = require('../../utils/sendEmail');
const { processRefund } = require("../../controllers/user/orderController");
require("dotenv").config();

const getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        let query = {};
        if (search) {
            query = {
                $or: [
                    { orderId: { $regex: search, $options: 'i' } },
                    { 'address.name': { $regex: search, $options: 'i' } },
                    { 'orderedItems.product.productName': { $regex: search, $options: 'i' } }
                ]
            };
        }

        const orders = await Order.find(query)
            .populate({
                path: "orderedItems.product",
                select: "productName productImage price quantity",
            })
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit);

        // Log orders with null products for debugging
        orders.forEach(order => {
            order.orderedItems.forEach((item, index) => {
                if (!item.product) {
                    console.warn(`Order ${order.orderId} has null product at orderedItems[${index}]`);
                }
            });
        });

        // Filter out orders with invalid or missing products
        const validOrders = orders.filter(order => 
            order.orderedItems && 
            order.orderedItems.length > 0 && 
            order.orderedItems.every(item => item.product !== null)
        );

        const totalOrders = await Order.countDocuments(query);

        res.render("admin-orders", {
            orders: validOrders,
            title: "Order Management",
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            limit,
            search
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Internal Server Error");
    }
};

const getOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId)
            .populate({
                path: "orderedItems.product",
                select: "productName productImage price quantity",
            });

        if (!order) {
            return res.status(404).send("Order not found");
        }

        // Validate order items
        if (!order.orderedItems || order.orderedItems.length === 0 || order.orderedItems.some(item => !item.product)) {
            console.warn(`Order ${order.orderId} has invalid or missing product data`);
        }

        res.render("admin-order-details", {
            order,
            title: "Order Details",
        });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).send("Internal Server Error");
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        const order = await Order.findById(orderId).populate('userId').populate('orderedItems.product');

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({ success: false, message: "Cannot update cancelled order" });
        }

        order.status = status;
        order.orderedItems.forEach(item => {
            item.status = status;
        });

        await order.save();

        const userEmail = order.userId.email;
        const subject = `Order ${order.orderId} Status Updated`;

        const html = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #4CAF50;">Hey ${order.userId.name},</h2>
          <p>We're updating you on the status of your order <strong>#${order.orderId}</strong>.</p>
          
          <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Status:</strong> <span style="color: #2196F3; font-size: 16px;">${status.toUpperCase()}</span>
          </div>
      
          <h4 style="margin-top: 30px;">🛍️ What you ordered:</h4>
          <ul style="line-height: 1.8;">
            ${order.orderedItems.map(item => 
              `<li><strong>${item.product ? item.product.productName : 'Product Unavailable'}</strong> - Qty: ${item.quantity}</li>`).join('')}
          </ul>
      
          <p style="margin-top: 30px;">We’ll keep you posted until your order reaches you. Track it anytime from your dashboard.</p>
      
          <p>Thanks for choosing <strong>Diecastro</strong> – we love having you here! 🧡</p>
      
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #777;">If you have any questions, just reply to this email – we're here to help.</p>
        </div>
      `;
      
        await sendEmail(userEmail, subject, html);

        res.json({ success: true, message: "Order status updated and email sent" });

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status !== 'cancelled' && order.status !== 'delivered') {
            order.status = 'cancelled';
            order.orderedItems.forEach(item => {
                item.status = 'cancelled';
            });

            for (const item of order.orderedItems) {
                if (item.product) {
                    await Product.findByIdAndUpdate(item.product, {
                        $inc: { quantity: item.quantity }
                    });
                }
            }

            if (order.paymentMethod !== "cod") {
                await processRefund(order.userId, order);
            }

            await order.save();
            res.json({ success: true, message: "Order cancelled successfully" });
        } else {
            res.status(400).json({ success: false, message: "Order cannot be cancelled" });
        }
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const handleReturnRequest = async (req, res) => {
    try {
        const { orderId, action } = req.body;

        const order = await Order.findById(orderId).populate("orderedItems.product").populate("userId");
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status !== "return_requested") {
            return res.status(400).json({ success: false, message: "No return request found for this order" });
        }

        if (action === 'approve') {
            order.status = "returned";
            order.requestStatus = "approved";
            for (const item of order.orderedItems) {
                item.status = "returned";
                if (item.product) {
                    await Product.findByIdAndUpdate(
                        item.product._id,
                        { $inc: { quantity: item.quantity } }
                    );
                }
            }

            if (order.paymentMethod !== "cod") {
                const refundSuccess = await processRefund(order.userId, order);
                if (!refundSuccess) {
                    throw new Error("Failed to process refund");
                }
            }

            const userEmail = order.userId.email;
            const subject = `Return Request Approved for Order ${order.orderId}`;
            const html = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #4CAF50;">Hey ${order.userId.name},</h2>
                    <p>Your return request for order <strong>#${order.orderId}</strong> has been approved.</p>
                    <p>The refund amount has been credited to your wallet (if applicable).</p>
                    <h4 style="margin-top: 30px;">🛍️ Returned Items:</h4>
                    <ul style="line-height: 1.8;">
                        ${order.orderedItems.map(item => 
                            `<li><strong>${item.product ? item.product.productName : 'Product Unavailable'}</strong> - Qty: ${item.quantity}</li>`).join('')}
                    </ul>
                    <p>Thank you for shopping with <strong>Diecastro</strong>!</p>
                    <hr style="margin: 30px 0;">
                    <p style="font-size: 12px; color: #777;">If you have any questions, just reply to this email.</p>
                </div>
            `;
            await sendEmail(userEmail, subject, html);

        } else if (action === 'deny') {
            order.status = "return_denied";
            order.requestStatus = "denied";
            for (const item of order.orderedItems) {
                item.status = "return_denied";
            }

            const userEmail = order.userId.email;
            const subject = `Return Request Denied for Order ${order.orderId}`;
            const html = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #4CAF50;">Hey ${order.userId.name},</h2>
                    <p>Your return request for order <strong>#${order.orderId}</strong> has been denied.</p>
                    <p>Please contact support for more details.</p>
                    <h4 style="margin-top: 30px;">🛍️ Items:</h4>
                    <ul style="line-height: 1.8;">
                        ${order.orderedItems.map(item => 
                            `<li><strong>${item.product ? item.product.productName : 'Product Unavailable'}</strong> - Qty: ${item.quantity}</li>`).join('')}
                    </ul>
                    <p>Thank you for shopping with <strong>i</strong>!</p>
                    <hr style="margin: 30px 0;">
                    <p style="font-size: 12px; color: #777;">If you have any questions, just reply to this email.</p>
                </div>
            `;
            await sendEmail(userEmail, subject, html);
        }

        await order.save();

        res.redirect('/admin/orders');
    } catch (error) {
        console.error("Error handling return request:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    getOrders,
    getOrderDetails,
    updateOrderStatus,
    cancelOrder,
    handleReturnRequest
};
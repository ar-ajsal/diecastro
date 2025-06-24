const mongoose = require('mongoose');
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Review = require("../../models/reviewSchema");

// const productDetails = async (req, res) => {
//     try {
//         const userId = req.session.user;
//         const userData = await User.findById(userId);
//         const productId = req.query.id;
//         const product = await Product.findById(productId).populate('category').populate({
//             path: 'reviews',
//             populate: { path: 'user', select: 'name' }
//         });
//         if (!product) {
//             return res.redirect("/pageNotFound");
//         }
//         const findCategory = product.category;
//         const categoryOffer = findCategory?.categoryOffer || 0;
//         const productOffer = product.productOffer || 0;
//         const totalOffer = categoryOffer + productOffer;

//         const categories = await Category.find({ isListed: true });
//         const categoryIds = categories.map(category => category._id.toString());

//         const products = await Product.find({
//             isBlocked: false,
//             category: { $in: categoryIds },
//             quantity: { $gt: 0 },
//         })
//         .sort({ createdOn: -1 })
//         .skip(0)
//         .limit(9);

//         res.render("product-details", {
//             user: userData,
//             product: product,
//             products: products,
//             quantity: product.quantity,
//             totalOffer: totalOffer,
//             category: findCategory,
//             reviews: product.reviews
//         });
//     } catch (error) {
//         console.error("Error for fetching product details:", error.message, error.stack);
//         res.redirect("/pageNotFound");
//     }
// };

// const productDetails = async (req, res) => {
//     try {
//         const userId = req.session.user;
//         const userData = await User.findById(userId);
//         const productId = req.query.id;
//         const isLoggedIn = req.isAuthenticated ? req.isAuthenticated() : !!req.session.user; // Adjust based on your auth system
//         const product = await Product.findById(productId)
//             .populate('category')
//             .populate({
//                 path: 'reviews',
//                 populate: { path: 'user', select: 'name' }
//             });

//         // ✅ Check if product exists or is blocked
//         if (!product || product.isBlocked) {
//             return res.status(403).render("page404"); // or redirect to a custom error page
//         }

//         const findCategory = product.category;
//         const categoryOffer = findCategory?.categoryOffer || 0;
//         const productOffer = product.productOffer || 0;
//         const totalOffer = categoryOffer + productOffer;

//         const categories = await Category.find({ isListed: true });
//         const categoryIds = categories.map(category => category._id.toString());

//         const products = await Product.find({
//             isBlocked: false,
//             category: { $in: categoryIds },
//             quantity: { $gt: 0 },
//         })
//         .sort({ createdOn: -1 })
//         .skip(0)
//         .limit(9);

//         res.render("product-details", {
//             user: userData,
//             product: product,
//             products: products,
//             quantity: product.quantity,
//             totalOffer: totalOffer,
//             category: findCategory,
//             reviews: product.reviews,
//             count: 10,
//             isLoggedIn,
//             session: req.session, 
        
            
//         });
//     } catch (error) {
//         console.error("Error for fetching product details:", error.message, error.stack);
//         res.redirect("/pageNotFound");
//     }
// };

const productDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const productId = req.query.id;
        const isLoggedIn = req.isAuthenticated ? req.isAuthenticated() : !!req.session.user;

        const product = await Product.findById(productId)
            .populate('category')
            .populate({
                path: 'reviews',
                populate: { path: 'user', select: 'name' }
            });

        // ✅ Product check
        if (!product || product.isBlocked) {
            return res.status(403).render("page404");
        }

        // ✅ Track daily views
        const today = new Date().toDateString();
        const lastViewed = new Date(product.lastViewedDate).toDateString();

        if (today === lastViewed) {
            product.viewsToday += 1;
        } else {
            product.viewsToday = 1;
            product.lastViewedDate = new Date();
        }

        await product.save();

        // ✅ Offers & suggestions
        const findCategory = product.category;
        const categoryOffer = findCategory?.categoryOffer || 0;
        const productOffer = product.productOffer || 0;
        const totalOffer = categoryOffer + productOffer;

        const categories = await Category.find({ isListed: true });
        const categoryIds = categories.map(category => category._id.toString());

        const products = await Product.find({
            isBlocked: false,
            category: { $in: categoryIds },
            quantity: { $gt: 0 },
        })
        .sort({ createdOn: -1 })
        .skip(0)
        .limit(9);

        // ✅ Render the product page
        res.render("product-details", {
            user: userData,
            product: product,
            products: products,
            quantity: product.quantity,
            totalOffer: totalOffer,
            category: findCategory,
            reviews: product.reviews,
            count: 10,
            isLoggedIn,
            session: req.session,
            viewsToday: product.viewsToday, // 👈 Send view count to EJS
        });

    } catch (error) {
        console.error("Error for fetching product details:", error.message, error.stack);
        res.redirect("/pageNotFound");
    }
};

const submitReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.session.user;

        console.log('Submit review payload:', { productId, rating, comment, userId }); // Debug

        if (!userId) {
            return res.status(401).json({ success: false, message: "Please log in to submit a review" });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({ success: false, message: "Comment cannot be empty" });
        }

        if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
        }

        const review = new Review({
            product: productId,
            user: userId,
            rating: parseInt(rating),
            comment: comment
        });

        await review.save();
        product.reviews.push(review._id);
        await product.save();

        const populatedReview = await Review.findById(review._id).populate('user', 'name');

        res.status(200).json({
            success: true,
            message: "Review submitted successfully",
            review: {
                _id: populatedReview._id,
                rating: populatedReview.rating,
                comment: populatedReview.comment,
                user: populatedReview.user.name,
                createdAt: populatedReview.createdAt
            }
        });
    } catch (error) {
        console.error("Error submitting review:", error.message, error.stack);
        res.status(500).json({ success: false, message: `Server error: ${error.message}` });
    }
};

const getReviews = async (req, res) => {
    try {
        const productId = req.query.productId;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }
        const reviews = await Review.find({ product: productId }).populate('user', 'name').sort({ createdAt: -1 });
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.error("Error fetching reviews:", error.message, error.stack);
        res.status(500).json({ success: false, message: `Server error: ${error.message}` });
    }
};


// Add product to compare list
const addToCompare = (req, res) => {
    const productId = req.params.id;
    if (!req.session.compare) req.session.compare = [];

    // Avoid duplicates and max 2 products
    if (!req.session.compare.includes(productId)) {
        if (req.session.compare.length < 2) {
            req.session.compare.push(productId);
        }
    }

    res.redirect(req.get("Referer") || "/");

};

// Remove product from compare
const removeFromCompare = (req, res) => {
    const productId = req.params.id;
    if (req.session.compare) {
        req.session.compare = req.session.compare.filter(id => id !== productId);
    }
    res.redirect("/compare");
};

// Render compare page
// const showCompare = async (req, res) => {
//     try {
//         const productIds = req.session.compare || [];
//         const products = await Product.find({ _id: { $in: productIds } });
//         const product = await Product.findById(productId)
//         .populate('category')
//         .populate({
//             path: 'reviews',
//             populate: { path: 'user', select: 'name' }
//         });

//         res.render("compare", {
//             products,
//             session: req.session, 
            
//         });
//     } catch (err) {
//         console.error("Error rendering compare page:", err);
//         res.status(500).send("Server error");
//     }
// };

const showCompare = async (req, res) => {
    try {
      const productIds = req.session.compare || [];
      
      if (productIds.length === 0) {
        console.log("No products in compare session");
      }
  
      const products = await Product.find({ _id: { $in: productIds } })
        .populate('category')
        .populate({
          path: 'reviews',
          populate: { path: 'user', select: 'name' }
        });
  
      res.render("compare", {
        products,
        count: 10, // Confirm if this is used in the template
        session: req.session
      });
    } catch (err) {
      console.error("Error rendering compare page:", err);
      res.status(500).send("Server error");
    }
  };


module.exports = {
    productDetails,
    submitReview,
    getReviews,
    addToCompare,
    removeFromCompare,
    showCompare
    
};


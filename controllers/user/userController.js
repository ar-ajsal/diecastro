
// const User = require('../../models/userSchema');
// const Category = require("../../models/categorySchema");
// const Product = require("../../models/productSchema")
// const Brand = require("../../models/brandSchema")
// const env = require('dotenv').config();
// const nodemailer = require('nodemailer');
// const bcrypt = require('bcrypt');
// const { session } = require('passport');
// const Banner = require('../../models/bannerSchema');

// const pageNotFound = async (req, res) => {
//     try {
//         res.render('page404')
//     } catch (error) {
//         res.redirect('/pagenotfound')
//     }
// }

// const loadHomePage = async (req, res) => {
//     try {
//         const user = req.session.user;
//         const categories = await Category.find({ isListed: true });
//         let productData = await Product.find({
//             isBlocked: false,
//             category: { $in: categories.map(category => category._id) },
//             quantity: { $gt: 0 },
//         });

//         productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//         productData = productData.slice(0, 12);

//         const banners = await Banner.find({
//             startDate: { $lte: new Date() },
//             endDate: { $gte: new Date() }
//         });

//         if (user) {
//             const userData = await User.findOne({ _id: user });
//             res.render('home', {
//                 user: userData,
//                 products: productData,
//                 count: 10,
//                 session: req.session.user,
//                 banners
//             });
//         } else {
//             res.render('home', {
//                 products: productData,
//                 req: req,
//                 session: req.session,
//                 banners
//             });
//         }
//     } catch (error) {
//         console.log('Home Page Not Found:', error);
//         res.status(500).send('Server Error');
//     }
// };

// const loadSignUpPage = async (req, res) => {
//     try {
//         res.render('signup')
//     } catch (error) {
//         console.log('Sign Up Page Not Found')
//         res.status(500).send('Server Error')
//     }
// }

// function generateOTP() {
//     return Math.floor(100000 + Math.random() * 900000).toString();
// }

// async function sendVerificationEmail(email,otp){
//     try{
//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             port:587,
//             secure:false,
//             requireTLS:true,
//             auth:{
//                 user: process.env.NODEMAILER_EMAIL,
//                 pass: process.env.NODEMAILER_PASSWORD
//             }
//         })

//         const info = await transporter.sendMail({
//             from: process.env.NODEMAILER_EMAIL,
//             to: email,
//             subject: 'OTP for Verification',
//             text: `Your OTP is ${otp}`,
//             html: `<b>Your OTP is ${otp}</b>`
//         })

//         return info.accepted.length > 0
//     } catch (error) {
//         console.error("Error for sending email",error)
//         return false
//     }
// }

// const signUp = async (req, res) => {
//     try {
//         const { name, email, phone, password, cPassword } = req.body;

//         const namePattern = /^[a-zA-Z\s]{2,30}$/;
//         const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
//         const phonePattern = /^[0-9]{10}$/;
//         const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

//         let errors = {};

//         if (!name.trim()) {
//             errors.name = 'Please enter a valid name';
//         } else if (!namePattern.test(name)) {
//             errors.name = 'Name can only contain letters and spaces (2-30 characters)';
//         }

//         if (!emailPattern.test(email)) {
//             errors.email = 'Please enter a valid email';
//         }

//         if (!phone.trim()) {
//             errors.phone = 'Please enter a valid phone number';
//         } else if (!phonePattern.test(phone)) {
//             errors.phone = 'Phone number must be 10 digits';
//         }

//         if (!password.trim()) {
//             errors.password = 'Please enter a password';
//         } else if (!passwordPattern.test(password)) {
//             errors.password = 'Password must be at least 8 characters and contain letters and numbers';
//         }

//         if (password !== cPassword) {
//             errors.cPassword = 'Passwords do not match';
//         }

//         const findUser = await User.findOne({ email: email });
//         if (findUser) {
//             errors.email = 'User already exists';
//         }

//         if (Object.keys(errors).length > 0) {
//             return res.render('signup', { errors, formData: req.body });
//         }

//         const otp = generateOTP();
//         const emailSent = await sendVerificationEmail(email, otp);

//         if (!emailSent) {
//             return res.json("email-error");
//         }
        
//         req.session.userOtp = otp;
//         req.session.userData = { name, phone, email, password };

//         res.render('verify-otp');
//         console.log("OTP Send", otp);
//     } catch (error) {
//         console.error('signup error', error);
//         res.redirect('/pagenotfound');
//     }
// }

// const securePassword = async (password) => {
//     try {
//         const passwordHash = await bcrypt.hash(password, 10);
//         return passwordHash;
//     } catch (error) {
//         console.error('Error hashing password', error);
//     }
// }

// const verifyOtp = async (req, res) => {
//     try {
//         const { otp } = req.body;
//         console.log('OTP', otp);

//         if (otp === req.session.userOtp) {
//             const user = req.session.userData;
//             const passwordHash = await securePassword(user.password);

//             const saveUserData = new User({
//                 name: user.name,
//                 email: user.email,
//                 phone: user.phone,
//                 googleId: user.googleId || null,
//                 password: passwordHash
//             });

//             await saveUserData.save();
//             req.session.user = saveUserData._id;
//             res.json({ success: true, redirectUrl: '/' });
//         } else {
//             res.status(400).json({ success: false, message: 'Invalid OTP Please try again' });
//         }
//     } catch (error) {
//         console.error('Error verifying OTP', error);
//         res.status(500).json({ success: false, message: 'Server Error' });
//     }
// }

// const resendOtp = async (req, res) => {
//     try {
//         const { email } = req.session.userData;
//         if (!email) {
//             return res.status(400).json({ success: false, message: 'Email not found in session' });
//         }

//         const otp = generateOTP();
//         req.session.userOtp = otp;
//         const emailSent = await sendVerificationEmail(email, otp);

//         if (emailSent) {
//             console.log("Resend OTP", otp);
//             res.status(200).json({ success: true, message: 'OTP Resend Successfully' });
//         } else {
//             res.status(500).json({ success: false, message: 'Failed to resend OTP Please try again' });
//         }
//     } catch (error) {
//         console.error('Error Resending OTP', error);
//         res.status(500).json({ success: false, message: 'Internal Server Error, Please try again' });
//     }
// }

// const loadLoginPage = async (req, res) => {
//     try {
//         if (!req.session.user) {
//             return res.render('login', { errors: null, formData: null });
//         } else {
//             res.redirect('/');
//         }
//     } catch (error) {
//         res.redirect('/pagenotfound');
//     }
// }

// const login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Validation patterns
//         const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
//         const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

//         // Backend validation
//         let errors = {};

//         if (!emailPattern.test(email)) {
//             errors.email = 'Please enter a valid email';
//         }

//         if (!password.trim()) {
//             errors.password = 'Please enter a password';
//         } else if (!passwordPattern.test(password)) {
//             errors.password = 'Password must be at least 8 characters and contain letters and numbers';
//         }

//         // If there are validation errors, return them
//         if (Object.keys(errors).length > 0) {
//             return res.render('login', { errors, formData: req.body, message: null });
//         }

//         const findUser = await User.findOne({ isAdmin: 0, email: email });
//         if (!findUser) {
//             return res.render('login', { errors: null, formData: req.body, message: 'User not found' });
//         }
//         if (findUser.isBlocked) {
//             return res.render('login', { errors: null, formData: req.body, message: 'User is Blocked by Admin' });
//         }

//         const passwordMatch = await bcrypt.compare(password, findUser.password);
//         if (!passwordMatch) {
//             return res.render('login', { errors: null, formData: req.body, message: 'Invalid Password' });
//         }

//         req.session.user = findUser._id;
//         res.redirect('/');
//     } catch (error) {
//         console.error('Login Error', error);
//         res.render('login', { errors: null, formData: req.body, message: 'Login Failed Try again' });
//     }
// }

// const logout = async (req, res) => {
//     try {
//         req.session.destroy((err) => {
//             if (err) {
//                 console.log('Logout Error', err);
//                 return res.redirect('/pagenotfound');
//             }
//             res.redirect('/login');
//         });
//     } catch (error) {
//         console.log('Logout Error', error);
//         res.redirect('/pagenotfound');
//     }
// };

// const loadShoppingPage = async (req, res) => {
//     try {
//         const user = req.session.user;
//         const userData = user ? await User.findOne({ _id: user }) : null;
//         const page = parseInt(req.query.page) || 1;
//         const limit = 9;
//         const skip = (page - 1) * limit;

//         let query = {
//             isBlocked: false,
//             quantity: { $gt: 0 }
//         };

//         if (req.query.search) {
//             query.productName = { $regex: req.query.search, $options: 'i' };
//         }

//         const categories = await Category.find({ isListed: true });
//         const categoryIds = categories.map(category => category._id);
//         query.category = { $in: categoryIds };

//         let sort = {};
//         switch (req.query.sort) {
//             case 'popularity':
//                 sort = { popularity: -1 };
//                 break;
//             case 'price_asc':
//                 sort = { salePrice: 1 };
//                 break;
//             case 'price_desc':
//                 sort = { salePrice: -1 };
//                 break;
//             case 'rating':
//                 sort = { averageRating: -1 };
//                 break;
//             case 'featured':
//                 sort = { featured: -1 };
//                 break;
//             case 'new':
//                 sort = { createdAt: -1 };
//                 break;
//             case 'name_asc':
//                 sort = { productName: 1 };
//                 break;
//             case 'name_desc':
//                 sort = { productName: -1 };
//                 break;
//             default:
//                 sort = { createdAt: -1 };
//         }

//         const categoriesWithCounts = await Category.aggregate([
//             {
//                 $match: { isListed: true }
//             },
//             {
//                 $lookup: {
//                     from: 'products',
//                     let: { categoryId: '$_id' },
//                     pipeline: [
//                         {
//                             $match: {
//                                 $expr: {
//                                     $and: [
//                                         { $eq: ['$category', '$$categoryId'] },
//                                         { $eq: ['$isBlocked', false] },
//                                         { $gt: ['$quantity', 0] }
//                                     ]
//                                 }
//                             }
//                         }
//                     ],
//                     as: 'products'
//                 }
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     name: 1,
//                     productCount: { $size: '$products' }
//                 }
//             }
//         ]);

//         const products = await Product.find(query)
//             .sort(sort)
//             .skip(skip)
//             .limit(limit);

//         const totalProducts = await Product.countDocuments(query);
//         const totalPages = Math.ceil(totalProducts / limit);

//         res.render("shop", {
//             user: userData,
//             products: products,
//             category: categoriesWithCounts,
//             totalProducts: totalProducts,
//             currentPage: page,
//             totalPages: totalPages,
//             search: req.query.search,
//             sort: req.query.sort,
//             req: req,
//             session: req.session, 
//         });
//     } catch (error) {
//         console.error("Error loading shopping page:", error);
//         res.status(500).redirect("/pageNotFound");
//     }
// };

// const filterProduct = async (req, res) => {
//     try {
//         const user = req.session.user;
//         const category = req.query.category;
//         const query = {
//             isBlocked: false,
//             quantity: { $gt: 0 }
//         };

//         if (category) {
//             const findCategory = await Category.findOne({ _id: category });
//             if (findCategory) {
//                 query.category = findCategory._id;
//             }
//         }

//         if (req.query.query) {
//             const searchQuery = req.query.query.trim();
//             if (searchQuery) {
//                 query.$text = { $search: searchQuery };
//             }
//         }

//         let findProducts = await Product.find(query).lean();
//         findProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//         const categories = await Category.find({ isListed: true });
//         const categoriesWithCounts = await Promise.all(
//             categories.map(async (category) => {
//                 const count = await Product.countDocuments({
//                     category: category._id,
//                     isBlocked: false,
//                     quantity: { $gt: 0 }
//                 });
//                 return { _id: category._id, name: category.name, productCount: count };
//             })
//         );

//         let itemsPerPage = 6;
//         let currentPage = parseInt(req.query.page) || 1;
//         let startIndex = (currentPage - 1) * itemsPerPage;
//         let endIndex = startIndex + itemsPerPage;
//         let totalPages = Math.ceil(findProducts.length / itemsPerPage);
//         const currentProduct = findProducts.slice(startIndex, endIndex);

//         let userData = null;
//         if (user) {
//             userData = await User.findOne({ _id: user });
//             if (userData) {
//                 const searchEntry = {
//                     category: category || null,
//                     searchedOn: new Date(),
//                     query: req.query.query || null
//                 };
//                 userData.searchHistory.push(searchEntry);
//                 await userData.save();
//             }
//         }

//         req.session.filteredProducts = currentProduct;

//         res.render("shop", {
//             user: userData,
//             products: currentProduct,
//             category: categoriesWithCounts,
//             totalPages,
//             currentPage,
//             selectedCategory: category || null,
//             searchQuery: req.query.query || '',
//             session: req.session, 
//         });
//     } catch (error) {
//         console.error("Error while filtering products:", error);
//         res.redirect("/pageNotFound");
//     }
// };

// const searchProducts = async (req, res) => {
//     try {
//         const user = req.session.user;
//         const userData = await User.findOne({ _id: user });
//         const searchQuery = req.query.search;
//         const categories = await Category.find({ isListed: true });

//         const categoriesWithCounts = await Promise.all(categories.map(async (category) => {
//             const count = await Product.countDocuments({ 
//                 category: category._id, 
//                 isBlocked: false, 
//                 quantity: { $gt: 0 } 
//             });
//             return { _id: category._id, name: category.name, productCount: count };
//         }));

//         const products = await Product.find({
//             isBlocked: false,
//             quantity: { $gt: 0 },
//             $or: [
//                 { name: { $regex: searchQuery, $options: 'i' } },
//                 { description: { $regex: searchQuery, $options: 'i' } },
//             ],
//         }).sort({ createdOn: -1 });

//         const page = parseInt(req.query.page) || 1;
//         const limit = 9;
//         const skip = (page - 1) * limit;
//         const totalProducts = products.length;
//         const totalPages = Math.ceil(totalProducts / limit);
//         const paginatedProducts = products.slice(skip, skip + limit);

//         res.render("shop", {
//             user: userData,
//             products: paginatedProducts,
//             category: categoriesWithCounts,
//             totalProducts: totalProducts,
//             currentPage: page,
//             totalPages: totalPages,
//             searchQuery: searchQuery,
//             req: req,
//             session: req.session, 
//         });
//     } catch (error) {
//         console.error("Error searching products:", error);
//         res.redirect("/pageNotFound");
//     }
// };

// const loadContactPage = async (req, res) => {
//     try {
//         res.render('contact', { session: req.session.email });
//     } catch (error) {
//         console.error('Contact Page Not Found', error);
//         res.status(500).send('Server Error');
//     }
// }

// module.exports = {
//     loadHomePage,
//     pageNotFound,
//     loadLoginPage,
//     loadSignUpPage,
//     signUp,
//     login,
//     verifyOtp,
//     resendOtp,
//     logout,
//     loadShoppingPage,
//     filterProduct,
//     searchProducts,
//     loadContactPage
// }

// const User = require('../../models/userSchema');
// const Category = require("../../models/categorySchema");
// const Product = require("../../models/productSchema");
// const Brand = require("../../models/brandSchema");
// const env = require('dotenv').config();
// const nodemailer = require('nodemailer');
// const bcrypt = require('bcrypt');
// const { session } = require('passport');
// const Banner = require('../../models/bannerSchema');

// const pageNotFound = async (req, res) => {
//     try {
//         res.render('page404');
//     } catch (error) {
//         res.redirect('/pagenotfound');
//     }
// };

// // const loadHomePage = async (req, res) => {
// //     try {
// //         const user = req.session.user;
// //         const categories = await Category.find({ isListed: true });
// //         let productData = await Product.find({
// //             isBlocked: false,
// //             category: { $in: categories.map(category => category._id) },
// //             quantity: { $gt: 0 },
// //         });

// //         productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
// //         productData = productData.slice(0, 12);

// //         const banners = await Banner.find({
// //             startDate: { $lte: new Date() },
// //             endDate: { $gte: new Date() },
// //         });

// //         if (user) {
// //             const userData = await User.findOne({ _id: user });
// //             res.render('home', {
// //                 user: userData,
// //                 products: productData,
// //                 count: 10,
// //                 session: req.session.user,
// //                 banners,
// //             });
// //         } else {
// //             res.render('home', {
// //                 products: productData,
// //                 req: req,
// //                 session: req.session,
// //                 banners,
// //             });
// //         }
// //     } catch (error) {
// //         console.log('Home Page Not Found:', error);
// //         res.status(500).send('Server Error');
// //     }
// // };

// const loadHomePage = async (req, res) => {
//     try {
//         const user = req.session.user;
//         const categories = await Category.find({ isListed: true });
//         let productData = await Product.find({
//             isBlocked: false,
//             category: { $in: categories.map(category => category._id) },
//             quantity: { $gt: 0 },
//         });

//         // Sort by newest and limit to 12 products
//         productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//         productData = productData.slice(0, 12);

//         const banners = await Banner.find({
//             startDate: { $lte: new Date() },
//             endDate: { $gte: new Date() },
//         });

//         if (user) {
//             const userData = await User.findOne({ _id: user });
//             res.render('home', {
//                 user: userData,
//                 products: productData,
//                 count: 10,
//                 session: req.session.user,
//                 banners,
//             });
//         } else {
//             res.render('home', {
//                 products: productData,
//                 req: req,
//                 session: req.session,
//                 banners,
//             });
//         }
//     } catch (error) {
//         console.log('Home Page Not Found:', error);
//         res.status(500).send('Server Error');
//     }
// };
// const loadSignUpPage = async (req, res) => {
//     try {
//         res.render('signup');
//     } catch (error) {
//         console.log('Sign Up Page Not Found');
//         res.status(500).send('Server Error');
//     }
// };

// function generateOTP() {
//     return Math.floor(100000 + Math.random() * 900000).toString();
// }

// async function sendVerificationEmail(email, otp) {
//     try {
//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             port: 587,
//             secure: false,
//             requireTLS: true,
//             auth: {
//                 user: process.env.NODEMAILER_EMAIL,
//                 pass: process.env.NODEMAILER_PASSWORD,
//             },
//         });

//         const info = await transporter.sendMail({
//             from: process.env.NODEMAILER_EMAIL,
//             to: email,
//             subject: 'OTP for Verification',
//             text: `Your OTP is ${otp}`,
//             html: `<b>Your OTP is ${otp}</b>`,
//         });

//         return info.accepted.length > 0;
//     } catch (error) {
//         console.error("Error sending email", error);
//         return false;
//     }
// }

// const signUp = async (req, res) => {
//     try {
//         const { name, email, phone, password, cPassword } = req.body;

//         const namePattern = /^[a-zA-Z\s]{2,30}$/;
//         const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
//         const phonePattern = /^[0-9]{10}$/;
//         const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

//         let errors = {};

//         if (!name.trim()) {
//             errors.name = 'Please enter a valid name';
//         } else if (!namePattern.test(name)) {
//             errors.name = 'Name can only contain letters and spaces (2-30 characters)';
//         }

//         if (!emailPattern.test(email)) {
//             errors.email = 'Please enter a valid email';
//         }

//         if (!phone.trim()) {
//             errors.phone = 'Please enter a valid phone number';
//         } else if (!phonePattern.test(phone)) {
//             errors.phone = 'Phone number must be 10 digits';
//         }

//         if (!password.trim()) {
//             errors.password = 'Please enter a password';
//         } else if (!passwordPattern.test(password)) {
//             errors.password = 'Password must be at least 8 characters and contain letters and numbers';
//         }

//         if (password !== cPassword) {
//             errors.cPassword = 'Passwords do not match';
//         }

//         const findUser = await User.findOne({ email: email });
//         if (findUser) {
//             errors.email = 'User already exists';
//         }

//         if (Object.keys(errors).length > 0) {
//             return res.render('signup', { errors, formData: req.body });
//         }

//         const otp = generateOTP();
//         const emailSent = await sendVerificationEmail(email, otp);

//         if (!emailSent) {
//             return res.json("email-error");
//         }

//         req.session.userOtp = otp;
//         req.session.userData = { name, phone, email, password };

//         res.render('verify-otp');
//         console.log("OTP Send", otp);
//     } catch (error) {
//         console.error('signup error', error);
//         res.redirect('/pagenotfound');
//     }
// };

// const securePassword = async (password) => {
//     try {
//         const passwordHash = await bcrypt.hash(password, 10);
//         return passwordHash;
//     } catch (error) {
//         console.error('Error hashing password', error);
//     }
// };

// const verifyOtp = async (req, res) => {
//     try {
//         const { otp } = req.body;
//         console.log('OTP', otp);

//         if (otp === req.session.userOtp) {
//             const user = req.session.userData;
//             const passwordHash = await securePassword(user.password);

//             const saveUserData = new User({
//                 name: user.name,
//                 email: user.email,
//                 phone: user.phone,
//                 googleId: user.googleId || null,
//                 password: passwordHash,
//             });

//             await saveUserData.save();
//             req.session.user = saveUserData._id;
//             res.json({ success: true, redirectUrl: '/' });
//         } else {
//             res.status(400).json({ success: false, message: 'Invalid OTP Please try again' });
//         }
//     } catch (error) {
//         console.error('Error verifying OTP', error);
//         res.status(500).json({ success: false, message: 'Server Error' });
//     }
// };

// const resendOtp = async (req, res) => {
//     try {
//         const { email } = req.session.userData;
//         if (!email) {
//             return res.status(400).json({ success: false, message: 'Email not found in session' });
//         }

//         const otp = generateOTP();
//         req.session.userOtp = otp;
//         const emailSent = await sendVerificationEmail(email, otp);

//         if (emailSent) {
//             console.log("Resend OTP", otp);
//             res.status(200).json({ success: true, message: 'OTP Resend Successfully' });
//         } else {
//             res.status(500).json({ success: false, message: 'Failed to resend OTP Please try again' });
//         }
//     } catch (error) {
//         console.error('Error Resending OTP', error);
//         res.status(500).json({ success: false, message: 'Internal Server Error, Please try again' });
//     }
// };

// const loadLoginPage = async (req, res) => {
//     try {
//         if (!req.session.user) {
//             return res.render('login', { errors: null, formData: null });
//         } else {
//             res.redirect('/');
//         }
//     } catch (error) {
//         res.redirect('/pagenotfound');
//     }
// };

// const login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
//         const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

//         let errors = {};

//         if (!emailPattern.test(email)) {
//             errors.email = 'Please enter a valid email';
//         }

//         if (!password.trim()) {
//             errors.password = 'Please enter a password';
//         } else if (!passwordPattern.test(password)) {
//             errors.password = 'Password must be at least 8 characters and contain letters and numbers';
//         }

//         if (Object.keys(errors).length > 0) {
//             return res.render('login', { errors, formData: req.body, message: null });
//         }

//         const findUser = await User.findOne({ isAdmin: 0, email: email });
//         if (!findUser) {
//             return res.render('login', { errors: null, formData: req.body, message: 'User not found' });
//         }
//         if (findUser.isBlocked) {
//             return res.render('login', { errors: null, formData: req.body, message: 'User is Blocked by Admin' });
//         }

//         const passwordMatch = await bcrypt.compare(password, findUser.password);
//         if (!passwordMatch) {
//             return res.render('login', { errors: null, formData: req.body, message: 'Invalid Password' });
//         }

//         req.session.user = findUser._id;
//         res.redirect('/');
//     } catch (error) {
//         console.error('Login Error', error);
//         res.render('login', { errors: null, formData: req.body, message: 'Login Failed Try again' });
//     }
// };

// const logout = async (req, res) => {
//     try {
//         req.session.destroy((err) => {
//             if (err) {
//                 console.log('Logout Error', err);
//                 return res.redirect('/pagenotfound');
//             }
//             res.redirect('/login');
//         });
//     } catch (error) {
//         console.log('Logout Error', error);
//         res.redirect('/pagenotfound');
//     }
// };

// const loadShoppingPage = async (req, res) => {
//     try {
//         const user = req.session.user;
//         const userData = user ? await User.findOne({ _id: user }) : null;
//         const page = parseInt(req.query.page) || 1;
//         const limit = 9;
//         const skip = (page - 1) * limit;

//         let query = {
//             isBlocked: false,
//             quantity: { $gt: 0 },
//         };

//         // Apply category filter
//         const selectedCategory = req.query.category || null;
//         if (selectedCategory) {
//             const findCategory = await Category.findOne({ _id: selectedCategory, isListed: true });
//             if (findCategory) {
//                 query.category = findCategory._id;
//             }
//         } else {
//             const categories = await Category.find({ isListed: true });
//             query.category = { $in: categories.map(category => category._id) };
//         }

//         // Apply search query
//         if (req.query.search) {
//             const searchQuery = req.query.search.trim();
//             if (searchQuery) {
//                 query.$or = [
//                     { productName: { $regex: searchQuery, $options: 'i' } },
//                     { description: { $regex: searchQuery, $options: 'i' } },
//                 ];
//             }
//         }

//         // Apply sorting
//         let sort = {};
//         switch (req.query.sort) {
//             case 'popularity':
//                 sort = { popularity: -1 };
//                 break;
//             case 'price_asc':
//                 sort = { salePrice: 1 };
//                 break;
//             case 'price_desc':
//                 sort = { salePrice: -1 };
//                 break;
//             case 'rating':
//                 sort = { averageRating: -1 };
//                 break;
//             case 'featured':
//                 sort = { featured: -1 };
//                 break;
//             case 'new':
//                 sort = { createdAt: -1 };
//                 break;
//             case 'name_asc':
//                 sort = { productName: 1 };
//                 break;
//             case 'name_desc':
//                 sort = { productName: -1 };
//                 break;
//             default:
//                 sort = { createdAt: -1 };
//         }

//         const categories = await Category.find({ isListed: true });
//         const categoriesWithCounts = await Promise.all(
//             categories.map(async (category) => {
//                 const countQuery = {
//                     category: category._id,
//                     isBlocked: false,
//                     quantity: { $gt: 0 },
//                 };
//                 if (req.query.search) {
//                     const searchQuery = req.query.search.trim();
//                     if (searchQuery) {
//                         countQuery.$or = [
//                             { productName: { $regex: searchQuery, $options: 'i' } },
//                             { description: { $regex: searchQuery, $options: 'i' } },
//                         ];
//                     }
//                 }
//                 const count = await Product.countDocuments(countQuery);
//                 return { _id: category._id, name: category.name, productCount: count };
//             })
//         );

//         const products = await Product.find(query)
//             .sort(sort)
//             .skip(skip)
//             .limit(limit);

//         const totalProducts = await Product.countDocuments(query);
//         const totalPages = Math.ceil(totalProducts / limit);

//         // Save search history if user is logged in
//         if (userData && (req.query.search || selectedCategory)) {
//             const searchEntry = {
//                 category: selectedCategory || null,
//                 searchedOn: new Date(),
//                 query: req.query.search || null,
//             };
//             userData.searchHistory.push(searchEntry);
//             await userData.save();
//         }

//         res.render("shop", {
//             user: userData,
//             products,
//             category: categoriesWithCounts,
//             totalProducts,
//             currentPage: page,
//             totalPages,
//             search: req.query.search || '',
//             sort: req.query.sort || '',
//             selectedCategory,
//             req,
//             session: req.session,
//         });
//     } catch (error) {
//         console.error("Error loading shopping page:", error);
//         res.status(500).redirect("/pageNotFound");
//     }
// };

// const filterProduct = async (req, res) => {
//     try {
//         const { category, search, sort, page } = req.query;
//         // Redirect to loadShoppingPage with all parameters
//         const queryParams = new URLSearchParams();
//         if (category) queryParams.append('category', category);
//         if (search) queryParams.append('search', search);
//         if (sort) queryParams.append('sort', sort);
//         if (page) queryParams.append('page', page);
//         res.redirect(`/shop?${queryParams.toString()}`);
//     } catch (error) {
//         console.error("Error while filtering products:", error);
//         res.redirect("/pageNotFound");
//     }
// };

// const searchProducts = async (req, res) => {
//     try {
//         const { search, category, sort, page } = req.query;
//         // Redirect to loadShoppingPage with all parameters
//         const queryParams = new URLSearchParams();
//         if (search) queryParams.append('search', search);
//         if (category) queryParams.append('category', category);
//         if (sort) queryParams.append('sort', sort);
//         if (page) queryParams.append('page', page);
//         res.redirect(`/shop?${queryParams.toString()}`);
//     } catch (error) {
//         console.error("Error searching products:", error);
//         res.redirect("/pageNotFound");
//     }
// };

// const loadContactPage = async (req, res) => {
//     try {
//         res.render('contact', { session: req.session });
//     } catch (error) {
//         console.error('Contact Page Not Found', error);
//         res.status(500).send('Server Error');
//     }
// };

// module.exports = {
//     loadHomePage,
//     pageNotFound,
//     loadLoginPage,
//     loadSignUpPage,
//     signUp,
//     login,
//     verifyOtp,
//     resendOtp,
//     logout,
//     loadShoppingPage,
//     filterProduct,
//     searchProducts,
//     loadContactPage,
// };
const User = require('../../models/userSchema');
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const env = require('dotenv').config();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const { session } = require('passport');
const Banner = require('../../models/bannerSchema');

const pageNotFound = async (req, res) => {
    try {
        res.render('page404');
    } catch (error) {
        res.redirect('/pagenotfound');
    }
};

const loadHomePage = async (req, res) => {
    try {
        const user = req.session.user;
        const categories = await Category.find({ isListed: true });
        let productData = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) },
            quantity: { $gt: 0 },
        });

        productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        productData = productData.slice(0, 12);

        const banners = await Banner.find({
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
        });

        if (user) {
            const userData = await User.findOne({ _id: user });
            res.render('home', {
                user: userData,
                products: productData,
                count: 10,
                session: req.session.user,
                banners,
            });
        } else {
            res.render('home', {
                products: productData,
                req: req,
                session: req.session,
                banners,
            });
        }
    } catch (error) {
        console.log('Home Page Not Found:', error);
        res.status(500).send('Server Error');
    }
};

const loadAuthPage = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render('auth', { errors: null, formData: null, message: null, formType: 'login' ,session:req.session});
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.log('Auth Page Not Found', error);
        res.redirect('/pagenotfound');
    }
};

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            },
        });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'OTP for Verification',
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP is ${otp}</b>`,
        });

        return info.accepted.length > 0;
    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
}

const signUp = async (req, res) => {
    try {
        const { name, email, phone, password, cPassword } = req.body;

        const namePattern = /^[a-zA-Z\s]{2,30}$/;
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        const phonePattern = /^[0-9]{10}$/;
        const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

        let errors = {};

        if (!name.trim()) {
            errors.name = 'Please enter a valid name';
        } else if (!namePattern.test(name)) {
            errors.name = 'Name can only contain letters and spaces (2-30 characters)';
        }

        if (!emailPattern.test(email)) {
            errors.email = 'Please enter a valid email';
        }

        if (!phone.trim()) {
            errors.phone = 'Please enter a valid phone number';
        } else if (!phonePattern.test(phone)) {
            errors.phone = 'Phone number must be 10 digits';
        }

        if (!password.trim()) {
            errors.password = 'Please enter a password';
        } else if (!passwordPattern.test(password)) {
            errors.password = 'Password must be at least 8 characters and contain letters and numbers';
        }

        if (password !== cPassword) {
            errors.cPassword = 'Passwords do not match';
        }

        const findUser = await User.findOne({ email: email });
        if (findUser) {
            errors.email = 'User already exists';
        }

        if (Object.keys(errors).length > 0) {
            return res.render('auth', { errors, formData: req.body, message: null, formType: 'signup' });
        }

        const otp = generateOTP();
        const emailSent = await sendVerificationEmail(email, otp);

        if (!emailSent) {
            return res.render('auth', { errors: null, formData: req.body, message: 'Failed to send OTP', formType: 'signup' });
        }

        req.session.userOtp = otp;
        req.session.userData = { name, phone, email, password };

        res.render('verify-otp');
        console.log("OTP Send", otp);
    } catch (error) {
        console.error('Signup error', error);
        res.redirect('/pagenotfound');
    }
};

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.error('Error hashing password', error);
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        console.log('OTP', otp);

        if (otp === req.session.userOtp) {
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                googleId: user.googleId || null,
                password: passwordHash,
            });

            await saveUserData.save();
            req.session.user = saveUserData._id;
            res.json({ success: true, redirectUrl: '/' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid OTP Please try again' });
        }
    } catch (error) {
        console.error('Error verifying OTP', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email not found in session' });
        }

        const otp = generateOTP();
        req.session.userOtp = otp;
        const emailSent = await sendVerificationEmail(email, otp);

        if (emailSent) {
            console.log("Resend OTP", otp);
            res.status(200).json({ success: true, message: 'OTP Resend Successfully' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to resend OTP Please try again' });
        }
    } catch (error) {
        console.error('Error Resending OTP', error);
        res.status(500).json({ success: false, message: 'Internal Server Error, Please try again' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

        let errors = {};

        if (!emailPattern.test(email)) {
            errors.email = 'Please enter a valid email';
        }

        if (!password.trim()) {
            errors.password = 'Please enter a password';
        } else if (!passwordPattern.test(password)) {
            errors.password = 'Password must be at least 8 characters and contain letters and numbers';
        }

        if (Object.keys(errors).length > 0) {
            return res.render('auth', { errors, formData: req.body, message: null, formType: 'login' });
        }

        const findUser = await User.findOne({ isAdmin: 0, email: email });
        if (!findUser) {
            return res.render('auth', { errors: null, formData: req.body, message: 'User not found', formType: 'login' });
        }
        if (findUser.isBlocked) {
            return res.render('auth', { errors: null, formData: req.body, message: 'User is Blocked by Admin', formType: 'login' });
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            return res.render('auth', { errors: null, formData: req.body, message: 'Invalid Password', formType: 'login' });
        }

        req.session.user = findUser._id;
        res.redirect('/');
    } catch (error) {
        console.error('Login Error', error);
        res.render('auth', { errors: null, formData: req.body, message: 'Login Failed Try again', formType: 'login' });
    }
};

const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log('Logout Error', err);
                return res.redirect('/pagenotfound');
            }
            res.redirect('/login');
        });
    } catch (error) {
        console.log('Logout Error', error);
        res.redirect('/pagenotfound');
    }
};

const loadShoppingPage = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = user ? await User.findOne({ _id: user }) : null;
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;

        let query = {
            isBlocked: false,
            quantity: { $gt: 0 },
        };

        // Apply category filter
        const selectedCategory = req.query.category || null;
        if (selectedCategory) {
            const findCategory = await Category.findOne({ _id: selectedCategory, isListed: true });
            if (findCategory) {
                query.category = findCategory._id;
            }
        } else {
            const categories = await Category.find({ isListed: true });
            query.category = { $in: categories.map(category => category._id) };
        }

        // Apply search query
        if (req.query.search) {
            const searchQuery = req.query.search.trim();
            if (searchQuery) {
                query.$or = [
                    { productName: { $regex: searchQuery, $options: 'i' } },
                    { description: { $regex: searchQuery, $options: 'i' } },
                ];
            }
        }

        // Apply sorting
        let sort = {};
        switch (req.query.sort) {
            case 'popularity':
                sort = { popularity: -1 };
                break;
            case 'price_asc':
                sort = { salePrice: 1 };
                break;
            case 'price_desc':
                sort = { salePrice: -1 };
                break;
            case 'rating':
                sort = { averageRating: -1 };
                break;
            case 'featured':
                sort = { featured: -1 };
                break;
            case 'new':
                sort = { createdAt: -1 };
                break;
            case 'name_asc':
                sort = { productName: 1 };
                break;
            case 'name_desc':
                sort = { productName: -1 };
                break;
            default:
                sort = { createdAt: -1 };
        }

        const categories = await Category.find({ isListed: true });
        const categoriesWithCounts = await Promise.all(
            categories.map(async (category) => {
                const countQuery = {
                    category: category._id,
                    isBlocked: false,
                    quantity: { $gt: 0 },
                };
                if (req.query.search) {
                    const searchQuery = req.query.search.trim();
                    if (searchQuery) {
                        countQuery.$or = [
                            { productName: { $regex: searchQuery, $options: 'i' } },
                            { description: { $regex: searchQuery, $options: 'i' } },
                        ];
                    }
                }
                const count = await Product.countDocuments(countQuery);
                return { _id: category._id, name: category.name, productCount: count };
            })
        );

        const products = await Product.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        // Save search history if user is logged in
        if (userData && (req.query.search || selectedCategory)) {
            const searchEntry = {
                category: selectedCategory || null,
                searchedOn: new Date(),
                query: req.query.search || null,
            };
            userData.searchHistory.push(searchEntry);
            await userData.save();
        }

        res.render("shop", {
            user: userData,
            products,
            category: categoriesWithCounts,
            totalProducts,
            currentPage: page,
            totalPages,
            search: req.query.search || '',
            sort: req.query.sort || '',
            selectedCategory,
            req,
            session: req.session,
        });
    } catch (error) {
        console.error("Error loading shopping page:", error);
        res.status(500).redirect("/pageNotFound");
    }
};

const filterProduct = async (req, res) => {
    try {
        const { category, search, sort, page } = req.query;
        // Redirect to loadShoppingPage with all parameters
        const queryParams = new URLSearchParams();
        if (category) queryParams.append('category', category);
        if (search) queryParams.append('search', search);
        if (sort) queryParams.append('sort', sort);
        if (page) queryParams.append('page', page);
        res.redirect(`/shop?${queryParams.toString()}`);
    } catch (error) {
        console.error("Error while filtering products:", error);
        res.redirect("/pageNotFound");
    }
};

const searchProducts = async (req, res) => {
    try {
        const { search, category, sort, page } = req.query;
        // Redirect to loadShoppingPage with all parameters
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        if (category) queryParams.append('category', category);
        if (sort) queryParams.append('sort', sort);
        if (page) queryParams.append('page', page);
        res.redirect(`/shop?${queryParams.toString()}`);
    } catch (error) {
        console.error("Error searching products:", error);
        res.redirect("/pageNotFound");
    }
};

const loadContactPage = async (req, res) => {
    try {
        res.render('contact', { session: req.session });
    } catch (error) {
        console.error('Contact Page Not Found', error);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    loadHomePage,
    pageNotFound,
    loadAuthPage,
    signUp,
    login,
    verifyOtp,
    resendOtp,
    logout,
    loadShoppingPage,
    filterProduct,
    searchProducts,
    loadContactPage,
};
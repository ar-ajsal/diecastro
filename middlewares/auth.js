// const { userBlockedEmitter } = require("../controllers/admin/customerController")

// const User = require("../models/userSchema");

// const userAuth = (req, res, next) => {
//     if (req.session.user) {
//       User.findById(req.session.user)
//         .then((user) => {
//           if (user && !user.isBlocked) {
//             next()
//           } else {
//             delete req.session.user
//             res.redirect("/login")
//           }
//         })
//         .catch((error) => {
//           console.log("User Auth Error", error)
//           res.status(500).send("Internal Server Error")
//         })
//     } else {
//       res.redirect("/login")
//     }
//   }

//   const addCartWishlist = (req, res, next) => {
//     if (!req.session.user) {
//       res.redirect("/login")

//     }
//   }


  
//   module.exports = { userAuth}
  
//   userBlockedEmitter.on("userBlocked", (userId) => {
    
//     console.log(`User ${userId} has been blocked. Their session should be cleared.`)
//   })
  
  

// const adminAuth = (req, res, next) => {
//     if (req.session.admin) {
//         User.findById(req.session.admin)
//         .then(admin => {
//             if (admin && admin.isAdmin) { 
//                 next();
//             } else {
//                 req.session.destroy();  // Clear invalid session
//                 res.redirect('/admin/login');
//             }
//         })
//         .catch(error => {
//             console.error("Admin Auth Error", error);
//             res.redirect('/admin/login');
//         });
//     } else {
//         res.redirect('/admin/login');
//     }
// };


// const checkUserAuthWish = (req, res, next) => {
//   if (req.session.user) {
//       next(); // User is logged in, proceed to next function
//   } else {
//       return res.status(401).json({ status: false, message: "User not logged in" });
//   }
// };


// const ajaxAuth = (req, res, next) => {
//   if (req.session.user) {
//     User.findById(req.session.user)
//       .then((user) => {
//         if (user && !user.isBlocked) {
//           next();
//         } else {
//           delete req.session.user;
//           res.status(401).json({ 
//             status: false, 
//             message: "User is blocked or not found" 
//           });
//         }
//       })
//       .catch((error) => {
//         console.log("Ajax Auth Error", error);
//         res.status(500).json({ 
//           status: false, 
//           message: "Internal server error" 
//         });
//       });
//   } else {
//     res.status(401).json({ 
//       status: false, 
//       message: "User not logged in" 
//     });
//   }
// };





// module.exports = {
//     userAuth,
//     adminAuth,
//     addCartWishlist,
//     checkUserAuthWish,
//     ajaxAuth
    
// }
const User = require("../models/userSchema");
const { userBlockedEmitter } = require("../controllers/admin/customerController");

const userAuth = (req, res, next) => {
  // Check if the request is for an API route
  const isApiRequest = req.headers.accept?.includes('application/json') ||
    [
      '/apply-coupon',
      '/check-stock',
      '/placeOrder',
      '/create-razorpay-order',
      '/verify-payment',
      '/place-wallet-order',
    ].some((path) => req.originalUrl.includes(path));

  if (req.session.user) {
    User.findById(req.session.user)
      .then((user) => {
        if (user && !user.isBlocked) {
          next();
        } else {
          delete req.session.user;
          if (isApiRequest) {
            return res.status(401).json({
              status: false,
              message: user ? 'User is blocked' : 'User not found',
            });
          }
          res.redirect('/login');
        }
      })
      .catch((error) => {
        console.log('User Auth Error:', error);
        if (isApiRequest) {
          return res.status(500).json({
            status: false,
            message: 'Internal server error',
          });
        }
        res.status(500).send('Internal Server Error');
      });
  } else {
    if (isApiRequest) {
      return res.status(401).json({
        status: false,
        message: 'User not logged in',
      });
    }
    res.redirect('/login');
  }
};

const addCartWishlist = (req, res, next) => {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
};

const checkUserAuthWish = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    return res.status(401).json({
      status: false,
      message: 'User not logged in',
    });
  }
};

const ajaxAuth = (req, res, next) => {
  if (req.session.user) {
    User.findById(req.session.user)
      .then((user) => {
        if (user && !user.isBlocked) {
          next();
        } else {
          delete req.session.user;
          res.status(401).json({
            status: false,
            message: 'User is blocked or not found',
          });
        }
      })
      .catch((error) => {
        console.log('Ajax Auth Error:', error);
        res.status(500).json({
          status: false,
          message: 'Internal server error',
        });
      });
  } else {
    res.status(401).json({
      status: false,
      message: 'User not logged in',
    });
  }
};

const adminAuth = (req, res, next) => {
  if (req.session.admin) {
    User.findById(req.session.admin)
      .then((admin) => {
        if (admin && admin.isAdmin) {
          next();
        } else {
          req.session.destroy();
          res.redirect('/admin/login');
        }
      })
      .catch((error) => {
        console.error('Admin Auth Error:', error);
        res.redirect('/admin/login');
      });
  } else {
    res.redirect('/admin/login');
  }
};

// Handle user block events
userBlockedEmitter.on('userBlocked', (userId) => {
  console.log(`User ${userId} has been blocked. Their session should be cleared.`);
});

module.exports = {
  userAuth,
  adminAuth,
  addCartWishlist,
  checkUserAuthWish,
  ajaxAuth,
};
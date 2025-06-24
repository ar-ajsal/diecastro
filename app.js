// const express = require('express');
// const app = express();
// const path = require('path');
// const session = require('express-session');
// const passport = require('./config/passport');
// const env = require('dotenv').config();
// const connectDB = require('./config/db');
// const userRouter = require('./routes/userRoutes');
// const adminRouter = require('./routes/adminRoutes');
// const ejs = require('ejs')
// const MongoStore = require("connect-mongo")
// const checkBlockedUser = require("./middlewares/profileAuth");

// // require("dotenv").config();//




// connectDB();

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(
//     session({
//       secret: "keyboard cat",
//       resave: false,
//       saveUninitialized: false,
//       store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
//       cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
//     }),
//   )

// app.use(passport.initialize());
// app.use(passport.session());

// app.use((req, res, next) => {
//     res.locals.user = req.user
//     next()
//   })

// app.use((req,res,next) => {
//     res.set('Cache-Control','no-store')
//     next();
// })




// app.set('view engine', 'ejs');
// app.set('views', [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')]);
// app.use(express.static(path.join(__dirname, 'public')));


// app.use('/',userRouter);

// app.use('/admin', adminRouter);




// const PORT = 3006

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
// module.exports = app;


const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');
const env = require('dotenv').config();
const connectDB = require('./config/db');
const userRouter = require('./routes/userRoutes');
const adminRouter = require('./routes/adminRoutes');
const MongoStore = require('connect-mongo');
const { Blog } = require('./models/blogSchema');


// Connect to MongoDB
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Set user for views
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// Disable cache
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Middleware to populate recent blogs for sidebar
app.use(async (req, res, next) => {
  try {
    res.locals.recentBlogs = await Blog.find().sort({ date: -1 }).limit(3).lean();
    next();
  } catch (error) {
    console.error('Error fetching recent blogs:', error);
    res.locals.recentBlogs = []; // Fallback to empty array to avoid template errors
    next();
  }
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')]);
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', userRouter);
app.use('/admin', adminRouter);


const PORT = process.env.PORT ;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
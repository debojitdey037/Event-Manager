const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { optionalAuth, protect } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const Event = require('./models/Event');

// Initialize Express App
const app = express();

// MongoDB connection middleware
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        next(error);
    }
});

// Body and Cookie Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Custom Flash Notification Middleware using HTTP Cookies
app.use((req, res, next) => {
  req.flash = (type, message) => {
    if (!message) return;
    res.cookie(`flash_${type}`, message, { httpOnly: true, maxAge: 10000 });
  };

  if (req.cookies) {
    if (req.cookies.flash_success_msg) {
      res.locals.success_msg = req.cookies.flash_success_msg;
      res.clearCookie('flash_success_msg');
    }
    if (req.cookies.flash_error_msg) {
      res.locals.error_msg = req.cookies.flash_error_msg;
      res.clearCookie('flash_error_msg');
    }
  }
  next();
});

// View Engine Setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve Static Assets
app.use(express.static(path.join(__dirname, 'public')));

// Home Page Route
app.get('/', optionalAuth, async (req, res, next) => {
  try {
    const featuredEvents = await Event.find({ status: 'approved', eventDate: { $gte: new Date() } })
      .populate('organizer', 'name email')
      .sort({ eventDate: 1 })
      .limit(6);

    res.render('home', {
      pageTitle: 'EventSphere - Full-Stack Event Management Platform',
      featuredEvents
    });
  } catch (error) {
    next(error);
  }
});

// Role-based Dashboard Dispatcher Route
app.get('/dashboard', protect, (req, res) => {
  switch (req.user.role) {
    case 'organizer':
      return res.redirect('/organizer/dashboard');
    case 'attendee':
      return res.redirect('/attendee/dashboard');
    case 'moderator':
      return res.redirect('/moderator/dashboard');
    case 'sponsor':
      return res.redirect('/sponsor/dashboard');
    case 'superadmin':
      return res.redirect('/admin/dashboard');
    default:
      return res.redirect('/');
  }
});

// Mount Routes
app.use('/', require('./routes/authRoutes'));
app.use('/', require('./routes/eventRoutes'));
app.use('/', require('./routes/registrationRoutes'));
app.use('/', require('./routes/sponsorshipRoutes'));
app.use('/', require('./routes/moderationRoutes'));
app.use('/', require('./routes/adminRoutes'));
app.use('/', require('./routes/userRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: 'Page Not Found - EventSphere' });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Export app for Vercel serverless deployment & start server locally
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`EventSphere Platform running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;

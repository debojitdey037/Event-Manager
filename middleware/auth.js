const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Protect routes - mandatory authentication
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    req.flash?.('error_msg', 'Please log in to access this resource.');
    return res.status(401).redirect('/login');
  }

  try {
    const secret = process.env.JWT_SECRET || 'eventsphere_fallback_secret_key';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.clearCookie('token');
      req.flash?.('error_msg', 'User account no longer exists.');
      return res.status(401).redirect('/login');
    }

    if (!user.isActive) {
      res.clearCookie('token');
      req.flash?.('error_msg', 'Your account has been disabled. Please contact support.');
      return res.status(403).redirect('/login');
    }

    req.user = user;
    res.locals.user = user;
    next();
  } catch (err) {
    res.clearCookie('token');
    req.flash?.('error_msg', 'Authentication failed. Session expired or invalid.');
    return res.status(401).redirect('/login');
  }
});

// Optional authentication middleware for public routes to attach user context if logged in
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'eventsphere_fallback_secret_key';
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
        res.locals.user = user;
      }
    } catch (err) {
      res.clearCookie('token');
    }
  }

  if (!res.locals.user) {
    res.locals.user = null;
  }

  next();
});

module.exports = { protect, optionalAuth };

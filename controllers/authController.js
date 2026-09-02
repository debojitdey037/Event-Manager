const User = require('../models/User');
const generateTokenAndSetCookie = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Show registration form
// @route   GET /register
const getRegister = (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  res.render('register', {
    pageTitle: 'Register - EventSphere',
    errors: [],
    formData: {}
  });
};

// @desc    Process registration
// @route   POST /register
const postRegister = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).render('register', {
      pageTitle: 'Register - EventSphere',
      errors: ['User with this email already exists'],
      formData: { name, email, role }
    });
  }

  // Create user
  const userRole = role && ['organizer', 'attendee', 'moderator', 'sponsor', 'superadmin'].includes(role)
    ? role
    : 'attendee';

  await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: userRole,
    isActive: true
  });

  req.flash?.('success_msg', 'Account registered successfully! Please log in.');
  res.redirect('/login');
});

// @desc    Show login form
// @route   GET /login
const getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  res.render('login', {
    pageTitle: 'Login - EventSphere',
    errors: [],
    formData: {}
  });
};

// @desc    Process login
// @route   POST /login
const postLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return res.status(401).render('login', {
      pageTitle: 'Login - EventSphere',
      errors: ['Invalid email or password'],
      formData: { email }
    });
  }

  if (!user.isActive) {
    return res.status(403).render('login', {
      pageTitle: 'Login - EventSphere',
      errors: ['Account is disabled. Please contact administrator.'],
      formData: { email }
    });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).render('login', {
      pageTitle: 'Login - EventSphere',
      errors: ['Invalid email or password'],
      formData: { email }
    });
  }

  // Generate JWT & Set Cookie
  generateTokenAndSetCookie(res, user._id, user.role);

  req.flash?.('success_msg', `Welcome back, ${user.name}!`);

  // Redirect based on role
  switch (user.role) {
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

// @desc    Logout user
// @route   POST /logout
const postLogout = (req, res) => {
  res.clearCookie('token');
  req.flash?.('success_msg', 'You have been logged out successfully.');
  res.redirect('/login');
};

// @desc    Get user profile
// @route   GET /profile
const getProfile = asyncHandler(async (req, res) => {
  res.render('profile', {
    pageTitle: 'My Profile - EventSphere',
    user: req.user,
    errors: [],
    successMsg: req.flash?.('success_msg')
  });
});

// @desc    Update user profile (Name & Email only)
// @route   POST /profile
const postProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }
  if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push('Valid email is required');
  }

  if (errors.length > 0) {
    return res.status(400).render('profile', {
      pageTitle: 'My Profile - EventSphere',
      user: req.user,
      errors
    });
  }

  // Check email conflict
  if (email.toLowerCase() !== req.user.email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).render('profile', {
        pageTitle: 'My Profile - EventSphere',
        user: req.user,
        errors: ['Email address is already in use by another account']
      });
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { name: name.trim(), email: email.toLowerCase() },
    { new: true, runValidators: true }
  );

  req.flash?.('success_msg', 'Profile updated successfully!');
  res.redirect('/profile');
});

// @desc    Show change password form
// @route   GET /change-password
const getChangePassword = (req, res) => {
  res.render('change-password', {
    pageTitle: 'Change Password - EventSphere',
    errors: []
  });
};

// @desc    Process change password
// @route   POST /change-password
const postChangePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    return res.status(400).render('change-password', {
      pageTitle: 'Change Password - EventSphere',
      errors: ['Current password is incorrect']
    });
  }

  user.password = newPassword;
  await user.save();

  req.flash?.('success_msg', 'Password changed successfully!');
  res.redirect('/profile');
});

module.exports = {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  postLogout,
  getProfile,
  postProfile,
  getChangePassword,
  postChangePassword
};

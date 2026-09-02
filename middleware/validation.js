const validateRegistration = (req, res, next) => {
  const { name, email, password, confirmPassword, role } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push('Please enter a valid email address');
  }

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  const validRoles = ['organizer', 'attendee', 'moderator', 'sponsor', 'superadmin'];
  if (role && !validRoles.includes(role)) {
    errors.push('Invalid role selected');
  }

  if (errors.length > 0) {
    return res.status(400).render('register', {
      pageTitle: 'Register',
      errors,
      formData: { name, email, role }
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  }

  if (!password || password.length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).render('login', {
      pageTitle: 'Login',
      errors,
      formData: { email }
    });
  }

  next();
};

const validateEvent = (req, res, next) => {
  const { title, description, category, location, eventDate, startTime, endTime, capacity, price } = req.body;
  const errors = [];

  if (!title || title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  }

  if (!description || description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long');
  }

  const categories = [
    'technology', 'business', 'music', 'sports',
    'education', 'workshop', 'conference', 'networking',
    'cultural', 'other'
  ];
  if (!category || !categories.includes(category)) {
    errors.push('Please select a valid category');
  }

  if (!location || location.trim().length === 0) {
    errors.push('Location is required');
  }

  if (!eventDate || isNaN(Date.parse(eventDate))) {
    errors.push('Please provide a valid date');
  }

  if (!startTime || !endTime) {
    errors.push('Start time and end time are required');
  }

  if (isNaN(capacity) || Number(capacity) < 1) {
    errors.push('Capacity must be a positive number greater than 0');
  }

  if (isNaN(price) || Number(price) < 0) {
    errors.push('Price must be a valid non-negative number');
  }

  if (errors.length > 0) {
    const isEdit = req.originalUrl.includes('/edit');
    const viewName = isEdit ? 'edit-event' : 'create-event';
    const pageTitle = isEdit ? 'Edit Event' : 'Create Event';

    return res.status(400).render(viewName, {
      pageTitle,
      errors,
      event: { ...req.body, _id: req.params.id }
    });
  }

  next();
};

const validateSponsorship = (req, res, next) => {
  const { amount, message } = req.body;
  const errors = [];

  if (isNaN(amount) || Number(amount) <= 0) {
    errors.push('Sponsorship amount must be greater than 0');
  }

  if (errors.length > 0) {
    req.flash('error_msg', errors.join('. '));
    return res.redirect(`/events/${req.params.id}`);
  }

  next();
};

const validateReport = (req, res, next) => {
  const { reason, description } = req.body;
  const errors = [];

  const validReasons = ['spam', 'fraud', 'inappropriate', 'misleading', 'duplicate', 'other'];
  if (!reason || !validReasons.includes(reason)) {
    errors.push('Please select a valid reason');
  }

  if (!description || description.trim().length < 5) {
    errors.push('Description must be at least 5 characters long');
  }

  if (errors.length > 0) {
    req.flash('error_msg', errors.join('. '));
    return res.redirect(`/events/${req.params.id}`);
  }

  next();
};

const validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const errors = [];

  if (!currentPassword) {
    errors.push('Current password is required');
  }

  if (!newPassword || newPassword.length < 8) {
    errors.push('New password must be at least 8 characters long');
  }

  if (newPassword !== confirmPassword) {
    errors.push('New password and confirm password do not match');
  }

  if (errors.length > 0) {
    return res.status(400).render('change-password', {
      pageTitle: 'Change Password',
      errors
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateEvent,
  validateSponsorship,
  validateReport,
  validatePasswordChange
};

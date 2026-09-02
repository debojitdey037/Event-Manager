const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Sponsorship = require('../models/Sponsorship');
const Report = require('../models/Report');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Admin Dashboard with full metrics
// @route   GET /admin/dashboard
const getAdminDashboard = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalEvents = await Event.countDocuments();
  const approvedEvents = await Event.countDocuments({ status: 'approved' });
  const pendingEvents = await Event.countDocuments({ status: 'pending' });
  const totalRegistrations = await Registration.countDocuments({ status: 'active' });
  const totalSponsors = await User.countDocuments({ role: 'sponsor' });
  const pendingReports = await Report.countDocuments({ status: 'pending' });
  const totalSponsorships = await Sponsorship.countDocuments({ status: 'approved' });

  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
  const recentEvents = await Event.find().populate('organizer', 'name email').sort({ createdAt: -1 }).limit(5);
  const recentReports = await Report.find().populate('reportedBy', 'name').populate('event', 'title').sort({ createdAt: -1 }).limit(5);

  res.render('admin-dashboard', {
    pageTitle: 'Superadmin Dashboard - EventSphere',
    metrics: {
      totalUsers,
      totalEvents,
      approvedEvents,
      pendingEvents,
      totalRegistrations,
      totalSponsors,
      pendingReports,
      totalSponsorships
    },
    recentUsers,
    recentEvents,
    recentReports
  });
});

// @desc    Manage Users List with Search & Pagination
// @route   GET /admin/users
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.search && req.query.search.trim()) {
    const regex = new RegExp(req.query.search.trim(), 'i');
    query.$or = [{ name: regex }, { email: regex }];
  }

  if (req.query.role && req.query.role !== 'all') {
    query.role = req.query.role;
  }

  const totalUsers = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalUsers / limit);

  res.render('user-management', {
    pageTitle: 'User Management - EventSphere Admin',
    users,
    currentPage: page,
    totalPages,
    totalUsers,
    queryParams: req.query
  });
});

// @desc    Change User Role
// @route   POST /admin/users/:id/role
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    req.flash?.('error_msg', 'User not found.');
    return res.redirect('/admin/users');
  }

  const validRoles = ['organizer', 'attendee', 'moderator', 'sponsor', 'superadmin'];
  if (!validRoles.includes(role)) {
    req.flash?.('error_msg', 'Invalid role selected.');
    return res.redirect('/admin/users');
  }

  // Prevent self role downgrade if sole superadmin
  if (targetUser._id.toString() === req.user._id.toString() && role !== 'superadmin') {
    req.flash?.('error_msg', 'You cannot downgrade your own superadmin role!');
    return res.redirect('/admin/users');
  }

  targetUser.role = role;
  await targetUser.save();

  req.flash?.('success_msg', `User ${targetUser.name}'s role updated to ${role}.`);
  res.redirect('/admin/users');
});

// @desc    Toggle User Active Status (Enable/Disable)
// @route   POST /admin/users/:id/toggle-status
const toggleUserStatus = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    req.flash?.('error_msg', 'User not found.');
    return res.redirect('/admin/users');
  }

  if (targetUser._id.toString() === req.user._id.toString()) {
    req.flash?.('error_msg', 'You cannot disable your own account!');
    return res.redirect('/admin/users');
  }

  targetUser.isActive = !targetUser.isActive;
  await targetUser.save();

  const statusText = targetUser.isActive ? 'enabled' : 'disabled';
  req.flash?.('success_msg', `Account for ${targetUser.name} has been ${statusText}.`);
  res.redirect('/admin/users');
});

// @desc    Delete User
// @route   POST /admin/users/:id/delete
const deleteUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    req.flash?.('error_msg', 'User not found.');
    return res.redirect('/admin/users');
  }

  // Prevent self-deletion
  if (targetUser._id.toString() === req.user._id.toString()) {
    req.flash?.('error_msg', 'Security Alert: You cannot delete your own superadmin account!');
    return res.redirect('/admin/users');
  }

  // Clean up user's data
  await Registration.deleteMany({ user: targetUser._id });
  await Sponsorship.deleteMany({ sponsor: targetUser._id });
  await Report.deleteMany({ reportedBy: targetUser._id });
  await Event.deleteMany({ organizer: targetUser._id });
  await User.findByIdAndDelete(targetUser._id);

  req.flash?.('success_msg', `User ${targetUser.name} and all associated data deleted.`);
  res.redirect('/admin/users');
});

// @desc    Submit event report (Authenticated users)
// @route   POST /events/:id/report
const submitReport = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const { reason, description } = req.body;

  const event = await Event.findById(eventId);
  if (!event) {
    req.flash?.('error_msg', 'Event not found.');
    return res.redirect('/events');
  }

  await Report.create({
    reportedBy: req.user._id,
    event: eventId,
    reason,
    description: description.trim(),
    status: 'pending'
  });

  req.flash?.('success_msg', 'Report submitted to moderators. Thank you for keeping EventSphere safe!');
  res.redirect(`/events/${eventId}`);
});

module.exports = {
  getAdminDashboard,
  getUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  submitReport
};

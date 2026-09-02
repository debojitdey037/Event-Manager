const Event = require('../models/Event');
const Report = require('../models/Report');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get Moderator Dashboard
// @route   GET /moderator/dashboard
const getModeratorDashboard = asyncHandler(async (req, res) => {
  const pendingEvents = await Event.find({ status: 'pending' })
    .populate('organizer', 'name email')
    .sort({ createdAt: -1 });

  const recentApproved = await Event.find({ status: 'approved' })
    .populate('organizer', 'name email')
    .sort({ updatedAt: -1 })
    .limit(5);

  const pendingReports = await Report.find({ status: 'pending' })
    .populate('reportedBy', 'name email')
    .populate({
      path: 'event',
      populate: { path: 'organizer', select: 'name email' }
    })
    .sort({ createdAt: -1 });

  const stats = {
    pendingEventsCount: pendingEvents.length,
    approvedEventsCount: await Event.countDocuments({ status: 'approved' }),
    rejectedEventsCount: await Event.countDocuments({ status: 'rejected' }),
    pendingReportsCount: pendingReports.length
  };

  res.render('moderator-dashboard', {
    pageTitle: 'Moderator Dashboard - EventSphere',
    pendingEvents,
    recentApproved,
    pendingReports,
    stats
  });
});

// @desc    Get Full Moderation Queue & History Page
// @route   GET /moderation
const getModerationQueue = asyncHandler(async (req, res) => {
  const pendingEvents = await Event.find({ status: 'pending' })
    .populate('organizer', 'name email')
    .sort({ createdAt: -1 });

  const rejectedEvents = await Event.find({ status: 'rejected' })
    .populate('organizer', 'name email')
    .sort({ updatedAt: -1 });

  const allReports = await Report.find()
    .populate('reportedBy', 'name email')
    .populate('reviewedBy', 'name email')
    .populate({
      path: 'event',
      populate: { path: 'organizer', select: 'name email' }
    })
    .sort({ createdAt: -1 });

  res.render('moderation', {
    pageTitle: 'Event & Report Moderation - EventSphere',
    pendingEvents,
    rejectedEvents,
    allReports
  });
});

// @desc    Approve Event
// @route   POST /moderation/events/:id/approve
const approveEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    req.flash?.('error_msg', 'Event not found.');
    return res.redirect('back');
  }

  // Prevent organizer from approving their own event if they are somehow a moderator
  if (event.organizer.toString() === req.user._id.toString() && req.user.role !== 'superadmin') {
    return res.status(403).render('error', {
      pageTitle: 'Self Approval Forbidden',
      errorTitle: '403 Action Denied',
      errorMessage: 'Organizers cannot approve their own events.',
      errorCode: 403
    });
  }

  event.status = 'approved';
  event.rejectionReason = null;
  await event.save();

  req.flash?.('success_msg', `Event "${event.title}" approved successfully!`);
  res.redirect('/moderator/dashboard');
});

// @desc    Reject Event
// @route   POST /moderation/events/:id/reject
const rejectEvent = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const event = await Event.findById(req.params.id);

  if (!event) {
    req.flash?.('error_msg', 'Event not found.');
    return res.redirect('back');
  }

  event.status = 'rejected';
  event.rejectionReason = reason ? reason.trim() : 'Does not comply with platform guidelines.';
  await event.save();

  req.flash?.('success_msg', `Event "${event.title}" rejected.`);
  res.redirect('/moderator/dashboard');
});

// @desc    Resolve Report
// @route   POST /moderation/reports/:id/resolve
const resolveReport = asyncHandler(async (req, res) => {
  const { hideEvent } = req.body;
  const report = await Report.findById(req.params.id).populate('event');

  if (!report) {
    req.flash?.('error_msg', 'Report not found.');
    return res.redirect('back');
  }

  report.status = 'resolved';
  report.reviewedBy = req.user._id;
  await report.save();

  if (hideEvent && report.event) {
    report.event.status = 'rejected';
    report.event.rejectionReason = `Hidden due to resolved report: ${report.reason}`;
    await report.event.save();
  }

  req.flash?.('success_msg', 'Report resolved successfully.');
  res.redirect('back');
});

// @desc    Dismiss Report
// @route   POST /moderation/reports/:id/dismiss
const dismissReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    req.flash?.('error_msg', 'Report not found.');
    return res.redirect('back');
  }

  report.status = 'dismissed';
  report.reviewedBy = req.user._id;
  await report.save();

  req.flash?.('success_msg', 'Report dismissed.');
  res.redirect('back');
});

module.exports = {
  getModeratorDashboard,
  getModerationQueue,
  approveEvent,
  rejectEvent,
  resolveReport,
  dismissReport
};

const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Sponsorship = require('../models/Sponsorship');
const Report = require('../models/Report');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all public events (approved events with search, filter & pagination)
// @route   GET /events
const getEvents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 9;
  const skip = (page - 1) * limit;

  const query = { status: 'approved' };

  // Search by keyword (title, description, location)
  if (req.query.search && req.query.search.trim()) {
    const searchRegex = new RegExp(req.query.search.trim(), 'i');
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { location: searchRegex }
    ];
  }

  // Category filter
  if (req.query.category && req.query.category !== 'all') {
    query.category = req.query.category;
  }

  // Location filter
  if (req.query.location && req.query.location.trim()) {
    query.location = new RegExp(req.query.location.trim(), 'i');
  }

  // Price filter
  if (req.query.maxPrice) {
    query.price = { $lte: Number(req.query.maxPrice) };
  }

  const totalEvents = await Event.countDocuments(query);
  const events = await Event.find(query)
    .populate('organizer', 'name email')
    .sort({ eventDate: 1 })
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalEvents / limit);

  res.render('events', {
    pageTitle: 'Browse Events - EventSphere',
    events,
    currentPage: page,
    totalPages,
    totalEvents,
    queryParams: req.query
  });
});

// @desc    Get single event details
// @route   GET /events/:id
const getEventDetails = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'name email');

  if (!event) {
    return res.status(404).render('error', {
      pageTitle: 'Event Not Found',
      errorTitle: '404 Event Not Found',
      errorMessage: 'The requested event does not exist or has been removed.',
      errorCode: 404
    });
  }

  // Permission check for non-approved events
  if (event.status !== 'approved') {
    const isOwner = req.user && event.organizer._id.toString() === req.user._id.toString();
    const isAuthorizedRole = req.user && ['moderator', 'superadmin'].includes(req.user.role);

    if (!isOwner && !isAuthorizedRole) {
      return res.status(403).render('error', {
        pageTitle: 'Access Restricted',
        errorTitle: '403 Event Pending Review',
        errorMessage: 'This event is currently pending moderation or has not been approved for public viewing.',
        errorCode: 403
      });
    }
  }

  let isRegistered = false;
  let userRegistration = null;

  if (req.user && req.user.role === 'attendee') {
    userRegistration = await Registration.findOne({
      user: req.user._id,
      event: event._id,
      status: 'active'
    });
    isRegistered = !!userRegistration;
  }

  // Fetch approved sponsorships for display
  const sponsorships = await Sponsorship.find({
    event: event._id,
    status: 'approved'
  }).populate('sponsor', 'name');

  res.render('event-details', {
    pageTitle: `${event.title} - EventSphere`,
    event,
    isRegistered,
    userRegistration,
    sponsorships,
    user: req.user
  });
});

// @desc    Show Create Event Form
// @route   GET /events/create
const getCreateEvent = (req, res) => {
  res.render('create-event', {
    pageTitle: 'Create New Event - EventSphere',
    errors: [],
    event: {}
  });
};

// @desc    Process Create Event
// @route   POST /events/create
const postCreateEvent = asyncHandler(async (req, res) => {
  const { title, description, category, location, eventDate, startTime, endTime, capacity, price } = req.body;

  const newEvent = await Event.create({
    title: title.trim(),
    description: description.trim(),
    category,
    location: location.trim(),
    eventDate,
    startTime,
    endTime,
    capacity: Number(capacity),
    price: Number(price),
    organizer: req.user._id,
    status: 'pending' // Initially pending moderation
  });

  req.flash?.('success_msg', 'Event submitted successfully! It is now pending moderator approval.');
  res.redirect('/organizer/dashboard');
});

// @desc    Show Edit Event Form
// @route   GET /events/:id/edit
const getEditEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).render('error', {
      pageTitle: 'Event Not Found',
      errorTitle: '404 Event Not Found',
      errorMessage: 'Event not found',
      errorCode: 404
    });
  }

  // Ownership verification
  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
    return res.status(403).render('error', {
      pageTitle: 'Forbidden',
      errorTitle: '403 Unauthorized',
      errorMessage: 'You can only edit your own events.',
      errorCode: 403
    });
  }

  res.render('edit-event', {
    pageTitle: `Edit ${event.title} - EventSphere`,
    event,
    errors: []
  });
});

// @desc    Process Edit Event
// @route   POST /events/:id/edit
const postEditEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).render('error', {
      pageTitle: 'Event Not Found',
      errorTitle: '404 Event Not Found',
      errorMessage: 'Event not found',
      errorCode: 404
    });
  }

  // Ownership verification
  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
    return res.status(403).render('error', {
      pageTitle: 'Forbidden',
      errorTitle: '403 Unauthorized',
      errorMessage: 'You are not authorized to edit this event.',
      errorCode: 403
    });
  }

  const { title, description, category, location, eventDate, startTime, endTime, capacity, price } = req.body;

  event.title = title.trim();
  event.description = description.trim();
  event.category = category;
  event.location = location.trim();
  event.eventDate = eventDate;
  event.startTime = startTime;
  event.endTime = endTime;
  event.capacity = Number(capacity);
  event.price = Number(price);

  // If rejected, editing resets status back to pending for re-moderation
  if (event.status === 'rejected') {
    event.status = 'pending';
    event.rejectionReason = null;
  }

  await event.save();

  req.flash?.('success_msg', 'Event updated successfully!');
  res.redirect(`/events/${event._id}`);
});

// @desc    Delete event
// @route   POST /events/:id/delete
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    req.flash?.('error_msg', 'Event not found.');
    return res.redirect('back');
  }

  // Ownership / Superadmin check
  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
    return res.status(403).render('error', {
      pageTitle: 'Forbidden',
      errorTitle: '403 Unauthorized',
      errorMessage: 'You do not have permission to delete this event.',
      errorCode: 403
    });
  }

  // Delete registrations, sponsorships, and reports associated with this event
  await Registration.deleteMany({ event: event._id });
  await Sponsorship.deleteMany({ event: event._id });
  await Report.deleteMany({ event: event._id });
  await Event.findByIdAndDelete(event._id);

  req.flash?.('success_msg', 'Event deleted successfully.');

  if (req.user.role === 'superadmin') {
    return res.redirect('/admin/dashboard');
  }
  res.redirect('/organizer/dashboard');
});

// @desc    Cancel event by organizer
// @route   POST /events/:id/cancel
const cancelEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    req.flash?.('error_msg', 'Event not found.');
    return res.redirect('back');
  }

  if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
    return res.status(403).render('error', {
      pageTitle: 'Forbidden',
      errorTitle: '403 Unauthorized',
      errorMessage: 'You cannot cancel an event you do not own.',
      errorCode: 403
    });
  }

  event.status = 'cancelled';
  await event.save();

  // Cancel active registrations
  await Registration.updateMany({ event: event._id, status: 'active' }, { status: 'cancelled', cancelledAt: new Date() });

  req.flash?.('success_msg', 'Event has been cancelled.');
  res.redirect('/organizer/dashboard');
});

// @desc    Organizer Dashboard
// @route   GET /organizer/dashboard
const getOrganizerDashboard = asyncHandler(async (req, res) => {
  const events = await Event.find({ organizer: req.user._id }).sort({ createdAt: -1 });

  const stats = {
    total: events.length,
    pending: events.filter(e => e.status === 'pending').length,
    approved: events.filter(e => e.status === 'approved').length,
    rejected: events.filter(e => e.status === 'rejected').length,
    cancelled: events.filter(e => e.status === 'cancelled').length,
    totalRegistrations: events.reduce((acc, curr) => acc + curr.registeredCount, 0)
  };

  // Get recent registrations for organizer's events
  const eventIds = events.map(e => e._id);
  const recentRegistrations = await Registration.find({ event: { $in: eventIds } })
    .populate('user', 'name email')
    .populate('event', 'title')
    .sort({ registeredAt: -1 })
    .limit(10);

  res.render('organizer-dashboard', {
    pageTitle: 'Organizer Dashboard - EventSphere',
    events,
    stats,
    recentRegistrations
  });
});

module.exports = {
  getEvents,
  getEventDetails,
  getCreateEvent,
  postCreateEvent,
  getEditEvent,
  postEditEvent,
  deleteEvent,
  cancelEvent,
  getOrganizerDashboard
};

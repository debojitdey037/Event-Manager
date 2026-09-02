const crypto = require('crypto');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const asyncHandler = require('../utils/asyncHandler');

// Helper to generate unique Ticket ID
const generateTicketId = () => {
  const year = new Date().getFullYear();
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `EVT-${year}-${randomStr}`;
};

// @desc    Register for an event
// @route   POST /events/:id/register
const registerForEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.id;

  // 1. Role verification
  if (req.user.role !== 'attendee') {
    req.flash?.('error_msg', 'Only attendees can register for events.');
    return res.redirect(`/events/${eventId}`);
  }

  // 2. Fetch event
  const event = await Event.findById(eventId);
  if (!event) {
    req.flash?.('error_msg', 'Event not found.');
    return res.redirect('/events');
  }

  // 3. Status check
  if (event.status !== 'approved') {
    req.flash?.('error_msg', 'Cannot register for an event that is not approved.');
    return res.redirect(`/events/${eventId}`);
  }

  // 4. Date check (has event passed?)
  if (new Date(event.eventDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
    req.flash?.('error_msg', 'Cannot register for an event that has already occurred.');
    return res.redirect(`/events/${eventId}`);
  }

  // 5. Existing registration check
  const existingRegistration = await Registration.findOne({
    user: req.user._id,
    event: eventId,
    status: 'active'
  });

  if (existingRegistration) {
    req.flash?.('error_msg', 'You are already registered for this event.');
    return res.redirect(`/events/${eventId}`);
  }

  // 6. Race-condition safe atomic capacity check & increment
  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: eventId,
      status: 'approved',
      $expr: { $lt: ['$registeredCount', '$capacity'] }
    },
    { $inc: { registeredCount: 1 } },
    { new: true }
  );

  if (!updatedEvent) {
    req.flash?.('error_msg', 'Event is sold out! Capacity reached.');
    return res.redirect(`/events/${eventId}`);
  }

  // 7. Create ticket registration
  const ticketId = generateTicketId();
  const registration = await Registration.create({
    user: req.user._id,
    event: eventId,
    ticketId,
    status: 'active'
  });

  req.flash?.('success_msg', `Registration successful! Your Ticket ID is ${ticketId}`);
  res.redirect(`/tickets/${registration._id}`);
});

// @desc    View attendee tickets / dashboard
// @route   GET /tickets & GET /attendee/dashboard
const getMyTickets = asyncHandler(async (req, res) => {
  const registrations = await Registration.find({ user: req.user._id })
    .populate({
      path: 'event',
      populate: { path: 'organizer', select: 'name email' }
    })
    .sort({ registeredAt: -1 });

  const activeTickets = registrations.filter(r => r.status === 'active');
  const cancelledTickets = registrations.filter(r => r.status === 'cancelled');

  // Fetch upcoming recommended events (approved events not registered for)
  const registeredEventIds = activeTickets.map(r => r.event._id);
  const recommendedEvents = await Event.find({
    status: 'approved',
    _id: { $nin: registeredEventIds },
    eventDate: { $gte: new Date() }
  })
    .populate('organizer', 'name')
    .limit(4);

  const isDashboard = req.originalUrl.includes('dashboard');
  const viewName = isDashboard ? 'attendee-dashboard' : 'my-tickets';

  res.render(viewName, {
    pageTitle: isDashboard ? 'Attendee Dashboard - EventSphere' : 'My Tickets - EventSphere',
    registrations,
    activeTickets,
    cancelledTickets,
    recommendedEvents
  });
});

// @desc    Get single ticket details
// @route   GET /tickets/:id
const getTicketDetails = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.id)
    .populate({
      path: 'event',
      populate: { path: 'organizer', select: 'name email' }
    })
    .populate('user', 'name email');

  if (!registration) {
    return res.status(404).render('error', {
      pageTitle: 'Ticket Not Found',
      errorTitle: '404 Ticket Not Found',
      errorMessage: 'Ticket record could not be found.',
      errorCode: 404
    });
  }

  // Ownership verification
  if (registration.user._id.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
    return res.status(403).render('error', {
      pageTitle: 'Forbidden',
      errorTitle: '403 Unauthorized Access',
      errorMessage: 'You are not authorized to view another attendee\'s ticket.',
      errorCode: 403
    });
  }

  res.render('my-tickets', {
    pageTitle: `Ticket ${registration.ticketId} - EventSphere`,
    singleTicket: registration,
    registrations: [registration],
    activeTickets: [registration],
    cancelledTickets: [],
    recommendedEvents: []
  });
});

// @desc    Cancel registration
// @route   POST /tickets/:id/cancel
const cancelRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.id);

  if (!registration) {
    req.flash?.('error_msg', 'Ticket not found.');
    return res.redirect('/tickets');
  }

  // IDOR / Ownership verification
  if (registration.user.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
    return res.status(403).render('error', {
      pageTitle: 'Forbidden',
      errorTitle: '403 Unauthorized Action',
      errorMessage: 'You can only cancel your own registrations.',
      errorCode: 403
    });
  }

  if (registration.status === 'cancelled') {
    req.flash?.('error_msg', 'This ticket is already cancelled.');
    return res.redirect('/tickets');
  }

  // Update registration status
  registration.status = 'cancelled';
  registration.cancelledAt = new Date();
  await registration.save();

  // Atomically decrement registeredCount on the event (no negative counts)
  await Event.findOneAndUpdate(
    { _id: registration.event, registeredCount: { $gt: 0 } },
    { $inc: { registeredCount: -1 } }
  );

  req.flash?.('success_msg', 'Registration cancelled successfully.');
  res.redirect('/tickets');
});

module.exports = {
  registerForEvent,
  getMyTickets,
  getTicketDetails,
  cancelRegistration
};

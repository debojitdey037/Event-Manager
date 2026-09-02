const Sponsorship = require('../models/Sponsorship');
const Event = require('../models/Event');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Submit sponsorship request
// @route   POST /events/:id/sponsor
const submitSponsorship = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const { amount, message } = req.body;

  if (req.user.role !== 'sponsor' && req.user.role !== 'superadmin') {
    req.flash?.('error_msg', 'Only registered sponsors can submit sponsorship requests.');
    return res.redirect(`/events/${eventId}`);
  }

  const event = await Event.findById(eventId);
  if (!event) {
    req.flash?.('error_msg', 'Event not found.');
    return res.redirect('/events');
  }

  await Sponsorship.create({
    sponsor: req.user._id,
    event: eventId,
    amount: Number(amount),
    message: message ? message.trim() : '',
    status: 'pending'
  });

  req.flash?.('success_msg', 'Sponsorship offer submitted successfully! The organizer will review it.');
  res.redirect('/sponsor/dashboard');
});

// @desc    Sponsor Dashboard & Sponsorships List
// @route   GET /sponsor/dashboard & GET /sponsorships
const getSponsorDashboard = asyncHandler(async (req, res) => {
  // Get sponsor's submitted requests
  const mySponsorships = await Sponsorship.find({ sponsor: req.user._id })
    .populate({
      path: 'event',
      populate: { path: 'organizer', select: 'name email' }
    })
    .sort({ createdAt: -1 });

  // Get available events open for sponsorship (approved events)
  const availableEvents = await Event.find({ status: 'approved' })
    .populate('organizer', 'name email')
    .sort({ eventDate: 1 })
    .limit(10);

  const stats = {
    total: mySponsorships.length,
    pending: mySponsorships.filter(s => s.status === 'pending').length,
    approved: mySponsorships.filter(s => s.status === 'approved').length,
    rejected: mySponsorships.filter(s => s.status === 'rejected').length,
    totalContributed: mySponsorships
      .filter(s => s.status === 'approved')
      .reduce((acc, curr) => acc + curr.amount, 0)
  };

  const isDashboard = req.originalUrl.includes('dashboard');
  const viewName = isDashboard ? 'sponsor-dashboard' : 'sponsorships';

  res.render(viewName, {
    pageTitle: isDashboard ? 'Sponsor Dashboard - EventSphere' : 'Sponsorship Opportunities - EventSphere',
    mySponsorships,
    availableEvents,
    stats
  });
});

// @desc    Update sponsorship status (Organizer / Superadmin)
// @route   POST /sponsorships/:id/status
const updateSponsorshipStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const sponsorship = await Sponsorship.findById(req.params.id).populate('event');

  if (!sponsorship) {
    req.flash?.('error_msg', 'Sponsorship record not found.');
    return res.redirect('back');
  }

  // Ownership check: must be event organizer or superadmin
  const isOrganizer = sponsorship.event.organizer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'superadmin';

  if (!isOrganizer && !isAdmin) {
    return res.status(403).render('error', {
      pageTitle: 'Forbidden',
      errorTitle: '403 Unauthorized',
      errorMessage: 'Only the event organizer or an admin can manage sponsorships for this event.',
      errorCode: 403
    });
  }

  if (['pending', 'approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
    sponsorship.status = status;
    await sponsorship.save();
    req.flash?.('success_msg', `Sponsorship status updated to ${status}.`);
  }

  res.redirect('back');
});

module.exports = {
  submitSponsorship,
  getSponsorDashboard,
  updateSponsorshipStatus
};

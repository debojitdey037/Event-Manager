const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  getMyTickets,
  getTicketDetails,
  cancelRegistration
} = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');

// Event Registration (Attendee only)
router.post('/events/:id/register', protect, authorizeRoles('attendee', 'superadmin'), registerForEvent);

// Tickets & Attendee Dashboard
router.get('/tickets', protect, getMyTickets);
router.get('/attendee/dashboard', protect, authorizeRoles('attendee', 'superadmin'), getMyTickets);
router.get('/tickets/:id', protect, getTicketDetails);

// Cancel Registration
router.post('/tickets/:id/cancel', protect, cancelRegistration);

module.exports = router;

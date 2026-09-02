const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventDetails,
  getCreateEvent,
  postCreateEvent,
  getEditEvent,
  postEditEvent,
  deleteEvent,
  cancelEvent,
  getOrganizerDashboard
} = require('../controllers/eventController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const { validateEvent } = require('../middleware/validation');

// Public route to browse events
router.get('/events', optionalAuth, getEvents);

// Organizer Dashboard
router.get('/organizer/dashboard', protect, authorizeRoles('organizer', 'superadmin'), getOrganizerDashboard);

// Organizer Event Creation
router.get('/events/create', protect, authorizeRoles('organizer', 'superadmin'), getCreateEvent);
router.post('/events/create', protect, authorizeRoles('organizer', 'superadmin'), validateEvent, postCreateEvent);

// Event Details
router.get('/events/:id', optionalAuth, getEventDetails);

// Organizer Event Edit
router.get('/events/:id/edit', protect, authorizeRoles('organizer', 'superadmin'), getEditEvent);
router.post('/events/:id/edit', protect, authorizeRoles('organizer', 'superadmin'), validateEvent, postEditEvent);

// Organizer/Admin Event Delete & Cancel
router.post('/events/:id/delete', protect, authorizeRoles('organizer', 'superadmin'), deleteEvent);
router.post('/events/:id/cancel', protect, authorizeRoles('organizer', 'superadmin'), cancelEvent);

module.exports = router;

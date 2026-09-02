const express = require('express');
const router = express.Router();
const {
  getModeratorDashboard,
  getModerationQueue,
  approveEvent,
  rejectEvent,
  resolveReport,
  dismissReport
} = require('../controllers/moderationController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');

// Moderator Dashboard & Full Queue
router.get('/moderator/dashboard', protect, authorizeRoles('moderator', 'superadmin'), getModeratorDashboard);
router.get('/moderation', protect, authorizeRoles('moderator', 'superadmin'), getModerationQueue);

// Approve / Reject Event
router.post('/moderation/events/:id/approve', protect, authorizeRoles('moderator', 'superadmin'), approveEvent);
router.post('/moderation/events/:id/reject', protect, authorizeRoles('moderator', 'superadmin'), rejectEvent);

// Report management
router.post('/moderation/reports/:id/resolve', protect, authorizeRoles('moderator', 'superadmin'), resolveReport);
router.post('/moderation/reports/:id/dismiss', protect, authorizeRoles('moderator', 'superadmin'), dismissReport);

module.exports = router;

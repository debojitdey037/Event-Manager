const express = require('express');
const router = express.Router();
const {
  submitSponsorship,
  getSponsorDashboard,
  updateSponsorshipStatus
} = require('../controllers/sponsorshipController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const { validateSponsorship } = require('../middleware/validation');

// Submit sponsorship (Sponsor role)
router.post('/events/:id/sponsor', protect, authorizeRoles('sponsor', 'superadmin'), validateSponsorship, submitSponsorship);

// Sponsor Dashboard & Sponsorship list
router.get('/sponsor/dashboard', protect, authorizeRoles('sponsor', 'superadmin'), getSponsorDashboard);
router.get('/sponsorships', protect, authorizeRoles('sponsor', 'organizer', 'superadmin'), getSponsorDashboard);

// Update status (Organizer / Superadmin)
router.post('/sponsorships/:id/status', protect, authorizeRoles('organizer', 'superadmin'), updateSponsorshipStatus);

module.exports = router;

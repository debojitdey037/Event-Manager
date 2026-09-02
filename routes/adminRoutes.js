const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  submitReport
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const { validateReport } = require('../middleware/validation');

// Superadmin Dashboard
router.get('/admin/dashboard', protect, authorizeRoles('superadmin'), getAdminDashboard);

// User Management Routes
router.get('/admin/users', protect, authorizeRoles('superadmin'), getUsers);
router.post('/admin/users/:id/role', protect, authorizeRoles('superadmin'), updateUserRole);
router.post('/admin/users/:id/toggle-status', protect, authorizeRoles('superadmin'), toggleUserStatus);
router.post('/admin/users/:id/delete', protect, authorizeRoles('superadmin'), deleteUser);

// Report Event Submission (Any logged in user can report)
router.post('/events/:id/report', protect, validateReport, submitReport);

module.exports = router;

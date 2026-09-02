const express = require('express');
const router = express.Router();
const { getProfile, postProfile, getChangePassword, postChangePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.get('/users/profile', protect, getProfile);
router.post('/users/profile', protect, postProfile);
router.get('/users/change-password', protect, getChangePassword);
router.post('/users/change-password', protect, postChangePassword);

module.exports = router;

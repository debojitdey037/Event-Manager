const express = require('express');
const router = express.Router();
const {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  postLogout,
  getProfile,
  postProfile,
  getChangePassword,
  postChangePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegistration, validateLogin, validatePasswordChange } = require('../middleware/validation');

router.get('/register', getRegister);
router.post('/register', validateRegistration, postRegister);

router.get('/login', getLogin);
router.post('/login', validateLogin, postLogin);

router.post('/logout', postLogout);

router.get('/profile', protect, getProfile);
router.post('/profile', protect, postProfile);

router.get('/change-password', protect, getChangePassword);
router.post('/change-password', protect, validatePasswordChange, postChangePassword);

module.exports = router;

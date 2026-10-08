const express = require('express');
const router = express.Router();
const {
  registerCitizen,
  loginCitizen,
  registerAuthority,
  loginAuthority,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Citizen authentication routes
router.post('/register-citizen', registerCitizen);
router.post('/login-citizen', loginCitizen);

// Authority authentication routes
router.post('/register-authority', registerAuthority);
router.post('/login-authority', loginAuthority);

// Profile
router.get('/me', protect, getMe);

module.exports = router;

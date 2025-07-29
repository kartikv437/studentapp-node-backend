const express = require('express');
const { signup, verifyOtp, resendOtp, login } = require('./auth.controller');

const router = express.Router();
router.post('/signup', signup);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);

module.exports = router;

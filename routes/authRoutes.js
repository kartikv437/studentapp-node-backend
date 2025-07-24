const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
// const { sendOTPEmail } = require("../utils/mailer");
require('dotenv').config();
const Brevo = require('@getbrevo/brevo');
const crypto = require('crypto');

// ---------------- Brevo client ----------------
const brevo = new Brevo.TransactionalEmailsApi();
brevo.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);
console.log('BREVO_API_KEY length:', process.env.BREVO_API_KEY?.length);
// ---------------- Simple in-memory OTP store ----------------
// Structure: { [email]: { otpHash: string, expiresAt: number } }
const otpStore = {};
const OTP_TTL = Number(process.env.OTP_EXPIRES_IN_SECONDS || 300); // 5 mins

function generateOTP(len = 6) {
  // numeric 6-digit
  return ('' + Math.floor(100000 + Math.random() * 900000)).slice(0, len);
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function sendOtpEmail({ toEmail, toName, otp }) {
  const email = new Brevo.SendSmtpEmail();
  email.sender = {
    email: process.env.BREVO_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME,
  };
  email.to = [{ email: toEmail, name: toName || toEmail }];
  email.subject = 'Your OTP Code';
  email.htmlContent = `
    <h2>Your OTP</h2>
    <p>Use this code to complete your signup:</p>
    <h1>${otp}</h1>
    <p>This code will expire in ${OTP_TTL / 60} minutes.</p>
  `;

  return brevo.sendTransacEmail(email);
}

// POST /auth/signup
// router.post('/signup', async (req, res) => {
//   const { userName, email, password } = req.body;

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser && existingUser.isVerified) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     let user = existingUser;
//     if (!user) {
//       user = await User.create({
//         userName,
//         email,
//         password: hashedPassword,
//         isVerified: false,
//       });
//     } else {
//       user.password = hashedPassword;
//       await user.save();
//     }

//     // Generate and store OTP
//     const otp = generateOTP();
//     const otpHash = await bcrypt.hash(otp, 10);
//     const expiresAt = new Date(Date.now() + (Number(process.env.OTP_EXP_MINUTES || 10) * 60 * 1000));

//     user.otpHash = otpHash;
//     user.otpExpiresAt = expiresAt;
//     await user.save();

//     // Send OTP
//     await sendOTPEmail(email, otp);

//     return res.status(201).json({
//       message: 'Signup successful. OTP sent to email.',
//       userId: user._id,
//       email: user.email
//     });
//   } catch (err) {
//     console.error('Signup error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });
router.post('/signup', async (req, res) => {
  try {
    const { email, name } = req.body || {};
    if (!email) {
      return res.status(400).json({ ok: false, message: 'email is required' });
    }

    const otp = generateOTP(6);
    const otpHash = hash(otp);
    const expiresAt = Date.now() + OTP_TTL * 1000;
    otpStore[email] = { otpHash, expiresAt };

    await sendOtpEmail({ toEmail: email, toName: name, otp });

    return res.json({ ok: true, message: 'OTP sent to your email' });
  } catch (e) {
    console.error('Brevo Error:', e.response?.body || e.message || e);
    return res.status(500).json({ ok: false, message: 'Failed to send OTP' });
  }
});


// POST /auth/verify-otp
// router.post('/verify-otp', async (req, res) => {
//   const { userId, otp } = req.body;

//   try {
//     const user = await User.findById(userId);
//     if (!user || !user.otpHash || !user.otpExpiresAt) {
//       return res.status(400).json({ message: 'Invalid verification request' });
//     }

//     if (user.isVerified) {
//       return res.status(400).json({ message: 'User already verified' });
//     }

//     if (user.otpExpiresAt.getTime() < Date.now()) {
//       return res.status(400).json({ message: 'OTP expired, please resend' });
//     }

//     const isMatch = await bcrypt.compare(otp, user.otpHash);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid OTP' });
//     }

//     user.isVerified = true;
//     user.otpHash = undefined;
//     user.otpExpiresAt = undefined;

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
//     user.token = token;
//     await user.save();

//     return res.json({ message: 'Email verified', token, user });
//   } catch (err) {
//     console.error('Verify OTP error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res
      .status(400)
      .json({ ok: false, message: 'email and otp are required' });
  }

  const record = otpStore[email];
  if (!record) {
    return res.status(400).json({ ok: false, message: 'No OTP found' });
  }

  const { otpHash, expiresAt } = record;

  if (Date.now() > expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ ok: false, message: 'OTP expired' });
  }

  if (hash(otp) !== otpHash) {
    return res.status(400).json({ ok: false, message: 'Invalid OTP' });
  }

  // success → create user, issue JWT, etc.
  delete otpStore[email];

  return res.json({ ok: true, message: 'OTP verified, signup complete' });
});

// POST /auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.isVerified) {
      return res.status(400).json({ message: 'No pending verification for this email' });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + (Number(process.env.OTP_EXP_MINUTES || 10) * 60 * 1000));

    user.otpHash = otpHash;
    user.otpExpiresAt = expiresAt;
    await user.save();

    await sendOTPEmail(email, otp);

    return res.json({ message: 'OTP resent' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

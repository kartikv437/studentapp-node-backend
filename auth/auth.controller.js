const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { otpTtlMinutes, jwtSecret } = require('../config');
const User = require('../models/User');
const EmailOtp = require('../models/EmailOtp');
const { sendOtpEmail } = require('../mailer');
const { generateOtp } = require('../utils/otp');
const { signupSchema, verifyOtpSchema, resendOtpSchema } = require('./auth.validators');

exports.signup = async (req, res) => {

  const parse = signupSchema.safeParse(req.body);

  if (!parse.success) return res.status(400).json({ errors: parse.error.flatten() });
  const { email, password } = parse.data;

  let user = await User.findOne({ email });

  if (user && user.isVerified) {
    return res.status(409).json({ message: 'User already exists and is verified. Please log in.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (!user) {
    user = await User.create({ email, password: passwordHash, isVerified: false });
  } else {
    user.password = passwordHash;
    await user.save();
  }
  console.log('USER CREATED:', user);
  
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + otpTtlMinutes * 60 * 1000);

  // await EmailOtp.create({ userId: user._id, code: otp, expiresAt });
  await sendOtpEmail(email, otp);

  return res.json({ message: 'OTP sent to your email.', otp: otp });
};

exports.verifyOtp = async (req, res) => {
  const parse = verifyOtpSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ errors: parse.error.flatten() });

  const { email, otp } = parse.data;
  console.log('VERIFY OTP REQUEST:', req.body);

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const latestOtp = await EmailOtp.findOne({ userId: user._id, used: false }).sort({ createdAt: -1 });
  if (!latestOtp) return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
  if (latestOtp.code !== otp) return res.status(400).json({ message: 'Invalid OTP' });
  if (latestOtp.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

  latestOtp.used = true;
  await latestOtp.save();
  user.isVerified = true;
  await user.save();

  const token = jwt.sign({ sub: user._id, email: user.email }, jwtSecret, { expiresIn: '7d' });
  return res.json({ message: 'OTP verified, signup complete', token });
};

exports.resendOtp = async (req, res) => {
  const parse = resendOtpSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ errors: parse.error.flatten() });

  const { email } = parse.data;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + otpTtlMinutes * 60 * 1000);
  await EmailOtp.create({ userId: user._id, code: otp, expiresAt });

  await sendOtpEmail(email, otp);
  return res.json({ message: 'OTP resent.' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  console.log('LOGIN REQUEST:', req.body);

  if (!user) return res.status(404).json({ message: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ sub: user._id, email: user.email }, jwtSecret, { expiresIn: '7d' });
  return res.json({ message: 'Login successful', token });
};

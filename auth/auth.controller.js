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
  const { email, password, role } = parse.data;

  let user = await User.findOne({ email });

  if (user && user.isVerified) {
    return res.status(409).json({ message: 'User already exists. Please log in.', statusCode: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (!user) {
    user = await User.create({ email, password: passwordHash, isVerified: false, role });
  } else {
    user.password = passwordHash;
    await user.save();
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + otpTtlMinutes * 60 * 1000);

  await EmailOtp.create({ userId: user._id, code: otp, expiresAt });
  try {
    await sendOtpEmail(email, otp);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return res.status(500).json({ message: 'Error sending OTP email' });
  }

  return res.json({ message: 'OTP sent to your email.', otp: otp, statusCode: 200 });
};

exports.verifyOtp = async (req, res) => {

  const parse = verifyOtpSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ errors: parse.error.flatten(), message: 'Invalid OTP' });

  const { otp } = req.body;
  if (!otp) return res.status(400).json({ message: 'OTP is required' });

  const latestOtp = await EmailOtp.findOne({ code: otp, used: false }).sort({ createdAt: -1 });
  if (!latestOtp) return res.status(400).json({ message: 'Invalid or expired OTP', statusCode: 400 });
  if (latestOtp.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired', statusCode: 400 });

  const user = await User.findById(latestOtp.userId);
  if (!user) return res.status(404).json({ message: 'User not found', statusCode: 404 });

  latestOtp.used = true;
  await latestOtp.save();

  user.isVerified = true;
  await user.save();

  const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '7d' });
  return res.json({ message: 'OTP verified, signup complete', result: { accessToken: token, email: user.email }, statusCode: 200 });
};

exports.resendOtp = async (req, res) => {
  const parse = resendOtpSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ errors: parse.error.flatten(), statusCode: 400 });

  const { email } = parse.data;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found', statusCode: 404 });
  if (user.isVerified) return res.status(400).json({ message: 'User already verified', statusCode: 400 });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + otpTtlMinutes * 60 * 1000);
  await EmailOtp.create({ userId: user._id, code: otp, expiresAt });

  await sendOtpEmail(email, otp);
  return res.json({ message: 'OTP resent.', otp: otp });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  console.log('user',user);
  
  if (!user) return res.status(404).json({ message: 'User not found', statusCode: 404 });

  const isMatch = await bcrypt.compare(password, user.password);
  console.log('isMatch',isMatch);
  
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials', statusCode: 401 });

  const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, { expiresIn: '7d' });
  console.log('token',token);
  
  return res.json({
    message: 'Login successful', result: {
      accessToken: token,
      email: user.email,
      role: user.role
    }, statusCode: 200
  });
};

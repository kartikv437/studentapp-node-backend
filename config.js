require('dotenv').config();

function parseMinutes(val, fallback = 10) {
  const n = parseInt((val ?? '').trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI,
  brevoApiKey: process.env.BREVO_API_KEY,
  jwtSecret: process.env.JWT_SECRET,
  otpTtlMinutes: parseMinutes(process.env.OTP_TTL_MINUTES, 10),
  senderEmail: process.env.SENDER_EMAIL,
  senderName: process.env.SENDER_NAME || 'Your App',
};

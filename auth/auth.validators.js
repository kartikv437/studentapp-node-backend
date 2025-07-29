const { z } = require('zod');

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d+$/),
});

const resendOtpSchema = z.object({
  email: z.string().email(),
});

module.exports = { signupSchema, verifyOtpSchema, resendOtpSchema };

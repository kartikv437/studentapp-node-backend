const { Schema, model, Types } = require('mongoose');

const emailOtpSchema = new Schema(
  {
    id: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    used: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = model('EmailOtp', emailOtpSchema);

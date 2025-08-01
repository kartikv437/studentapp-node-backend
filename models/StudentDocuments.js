const mongoose = require('mongoose');

const fileSubSchema = new mongoose.Schema({
  resourceType: String,
  createdAt: Date,
  fileType: String,
  fileUrl: String,
  displayName: String,
  url: String,
}, { _id: false });

const studentDocumentsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  aadhar: fileSubSchema,
  tenth: fileSubSchema,
  twelfth: fileSubSchema,
  degree: fileSubSchema,
  photo: fileSubSchema,
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StudentDocuments', studentDocumentsSchema);

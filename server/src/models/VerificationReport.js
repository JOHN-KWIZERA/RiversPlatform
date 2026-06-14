const mongoose = require('mongoose');

const verificationReportSchema = new mongoose.Schema(
  {
    leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    evidence: [
      {
        url: String,
        type: { type: String, enum: ['image', 'video', 'document'] },
        caption: String,
      },
    ],
    narrative: { type: String, required: true },
    beneficiaryDetails: [
      {
        name: String,
        age: Number,
        needs: String,
        location: String,
      },
    ],
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected'],
      default: 'submitted',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNote: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VerificationReport', verificationReportSchema);

const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['education', 'healthcare', 'food_security', 'emergency', 'housing', 'youth_employment'],
      required: true,
    },
    targetAmount: { type: Number, required: true, min: 0 },
    raisedAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'RWF' },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'rejected', 'active', 'completed', 'paused'],
      default: 'draft',
    },
    community: { type: String, required: true },
    sector: { type: String, default: '' },
    district: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    images: [{ type: String }],
    beneficiaryCount: { type: Number, default: 0 },
    donorCount: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    adminNote: { type: String, default: '' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    verificationEvidence: [
      {
        url: String,
        type: { type: String, enum: ['image', 'video', 'document'] },
        caption: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    tags: [{ type: String }],
    isUrgent: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

campaignSchema.virtual('progressPercent').get(function () {
  if (!this.targetAmount) return 0;
  return Math.min(Math.round((this.raisedAmount / this.targetAmount) * 100), 100);
});

campaignSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Campaign', campaignSchema);

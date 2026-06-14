const mongoose = require('mongoose');

const impactReportSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    summary: { type: String, required: true },
    fundsUsed: { type: Number, required: true },
    familiesSupported: { type: Number, default: 0 },
    youthEmployed: { type: Number, default: 0 },
    outcomes: [
      {
        metric: String,
        value: String,
        description: String,
      },
    ],
    evidence: [
      {
        url: String,
        type: { type: String, enum: ['image', 'video', 'document'] },
        caption: String,
      },
    ],
    isPublished: { type: Boolean, default: false },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ImpactReport', impactReportSchema);

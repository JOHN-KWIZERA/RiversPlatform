const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'RWF' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['mobile_money', 'bank_transfer', 'card', 'cash'],
      default: 'mobile_money',
    },
    paymentRef: { type: String, default: '' },
    receiptUrl: { type: String, default: '' },
    message: { type: String, default: '' },
    isAnonymous: { type: Boolean, default: false },
    donatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);

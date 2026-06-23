const mongoose = require('mongoose');

const assistanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { type: String, required: true }, // e.g. 'Food', 'Medical', 'Education'
  description: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { _id: true, timestamps: true });

const progressSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  title: { type: String, required: true },
  notes: { type: String, default: '' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { _id: true, timestamps: true });

const beneficiarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  needsCategory: {
    type: String,
    enum: ['education', 'healthcare', 'food_security', 'housing', 'youth_employment', 'emergency', 'other'],
    required: true,
  },
  householdSize: { type: Number, default: 1 },
  district: { type: String, default: '' },
  sector: { type: String, default: '' },
  background: { type: String, default: '' },
  status: { type: String, enum: ['active', 'graduated', 'inactive'], default: 'active' },
  enrolledCampaigns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],
  assistanceHistory: [assistanceSchema],
  progressUpdates: [progressSchema],
}, { timestamps: true });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);

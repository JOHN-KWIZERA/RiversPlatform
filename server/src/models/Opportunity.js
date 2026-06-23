const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  community: { type: String, required: true },
  district: { type: String, default: '' },
  skills: [{ type: String }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  slots: { type: Number, default: 10 },
  filledSlots: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'closed', 'cancelled'], default: 'open' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Opportunity', opportunitySchema);

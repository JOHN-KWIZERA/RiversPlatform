const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorName: { type: String, default: '' },
  action: {
    type: String,
    required: true,
    enum: [
      'campaign_created', 'campaign_updated', 'campaign_approved', 'campaign_rejected',
      'donation_created', 'user_registered', 'user_verified', 'opportunity_created',
      'beneficiary_assistance_added', 'beneficiary_progress_added', 'login',
    ],
  },
  targetType: { type: String, default: '' }, // 'Campaign', 'Donation', 'User', etc.
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
  targetLabel: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: '' },
}, { timestamps: true });

auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

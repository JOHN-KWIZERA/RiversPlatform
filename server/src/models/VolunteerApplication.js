const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Personal info captured at application time
  phone: { type: String, default: '' },
  linkedIn: { type: String, default: '' },
  languages: [{ type: String }],
  emergencyContactName: { type: String, default: '' },
  emergencyContactPhone: { type: String, default: '' },

  // Document URLs (Supabase)
  cvUrl: { type: String, default: '' },
  idDocumentUrl: { type: String, default: '' },

  // Application content
  coverLetter: { type: String, default: '' },
  experience: { type: String, default: '' },
  message: { type: String, default: '' },

  // Availability
  availableFrom: { type: Date },
  hoursPerWeek: { type: Number },

  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'withdrawn'], default: 'pending' },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });

applicationSchema.index({ opportunityId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('VolunteerApplication', applicationSchema);

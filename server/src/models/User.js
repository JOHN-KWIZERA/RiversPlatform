const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    role: {
      type: String,
      enum: ['admin', 'community_leader', 'sponsor', 'volunteer', 'beneficiary'],
      required: true,
    },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    // Role-specific fields
    organisation: { type: String, default: '' },      // sponsor / NGO
    community: { type: String, default: '' },          // community leader
    accessLevel: { type: String, default: 'standard' }, // admin
    skills: [{ type: String }],                        // volunteer
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

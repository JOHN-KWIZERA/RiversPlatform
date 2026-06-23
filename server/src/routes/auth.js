const express = require('express');
const router = express.Router();
const { admin } = require('../config/firebase');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { sendPasswordReset } = require('../services/emailService');

// Register – called after Firebase signup on the client
router.post('/register', async (req, res, next) => {
  try {
    const { idToken, fullName, role, organisation, community, phone } = req.body;
    const decoded = await admin.auth().verifyIdToken(idToken);

    const exists = await User.findOne({ firebaseUid: decoded.uid });
    if (exists) return res.status(409).json({ message: 'User already registered' });

    const user = await User.create({
      firebaseUid: decoded.uid,
      fullName,
      email: decoded.email,
      role,
      organisation: organisation || '',
      community: community || '',
      phone: phone || '',
    });

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

// Get current user profile — auto-creates a record if the Firebase user has no DB entry yet
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = await admin.auth().verifyIdToken(authHeader.split(' ')[1]);
    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) return res.status(404).json({ message: 'User not found. Please complete registration.' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Forgot password — generate Firebase reset link and send branded email
router.post('/forgot-password', async (req, res, next) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    const resetLink = await admin.auth().generatePasswordResetLink(email);
    const dbUser = await User.findOne({ email }).lean();
    await sendPasswordReset(email, resetLink, dbUser?.fullName || '');
    res.json({ success: true });
  } catch (err) {
    // Return success regardless to avoid email enumeration
    res.json({ success: true });
  }
});

// Update profile
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const allowed = ['fullName', 'phone', 'location', 'organisation', 'community', 'skills', 'avatar'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

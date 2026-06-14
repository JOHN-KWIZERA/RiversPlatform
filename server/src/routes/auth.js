const express = require('express');
const router = express.Router();
const { admin } = require('../config/firebase');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

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
    let user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      // User exists in Firebase but hasn't registered through the app yet — create a basic profile
      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email || '',
        fullName: decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'User'),
        role: 'sponsor', // default role — can be changed in Settings
      });
    }

    res.json(user);
  } catch (err) {
    next(err);
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

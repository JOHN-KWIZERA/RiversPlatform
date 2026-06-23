const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

router.use(authenticate, requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const { action, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

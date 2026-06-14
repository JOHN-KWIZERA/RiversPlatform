const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analyticsController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/admin', authenticate, requireRole('admin'), ctrl.getAdminStats);
router.get('/leader', authenticate, requireRole('community_leader'), ctrl.getLeaderStats);
router.get('/sponsor', authenticate, requireRole('sponsor'), ctrl.getSponsorStats);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/beneficiaryController');

router.use(authenticate);

// Beneficiary's own profile
router.get('/me', requireRole('beneficiary', 'admin'), ctrl.getMyProfile);
router.patch('/me', requireRole('beneficiary', 'admin'), ctrl.updateMyProfile);

// Admin / leader views
router.get('/', requireRole('admin', 'community_leader'), ctrl.getAllBeneficiaries);
router.post('/:beneficiaryId/assistance', requireRole('admin', 'community_leader'), ctrl.addAssistance);
router.post('/:beneficiaryId/progress', requireRole('admin', 'community_leader'), ctrl.addProgress);

module.exports = router;

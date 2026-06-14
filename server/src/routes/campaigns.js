const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/campaignController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', ctrl.getCampaigns);
router.get('/my', authenticate, requireRole('community_leader'), ctrl.getLeaderCampaigns);
router.get('/:id', ctrl.getCampaignById);
router.post('/', authenticate, requireRole('community_leader'), ctrl.createCampaign);
router.patch('/:id', authenticate, ctrl.updateCampaign);
router.patch('/:id/approve', authenticate, requireRole('admin'), ctrl.approveCampaign);

module.exports = router;

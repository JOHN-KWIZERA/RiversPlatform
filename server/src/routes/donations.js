const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/donationController');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/', authenticate, requireRole('sponsor', 'community_leader'), ctrl.createDonation);
router.get('/my', authenticate, requireRole('sponsor', 'community_leader'), ctrl.getSponsorDonations);
router.get('/campaign/:campaignId', authenticate, ctrl.getCampaignDonations);

module.exports = router;

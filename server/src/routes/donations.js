const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/donationController');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/', authenticate, requireRole('sponsor'), ctrl.createDonation);
router.get('/my', authenticate, requireRole('sponsor'), ctrl.getSponsorDonations);
router.get('/campaign/:campaignId', authenticate, ctrl.getCampaignDonations);

module.exports = router;

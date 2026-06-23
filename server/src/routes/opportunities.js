const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/opportunityController');

// Public — no auth required
router.get('/', ctrl.getOpportunities);

router.use(authenticate);

// Static paths before parameterized ones to prevent shadowing
router.get('/my-applications', requireRole('volunteer', 'community_leader', 'sponsor', 'admin'), ctrl.getMyApplications);

// Single opportunity by ID
router.get('/:id', ctrl.getOpportunityById);

// Volunteer apply
router.post('/:id/apply', requireRole('volunteer', 'community_leader', 'sponsor'), ctrl.applyForOpportunity);

// Admin / leader manage
router.post('/', requireRole('admin', 'community_leader'), ctrl.createOpportunity);
router.patch('/:id', requireRole('admin', 'community_leader'), ctrl.updateOpportunity);
router.patch('/:id/applications/:appId', requireRole('admin', 'community_leader'), ctrl.updateApplicationStatus);

module.exports = router;

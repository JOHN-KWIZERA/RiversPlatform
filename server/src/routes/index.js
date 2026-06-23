const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/campaigns', require('./campaigns'));
router.use('/donations', require('./donations'));
router.use('/analytics', require('./analytics'));
router.use('/users', require('./users'));
router.use('/upload', require('./upload'));
router.use('/notifications', require('./notifications'));
router.use('/opportunities', require('./opportunities'));
router.use('/beneficiaries', require('./beneficiaries'));
router.use('/audit', require('./audit'));

module.exports = router;

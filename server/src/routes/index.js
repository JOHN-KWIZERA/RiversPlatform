const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/campaigns', require('./campaigns'));
router.use('/donations', require('./donations'));
router.use('/analytics', require('./analytics'));
router.use('/users', require('./users'));

module.exports = router;

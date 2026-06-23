const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

router.use(authenticate);

router.get('/',            ctrl.getMyNotifications);
router.patch('/read',      ctrl.markRead);
router.delete('/:id',      ctrl.deleteNotification);

module.exports = router;

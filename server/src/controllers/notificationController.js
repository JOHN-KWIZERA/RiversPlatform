const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { ids } = req.body; // array of notification IDs, or empty to mark all
    const filter = { userId: req.user._id };
    if (ids?.length) filter._id = { $in: ids };
    await Notification.updateMany(filter, { read: true });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Internal helper — called from other controllers
exports.createNotification = async ({ userId, type, title, body, link = '' }) => {
  try {
    await Notification.create({ userId, type, title, body, link });
  } catch (err) {
    console.error('createNotification error:', err.message);
  }
};

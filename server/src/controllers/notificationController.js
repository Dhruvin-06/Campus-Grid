const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;

  const user = await User.findById(req.user._id).select('notifications');
  if (!user) { res.status(404); throw new Error('User not found'); }

  let notifications = [...user.notifications].reverse(); // newest first

  if (unreadOnly === 'true') {
    notifications = notifications.filter((n) => !n.read);
  }

  const total = notifications.length;
  const unreadCount = user.notifications.filter((n) => !n.read).length;

  // Manual pagination on the in-memory array
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginated = notifications.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    total,
    unreadCount,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    notifications: paginated,
  });
});

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:notifId/read
// @access  Private
const markRead = asyncHandler(async (req, res) => {
  await User.findOneAndUpdate(
    { _id: req.user._id, 'notifications._id': req.params.notifId },
    { $set: { 'notifications.$.read': true } }
  );
  res.json({ success: true, message: 'Notification marked as read' });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllRead = asyncHandler(async (req, res) => {
  await User.updateOne(
    { _id: req.user._id },
    { $set: { 'notifications.$[].read': true } }
  );
  res.json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('notifications');
  const count = user?.notifications.filter((n) => !n.read).length || 0;
  res.json({ success: true, count });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:notifId
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { notifications: { _id: req.params.notifId } },
  });
  res.json({ success: true, message: 'Notification deleted' });
});

// @desc    Clear all notifications
// @route   DELETE /api/notifications
// @access  Private
const clearAllNotifications = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { notifications: [] } });
  res.json({ success: true, message: 'All notifications cleared' });
});

module.exports = {
  getNotifications, markRead, markAllRead,
  getUnreadCount, deleteNotification, clearAllNotifications,
};

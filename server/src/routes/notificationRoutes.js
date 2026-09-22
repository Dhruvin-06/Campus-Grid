const express = require('express');
const router = express.Router();
const {
  getNotifications, markRead, markAllRead,
  getUnreadCount, deleteNotification, clearAllNotifications,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllRead);
router.put('/:notifId/read', markRead);
router.delete('/', clearAllNotifications);
router.delete('/:notifId', deleteNotification);

module.exports = router;

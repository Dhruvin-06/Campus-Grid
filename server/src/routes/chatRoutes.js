const express = require('express');
const router = express.Router();
const { getConversation, sendMessage, getConversations, getUnreadCount } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.get('/:userId', protect, getConversation);
router.post('/send', protect, sendMessage);

module.exports = router;

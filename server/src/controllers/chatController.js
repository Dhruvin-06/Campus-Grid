const Message = require('../models/Message');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get conversation history between two users
// @route   GET /api/chat/:userId
// @access  Private
const getConversation = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 30 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const messages = await Message.find({
    $or: [
      { sender: req.user.id, receiver: userId },
      { sender: userId, receiver: req.user.id },
    ],
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar');

  // Mark messages as read
  await Message.updateMany(
    { sender: userId, receiver: req.user.id, read: false },
    { read: true }
  );

  res.json({ success: true, messages: messages.reverse() });
});

// @desc    Send a message (HTTP fallback, Socket.io is primary)
// @route   POST /api/chat/send
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    res.status(404);
    throw new Error('Receiver not found');
  }

  const message = await Message.create({
    sender: req.user.id,
    receiver: receiverId,
    content,
  });

  const populated = await message.populate(['sender', 'receiver'], 'name avatar');
  res.status(201).json({ success: true, message: populated });
});

// @desc    Get all conversations (inbox list)
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  // Get the last message for each unique conversation
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: req.user._id },
          { receiver: req.user._id },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: {
            if: { $lt: ['$sender', '$receiver'] },
            then: { s: '$sender', r: '$receiver' },
            else: { s: '$receiver', r: '$sender' },
          },
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$receiver', req.user._id] }, { $eq: ['$read', false] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
    { $limit: 20 },
  ]);

  // Populate user details
  const populated = await Message.populate(
    conversations.map((c) => c.lastMessage),
    [
      { path: 'sender', select: 'name avatar rollNumber' },
      { path: 'receiver', select: 'name avatar rollNumber' },
    ]
  );

  res.json({ success: true, conversations: populated });
});

// @desc    Get unread message count
// @route   GET /api/chat/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({ receiver: req.user.id, read: false });
  res.json({ success: true, count });
});

module.exports = { getConversation, sendMessage, getConversations, getUnreadCount };

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

/**
 * Socket.io setup for real-time chat and notifications
 * @param {import('socket.io').Server} io
 */
const initializeSocket = (io) => {
  // Map of userId -> socketId for online status
  const onlineUsers = new Map();

  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication error: No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name avatar rollNumber');
      if (!user) return next(new Error('Authentication error: User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🟢 Socket connected: ${socket.user.name} (${userId})`);

    // Register user as online
    onlineUsers.set(userId, socket.id);
    
    // Broadcast online status to all connected users
    io.emit('user:online', { userId, online: true });

    // Join user's personal room for targeted notifications
    socket.join(`user:${userId}`);

    // ─── Chat Events ─────────────────────────────────────────────────────────

    // Send message
    socket.on('message:send', async ({ receiverId, content }) => {
      try {
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content,
        });

        const populated = await Message.findById(message._id)
          .populate('sender', 'name avatar')
          .populate('receiver', 'name avatar');

        // Emit to sender
        socket.emit('message:sent', populated);

        // Emit to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:receive', populated);
          io.to(receiverSocketId).emit('notification:new', {
            type: 'message',
            message: `New message from ${socket.user.name}`,
            from: { _id: userId, name: socket.user.name, avatar: socket.user.avatar },
          });
        }
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('message:read', async ({ senderId }) => {
      await Message.updateMany(
        { sender: senderId, receiver: userId, read: false },
        { read: true }
      );
      // Notify sender that messages were read
      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('message:readAck', { by: userId });
      }
    });

    // Typing indicator
    socket.on('typing:start', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:indicator', {
          userId,
          name: socket.user.name,
          isTyping: true,
        });
      }
    });

    socket.on('typing:stop', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:indicator', {
          userId,
          name: socket.user.name,
          isTyping: false,
        });
      }
    });

    // ─── Notifications ────────────────────────────────────────────────────────

    socket.on('notification:send', ({ targetUserId, notification }) => {
      const targetSocketId = onlineUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('notification:new', notification);
      }
    });

    // ─── Get online users ─────────────────────────────────────────────────────

    socket.on('users:getOnline', () => {
      socket.emit('users:online', Array.from(onlineUsers.keys()));
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────

    socket.on('disconnect', () => {
      console.log(`🔴 Socket disconnected: ${socket.user.name}`);
      onlineUsers.delete(userId);
      io.emit('user:online', { userId, online: false });
    });
  });

  return io;
};

module.exports = initializeSocket;

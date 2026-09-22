require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const initializeSocket = require('./src/socket/socketHandler');

// Route imports — CampusGrid core routes only
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const resourceRoutes = require('./src/routes/resourceRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const lostFoundRoutes = require('./src/routes/lostFoundRoutes');
const contentRoutes = require('./src/routes/contentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const opportunityRoutes = require('./src/routes/opportunityRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const aiRoutes = require('./src/routes/aiRoutes');

// ─── App Setup ─────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initializeSocket(io);

// ─── Database ──────────────────────────────────────────────────────────────────
connectDB();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/lostfound', lostFoundRoutes);
app.use('/api', contentRoutes);           // /api/announcements, /api/feed
app.use('/api/admin', adminRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'CampusGrid API' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║       🎓 CampusGrid API Server        ║
  ╠═══════════════════════════════════════╣
  ║  Port   : ${PORT}                        ║
  ║  Mode   : ${process.env.NODE_ENV || 'development'}               ║
  ║  Socket : Enabled ✅                  ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };

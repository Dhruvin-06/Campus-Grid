const express = require('express');
const router = express.Router();
const {
  createAnnouncement, getAnnouncements, deleteAnnouncement,
  createBlog, getBlogs, likeBlog, commentOnBlog, approveBlog, getPendingBlogs,
} = require('../controllers/announcementController');
const { protect, authorize, adminOnly } = require('../middleware/auth');
const { uploadImage } = require('../config/upload');

// Announcements
router.get('/announcements', protect, getAnnouncements);
router.post('/announcements', protect, authorize('admin', 'faculty'), createAnnouncement);
router.delete('/announcements/:id', protect, adminOnly, deleteAnnouncement);

// Blogs
router.get('/blogs', protect, getBlogs);
router.get('/blogs/pending', protect, authorize('admin', 'faculty'), getPendingBlogs);
router.post('/blogs', protect, uploadImage.single('coverImage'), createBlog);
router.put('/blogs/:id/like', protect, likeBlog);
router.post('/blogs/:id/comment', protect, commentOnBlog);
router.put('/blogs/:id/approve', protect, authorize('admin', 'faculty'), approveBlog);

module.exports = router;

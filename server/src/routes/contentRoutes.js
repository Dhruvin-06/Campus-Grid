const express = require('express');
const router = express.Router();
const {
  createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement,
  createCampusPost, getCampusPosts, updateCampusPost, likeCampusPost, commentOnCampusPost,
  approveCampusPost, getPendingCampusPosts, deleteCampusPost,
} = require('../controllers/announcementController');
const { protect, staffOnly, staffAndPlacement } = require('../middleware/auth');
const { uploadImage } = require('../config/upload');

// ─── Announcements (admin/faculty/placement post; all read) ────────────────────
router.get('/announcements', protect, getAnnouncements);
router.post('/announcements', protect, staffAndPlacement, createAnnouncement);
router.put('/announcements/:id', protect, staffAndPlacement, updateAnnouncement);
router.delete('/announcements/:id', protect, staffAndPlacement, deleteAnnouncement);

// ─── Campus Feed (student posts go to approval; admin/faculty auto-publish) ────
router.get('/feed', protect, getCampusPosts);
router.get('/feed/pending', protect, staffOnly, getPendingCampusPosts);
router.post('/feed', protect, uploadImage.single('coverImage'), createCampusPost);
router.put('/feed/:id', protect, updateCampusPost);
router.put('/feed/:id/like', protect, likeCampusPost);
router.post('/feed/:id/comment', protect, commentOnCampusPost);
router.put('/feed/:id/approve', protect, staffOnly, approveCampusPost);
router.delete('/feed/:id', protect, deleteCampusPost);

module.exports = router;


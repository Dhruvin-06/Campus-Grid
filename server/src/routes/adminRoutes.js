const express = require('express');
const router = express.Router();
const {
  getAnalytics, getUsers, getAuditLog,
  broadcastAnnouncement, reviewResource, adminUpdateUser,
} = require('../controllers/adminController');
const { protect, adminOnly, placementOrAdmin } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.get('/audit-log', getAuditLog);
router.post('/broadcast', broadcastAnnouncement);
router.put('/resources/:id/review', reviewResource);
router.put('/users/:id', adminUpdateUser);

module.exports = router;

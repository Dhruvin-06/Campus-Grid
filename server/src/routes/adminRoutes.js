const express = require('express');
const router = express.Router();
const {
  getAnalytics, getUsers, getAuditLog, getPlacementReport,
  broadcastAnnouncement, getAdminEvents, createAdminEvent, updateAdminEvent, deleteAdminEvent,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.get('/audit-log', getAuditLog);
router.get('/placement-report', getPlacementReport);
router.post('/broadcast', broadcastAnnouncement);

// Event management
router.get('/events', getAdminEvents);
router.post('/events', createAdminEvent);
router.put('/events/:id', updateAdminEvent);
router.delete('/events/:id', deleteAdminEvent);

module.exports = router;

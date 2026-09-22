const express = require('express');
const router = express.Router();
const {
  getAllUsers, getUserById, getPeerMatches,
  sendConnectionRequest, acceptConnection, removeConnection,
  toggleUserActive, changeUserRole, updateAvatar, getOverviewStats,
} = require('../controllers/userController');
const { protect, adminOnly, authorize } = require('../middleware/auth');
const { uploadAvatar } = require('../config/upload');

router.get('/stats', protect, getOverviewStats);
router.get('/', protect, authorize('admin', 'faculty'), getAllUsers);
router.get('/peer-match', protect, getPeerMatches);
router.get('/:id', protect, getUserById);
router.post('/:id/connect', protect, sendConnectionRequest);
router.put('/:id/connect/accept', protect, acceptConnection);
router.delete('/:id/connect', protect, removeConnection);
router.put('/:id/toggle-active', protect, adminOnly, toggleUserActive);
router.put('/:id/role', protect, adminOnly, changeUserRole);
router.put('/avatar', protect, uploadAvatar.single('avatar'), updateAvatar);

module.exports = router;

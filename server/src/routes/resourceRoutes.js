const express = require('express');
const router = express.Router();
const {
  uploadResource, getResources, getResourceById, trackDownload,
  likeResource, approveResource, deleteResource, getPendingResources,
} = require('../controllers/resourceController');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadDocument } = require('../config/upload');

router.get('/', protect, getResources);
router.get('/pending', protect, adminOnly, getPendingResources);
router.get('/:id', protect, getResourceById);
router.post('/', protect, uploadDocument.single('file'), uploadResource);
router.put('/:id/download', protect, trackDownload);
router.put('/:id/like', protect, likeResource);
router.put('/:id/approve', protect, adminOnly, approveResource);
router.delete('/:id', protect, deleteResource);

module.exports = router;

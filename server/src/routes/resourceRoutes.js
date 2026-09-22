const express = require('express');
const router = express.Router();
const {
  uploadResource, getResources, getResourceById, trackDownload,
  likeResource, approveResource, deleteResource, getPendingResources,
} = require('../controllers/resourceController');
const { protect, staffOnly } = require('../middleware/auth');
const { uploadDocument } = require('../config/upload');

router.get('/', protect, getResources);
router.get('/pending', protect, staffOnly, getPendingResources);
router.get('/:id', protect, getResourceById);
router.post('/', protect, uploadDocument.single('file'), uploadResource);
router.put('/:id/download', protect, trackDownload);
router.put('/:id/like', protect, likeResource);
router.put('/:id/approve', protect, staffOnly, approveResource);
router.delete('/:id', protect, deleteResource);

module.exports = router;


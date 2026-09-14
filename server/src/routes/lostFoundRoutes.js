const express = require('express');
const router = express.Router();
const {
  createPost, getPosts, resolvePost, deletePost,
} = require('../controllers/lostFoundController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../config/upload');

router.get('/', protect, getPosts);
router.post('/', protect, uploadImage.single('image'), createPost);
router.put('/:id/resolve', protect, resolvePost);
router.delete('/:id', protect, deletePost);

module.exports = router;

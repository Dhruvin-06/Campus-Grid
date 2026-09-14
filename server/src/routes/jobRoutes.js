const express = require('express');
const router = express.Router();
const {
  createJob, getJobs, getJobById, bookmarkJob, getBookmarkedJobs, updateJob, deleteJob,
} = require('../controllers/jobController');
const { protect, placementOrAdmin } = require('../middleware/auth');

router.get('/', protect, getJobs);
router.get('/bookmarks', protect, getBookmarkedJobs);
router.get('/:id', protect, getJobById);
router.post('/', protect, placementOrAdmin, createJob);
router.put('/:id', protect, placementOrAdmin, updateJob);
router.put('/:id/bookmark', protect, bookmarkJob);
router.delete('/:id', protect, placementOrAdmin, deleteJob);

module.exports = router;

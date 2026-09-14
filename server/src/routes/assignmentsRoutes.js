const express = require('express');
const router = express.Router();
const { getAssignments, createAssignment, updateAssignment, deleteAssignment, getStats } = require('../controllers/assignmentsController');
const { protect, authorize } = require('../middleware/auth');

const staffOnly = authorize('admin', 'faculty');

router.use(protect);
router.get('/stats', getStats);
router.get('/', getAssignments);
router.post('/', staffOnly, createAssignment);
router.put('/:id', staffOnly, updateAssignment);
router.delete('/:id', staffOnly, deleteAssignment);

module.exports = router;

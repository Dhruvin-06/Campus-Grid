const express = require('express');
const router = express.Router();
const { getTimetable, addSlot, updateSlot, deleteSlot, updateSemester } = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/auth');

const staffOnly = authorize('admin', 'faculty');

router.use(protect);
router.get('/', getTimetable);
router.post('/slots', staffOnly, addSlot);
router.put('/semester', staffOnly, updateSemester);
router.put('/slots/:slotId', staffOnly, updateSlot);
router.delete('/slots/:slotId', staffOnly, deleteSlot);

module.exports = router;

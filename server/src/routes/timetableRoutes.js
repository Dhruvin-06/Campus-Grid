const express = require('express');
const router = express.Router();
const { getTimetable, addSlot, updateSlot, deleteSlot, updateSemester } = require('../controllers/timetableController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getTimetable);
router.post('/slots', addSlot);
router.put('/semester', updateSemester);
router.put('/slots/:slotId', updateSlot);
router.delete('/slots/:slotId', deleteSlot);

module.exports = router;

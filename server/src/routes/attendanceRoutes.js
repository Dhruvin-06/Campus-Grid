const express = require('express');
const router = express.Router();
const { getAttendance, addSubject, logAttendance, removeSubject, deleteRecord } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

const staffOnly = authorize('admin', 'faculty');

router.use(protect);
router.get('/', getAttendance);
router.post('/subjects', staffOnly, addSubject);
router.post('/subjects/:subjectId/log', staffOnly, logAttendance);
router.delete('/subjects/:subjectId', staffOnly, removeSubject);
router.delete('/subjects/:subjectId/log/:recordId', staffOnly, deleteRecord);

module.exports = router;

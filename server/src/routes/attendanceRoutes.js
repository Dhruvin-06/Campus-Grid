const express = require('express');
const router = express.Router();
const { getAttendance, addSubject, logAttendance, removeSubject, deleteRecord } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

const staffOnly = authorize('admin', 'faculty');

router.use(protect);
router.get('/', getAttendance);
router.post('/subjects', addSubject);                              // students manage own subjects
router.post('/subjects/:subjectId/log', logAttendance);           // students log own attendance
router.delete('/subjects/:subjectId', removeSubject);             // students delete own subjects
router.delete('/subjects/:subjectId/log/:recordId', deleteRecord); // students delete own records

module.exports = router;

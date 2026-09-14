const express = require('express');
const router = express.Router();
const { getAttendance, addSubject, logAttendance, removeSubject, deleteRecord } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getAttendance);
router.post('/subjects', addSubject);
router.post('/subjects/:subjectId/log', logAttendance);
router.delete('/subjects/:subjectId', removeSubject);
router.delete('/subjects/:subjectId/log/:recordId', deleteRecord);

module.exports = router;

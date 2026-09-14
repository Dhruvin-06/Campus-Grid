const express = require('express');
const router = express.Router();
const { getGrades, getSemesterRecord, upsertSemester, deleteSemester } = require('../controllers/gradesController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getGrades);
router.post('/', upsertSemester);
router.get('/:semester', getSemesterRecord);
router.delete('/:semester', deleteSemester);

module.exports = router;

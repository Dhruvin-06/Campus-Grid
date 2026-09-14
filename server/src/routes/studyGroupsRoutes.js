const express = require('express');
const router = express.Router();
const { getStudyGroups, getMyGroups, createGroup, joinGroup, leaveGroup, deleteGroup } = require('../controllers/studyGroupsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getStudyGroups);
router.get('/mine', getMyGroups);
router.post('/', createGroup);
router.post('/:id/join', joinGroup);
router.delete('/:id/leave', leaveGroup);
router.delete('/:id', deleteGroup);

module.exports = router;

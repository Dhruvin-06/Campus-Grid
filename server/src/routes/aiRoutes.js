const express = require('express');
const router = express.Router();
const { askAssistant, suggestQuestions } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/ask', askAssistant);
router.post('/suggest', suggestQuestions);

module.exports = router;

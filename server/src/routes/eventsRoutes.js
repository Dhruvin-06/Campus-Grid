const express = require('express');
const router = express.Router();
const { getEvents, getEvent, createEvent, updateEvent, deleteEvent, rsvpEvent } = require('../controllers/eventsController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/:id/rsvp', rsvpEvent);

// Admin only
router.post('/', adminOnly, createEvent);
router.put('/:id', adminOnly, updateEvent);
router.delete('/:id', adminOnly, deleteEvent);

module.exports = router;

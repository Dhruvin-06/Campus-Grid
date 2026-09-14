const Event = require('../models/Event');
const asyncHandler = require('express-async-handler');

// @desc  Get all published events
// @route GET /api/events?type=hackathon
const getEvents = asyncHandler(async (req, res) => {
  const filter = { isPublished: true };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.upcoming === 'true') filter.date = { $gte: new Date() };

  const events = await Event.find(filter)
    .populate('organizer', 'name avatar rollNumber')
    .sort({ isFeatured: -1, date: 1 })
    .limit(50);

  res.json({ success: true, events });
});

// @desc  Get single event
// @route GET /api/events/:id
const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('organizer', 'name avatar rollNumber')
    .populate('rsvps', 'name avatar rollNumber branch');
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json({ success: true, event });
});

// @desc  Create event (admin only)
// @route POST /api/events
const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({ ...req.body, organizer: req.user._id });
  res.status(201).json({ success: true, event });
});

// @desc  Update event (admin only)
// @route PUT /api/events/:id
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json({ success: true, event });
});

// @desc  Delete event (admin only)
// @route DELETE /api/events/:id
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json({ success: true, message: 'Event deleted' });
});

// @desc  RSVP to an event
// @route POST /api/events/:id/rsvp
const rsvpEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event || !event.isPublished) return res.status(404).json({ success: false, message: 'Event not found' });

  const alreadyRsvp = event.rsvps.includes(req.user._id);
  if (alreadyRsvp) {
    // Toggle off
    event.rsvps = event.rsvps.filter((r) => String(r) !== String(req.user._id));
  } else {
    if (event.maxAttendees > 0 && event.rsvps.length >= event.maxAttendees) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }
    event.rsvps.push(req.user._id);
  }
  await event.save();
  res.json({ success: true, rsvped: !alreadyRsvp, count: event.rsvps.length });
});

// @desc  Get all events (admin, including unpublished)
// @route GET /api/admin/events
const getAllEventsAdmin = asyncHandler(async (req, res) => {
  const events = await Event.find({})
    .populate('organizer', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, events });
});

module.exports = { getEvents, getEvent, createEvent, updateEvent, deleteEvent, rsvpEvent, getAllEventsAdmin };

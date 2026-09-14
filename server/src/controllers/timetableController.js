const Timetable = require('../models/Timetable');
const asyncHandler = require('express-async-handler');

// @desc  Get current user's timetable
// @route GET /api/timetable
const getTimetable = asyncHandler(async (req, res) => {
  let tt = await Timetable.findOne({ userId: req.user._id });
  if (!tt) {
    tt = await Timetable.create({ userId: req.user._id, slots: [] });
  }
  res.json({ success: true, timetable: tt });
});

// @desc  Add a slot
// @route POST /api/timetable/slots
const addSlot = asyncHandler(async (req, res) => {
  const tt = await Timetable.findOneAndUpdate(
    { userId: req.user._id },
    { $push: { slots: req.body } },
    { new: true, upsert: true }
  );
  res.status(201).json({ success: true, timetable: tt });
});

// @desc  Update a slot
// @route PUT /api/timetable/slots/:slotId
const updateSlot = asyncHandler(async (req, res) => {
  const tt = await Timetable.findOne({ userId: req.user._id });
  if (!tt) return res.status(404).json({ success: false, message: 'Timetable not found' });

  const slot = tt.slots.id(req.params.slotId);
  if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

  Object.assign(slot, req.body);
  await tt.save();
  res.json({ success: true, timetable: tt });
});

// @desc  Delete a slot
// @route DELETE /api/timetable/slots/:slotId
const deleteSlot = asyncHandler(async (req, res) => {
  const tt = await Timetable.findOneAndUpdate(
    { userId: req.user._id },
    { $pull: { slots: { _id: req.params.slotId } } },
    { new: true }
  );
  res.json({ success: true, timetable: tt });
});

// @desc  Update semester label
// @route PUT /api/timetable/semester
const updateSemester = asyncHandler(async (req, res) => {
  const tt = await Timetable.findOneAndUpdate(
    { userId: req.user._id },
    { semester: req.body.semester },
    { new: true, upsert: true }
  );
  res.json({ success: true, timetable: tt });
});

module.exports = { getTimetable, addSlot, updateSlot, deleteSlot, updateSemester };

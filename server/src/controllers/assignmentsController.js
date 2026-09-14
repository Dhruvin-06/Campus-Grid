const Assignment = require('../models/Assignment');
const asyncHandler = require('express-async-handler');

// @desc  Get all assignments (optionally filtered by status)
// @route GET /api/assignments?status=todo
const getAssignments = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const assignments = await Assignment.find(filter).sort({ dueDate: 1, createdAt: -1 });
  res.json({ success: true, assignments });
});

// @desc  Create assignment
// @route POST /api/assignments
const createAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.create({ ...req.body, userId: req.user._id });
  res.status(201).json({ success: true, assignment });
});

// @desc  Update assignment (including status change for Kanban drag)
// @route PUT /api/assignments/:id
const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.user._id });
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

  // If marking as done, record completion time
  if (req.body.status === 'done' && assignment.status !== 'done') {
    req.body.completedAt = new Date();
  }

  Object.assign(assignment, req.body);
  await assignment.save();
  res.json({ success: true, assignment });
});

// @desc  Delete assignment
// @route DELETE /api/assignments/:id
const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
  res.json({ success: true, message: 'Assignment deleted' });
});

// @desc  Get assignment stats for dashboard widget
// @route GET /api/assignments/stats
const getStats = asyncHandler(async (req, res) => {
  const [todo, in_progress, done, overdue] = await Promise.all([
    Assignment.countDocuments({ userId: req.user._id, status: 'todo' }),
    Assignment.countDocuments({ userId: req.user._id, status: 'in_progress' }),
    Assignment.countDocuments({ userId: req.user._id, status: 'done' }),
    Assignment.countDocuments({ userId: req.user._id, status: { $ne: 'done' }, dueDate: { $lt: new Date() } }),
  ]);
  res.json({ success: true, stats: { todo, in_progress, done, overdue } });
});

module.exports = { getAssignments, createAssignment, updateAssignment, deleteAssignment, getStats };

const StudyGroup = require('../models/StudyGroup');
const asyncHandler = require('express-async-handler');

// @desc  Get all study groups (with optional filters)
// @route GET /api/studygroups?branch=CSE&year=2&q=math
const getStudyGroups = asyncHandler(async (req, res) => {
  const filter = { isPublic: true };
  if (req.query.branch && req.query.branch !== 'All') filter.branch = { $in: [req.query.branch, 'All'] };
  if (req.query.year) filter.year = { $in: [Number(req.query.year), 0] };
  if (req.query.q) filter.$text = { $search: req.query.q };

  const groups = await StudyGroup.find(filter)
    .populate('admin', 'name avatar rollNumber')
    .populate('members', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ success: true, groups });
});

// @desc  Get my study groups
// @route GET /api/studygroups/mine
const getMyGroups = asyncHandler(async (req, res) => {
  const groups = await StudyGroup.find({ members: req.user._id })
    .populate('admin', 'name avatar rollNumber')
    .populate('members', 'name avatar')
    .sort({ createdAt: -1 });
  res.json({ success: true, groups });
});

// @desc  Create study group
// @route POST /api/studygroups
const createGroup = asyncHandler(async (req, res) => {
  const group = await StudyGroup.create({
    ...req.body,
    admin: req.user._id,
    members: [req.user._id],
  });
  const populated = await group.populate('admin', 'name avatar rollNumber');
  res.status(201).json({ success: true, group: populated });
});

// @desc  Join a study group
// @route POST /api/studygroups/:id/join
const joinGroup = asyncHandler(async (req, res) => {
  const group = await StudyGroup.findById(req.params.id);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  if (group.members.includes(req.user._id)) {
    return res.status(400).json({ success: false, message: 'Already a member' });
  }
  if (group.maxMembers > 0 && group.members.length >= group.maxMembers) {
    return res.status(400).json({ success: false, message: 'Group is full' });
  }
  group.members.push(req.user._id);
  await group.save();
  res.json({ success: true, message: 'Joined group', group });
});

// @desc  Leave a study group
// @route DELETE /api/studygroups/:id/leave
const leaveGroup = asyncHandler(async (req, res) => {
  const group = await StudyGroup.findById(req.params.id);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  if (String(group.admin) === String(req.user._id)) {
    return res.status(400).json({ success: false, message: 'Admin cannot leave. Delete the group instead.' });
  }
  group.members = group.members.filter((m) => String(m) !== String(req.user._id));
  await group.save();
  res.json({ success: true, message: 'Left group' });
});

// @desc  Delete a study group (admin only)
// @route DELETE /api/studygroups/:id
const deleteGroup = asyncHandler(async (req, res) => {
  const group = await StudyGroup.findById(req.params.id);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  if (String(group.admin) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  await group.deleteOne();
  res.json({ success: true, message: 'Group deleted' });
});

module.exports = { getStudyGroups, getMyGroups, createGroup, joinGroup, leaveGroup, deleteGroup };

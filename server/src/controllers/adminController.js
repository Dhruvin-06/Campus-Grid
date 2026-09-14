const User = require('../models/User');
const Resource = require('../models/Resource');
const Job = require('../models/Job');
const { Blog } = require('../models/Announcement');
const LostFound = require('../models/LostFound');
const Event = require('../models/Event');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('express-async-handler');

// ─── Helper: log admin action ────────────────────────────────────────────────
const logAction = async (req, action, targetModel = '', targetId = null, details = '') => {
  try {
    await AuditLog.create({
      adminId: req.user._id,
      adminName: req.user.name,
      action,
      targetModel,
      targetId,
      details,
      ip: req.ip || '',
    });
  } catch (_) { /* non-critical */ }
};

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const [
    totalUsers, totalStudents, totalFaculty,
    totalResources, totalJobs, totalBlogs,
    totalLostFound, pendingResources, pendingBlogs, recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'faculty' }),
    Resource.countDocuments({ approved: true }),
    Job.countDocuments({ isActive: true }),
    Blog.countDocuments({ status: 'published' }),
    LostFound.countDocuments({ resolved: false }),
    Resource.countDocuments({ approved: false }),
    Blog.countDocuments({ status: 'pending_approval' }),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email rollNumber role branch createdAt'),
  ]);

  const branchDistribution = await User.aggregate([
    { $match: { role: 'student' } },
    { $group: { _id: '$branch', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const registrationTrend = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Year-wise distribution
  const yearDistribution = await User.aggregate([
    { $match: { role: 'student', year: { $exists: true } } },
    { $group: { _id: '$year', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers, totalStudents, totalFaculty,
      totalResources, totalJobs, totalBlogs,
      totalLostFound, pendingItems: pendingResources + pendingBlogs,
    },
    branchDistribution,
    registrationTrend,
    yearDistribution,
    recentUsers,
  });
});

// @desc    Get paginated users with search
// @route   GET /api/admin/users?search=...&branch=...&role=...&page=1
const getUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const filter = {};
  if (req.query.search) {
    const re = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: re }, { email: re }, { rollNumber: re }];
  }
  if (req.query.branch) filter.branch = req.query.branch;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.year) filter.year = Number(req.query.year);

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
});

// @desc    Get audit log
// @route   GET /api/admin/audit-log
const getAuditLog = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 30;
  const logs = await AuditLog.find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('adminId', 'name avatar');
  const total = await AuditLog.countDocuments();
  res.json({ success: true, logs, total, page, pages: Math.ceil(total / limit) });
});

// @desc    Get placement report (branch-wise placed students)
// @route   GET /api/admin/placement-report
const getPlacementReport = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ type: 'placement', isActive: false })
    .select('title company salary branch year applicants')
    .lean();

  const branchStats = await User.aggregate([
    { $match: { role: 'student' } },
    {
      $group: {
        _id: { branch: '$branch', year: '$year' },
        totalStudents: { $sum: 1 },
      },
    },
    { $sort: { '_id.branch': 1 } },
  ]);

  const activeJobs = await Job.find({ type: 'placement', isActive: true })
    .select('title company salary branch')
    .lean();

  res.json({ success: true, branchStats, activeJobs, closedJobs: jobs });
});

// @desc    Broadcast announcement to users
// @route   POST /api/admin/broadcast
const broadcastAnnouncement = asyncHandler(async (req, res) => {
  const { message, targetBranch, targetYear, targetRole } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

  const filter = {};
  if (targetBranch && targetBranch !== 'All') filter.branch = targetBranch;
  if (targetYear) filter.year = Number(targetYear);
  if (targetRole && targetRole !== 'All') filter.role = targetRole;

  const notification = {
    message,
    type: 'info',
    read: false,
    createdAt: new Date(),
  };

  const result = await User.updateMany(filter, { $push: { notifications: notification } });

  await logAction(req, 'BROADCAST_SENT', 'User', null,
    `Sent to ${result.modifiedCount} users. Filter: ${JSON.stringify(filter)}`);

  res.json({ success: true, sentTo: result.modifiedCount });
});

// @desc    Get all events (admin, incl. unpublished)
// @route   GET /api/admin/events
const getAdminEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({})
    .populate('organizer', 'name avatar')
    .sort({ createdAt: -1 });
  res.json({ success: true, events });
});

// @desc    Create event
// @route   POST /api/admin/events
const createAdminEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({ ...req.body, organizer: req.user._id });
  await logAction(req, 'EVENT_CREATED', 'Event', event._id, event.title);
  res.status(201).json({ success: true, event });
});

// @desc    Update event
// @route   PUT /api/admin/events/:id
const updateAdminEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!event) return res.status(404).json({ success: false, message: 'Not found' });
  await logAction(req, 'EVENT_UPDATED', 'Event', event._id, event.title);
  res.json({ success: true, event });
});

// @desc    Delete event
// @route   DELETE /api/admin/events/:id
const deleteAdminEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Not found' });
  await logAction(req, 'EVENT_DELETED', 'Event', req.params.id, event.title);
  res.json({ success: true, message: 'Event deleted' });
});

module.exports = {
  getAnalytics, getUsers, getAuditLog, getPlacementReport,
  broadcastAnnouncement, getAdminEvents, createAdminEvent, updateAdminEvent, deleteAdminEvent,
};

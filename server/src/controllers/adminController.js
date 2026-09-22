const User = require('../models/User');
const Resource = require('../models/Resource');
const { Announcement, CampusPost } = require('../models/Announcement');
const LostFound = require('../models/LostFound');
const Opportunity = require('../models/Opportunity');
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
    totalUsers, totalStudents, totalFaculty, totalPlacement,
    totalResources, totalCampusPosts,
    totalLostFound, pendingResources, pendingPosts, pendingOpportunities, recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'faculty' }),
    User.countDocuments({ role: 'placement' }),
    Resource.countDocuments({ approved: true }),
    CampusPost.countDocuments({ status: 'published' }),
    LostFound.countDocuments({ resolved: false }),
    Resource.countDocuments({ approved: false }),
    CampusPost.countDocuments({ status: 'pending_approval' }),
    Opportunity.countDocuments({ isVerified: false, isActive: true }),
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

  const yearDistribution = await User.aggregate([
    { $match: { role: 'student', year: { $exists: true } } },
    { $group: { _id: '$year', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Opportunity type distribution
  const opportunityStats = await Opportunity.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers, totalStudents, totalFaculty, totalPlacement,
      totalResources, totalCampusPosts,
      totalLostFound,
      pendingItems: pendingResources + pendingPosts + pendingOpportunities,
      pendingResources, pendingPosts, pendingOpportunities,
    },
    branchDistribution,
    registrationTrend,
    yearDistribution,
    opportunityStats,
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

// @desc    Broadcast announcement to users (admin notification push)
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

// @desc    Admin: approve or reject a resource
// @route   PUT /api/admin/resources/:id/review
const reviewResource = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'approve' | 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Invalid action. Use approve or reject.' });
  }

  const resource = await Resource.findByIdAndUpdate(
    req.params.id,
    { approved: action === 'approve', approvedBy: req.user._id },
    { new: true }
  ).populate('uploadedBy', 'name rollNumber');

  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

  await logAction(req, `RESOURCE_${action.toUpperCase()}D`, 'Resource', resource._id, resource.title);

  // Notify the uploader
  if (resource.uploadedBy?._id) {
    await User.findByIdAndUpdate(resource.uploadedBy._id, {
      $push: {
        notifications: {
          message: `Your resource "${resource.title}" has been ${action === 'approve' ? 'approved ✅' : 'rejected ❌'} by admin.`,
          type: action === 'approve' ? 'success' : 'warning',
          read: false,
          createdAt: new Date(),
        },
      },
    });
  }

  res.json({ success: true, resource });
});

// @desc    Admin: update user status / role
// @route   PUT /api/admin/users/:id
const adminUpdateUser = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;
  const validRoles = ['student', 'faculty', 'placement', 'admin'];

  const update = {};
  if (role && validRoles.includes(role)) update.role = role;
  if (isActive !== undefined) update.isActive = Boolean(isActive);

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  await logAction(req, 'USER_UPDATED', 'User', user._id, `Role: ${user.role}, Active: ${user.isActive}`);
  res.json({ success: true, user });
});

module.exports = {
  getAnalytics, getUsers, getAuditLog,
  broadcastAnnouncement, reviewResource, adminUpdateUser, logAction,
};

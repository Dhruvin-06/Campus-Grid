const { Announcement, CampusPost } = require('../models/Announcement');
const asyncHandler = require('express-async-handler');

// ─── Announcements ─────────────────────────────────────────────────────────────

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private/Admin/Faculty/Placement
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, type, targetAudience, targetBranch, targetYear, expiresAt, isPinned } = req.body;

  const announcement = await Announcement.create({
    title,
    content,
    type: type || 'general',
    targetAudience: targetAudience || 'all',
    targetBranch,
    targetYear: targetYear ? parseInt(targetYear) : undefined,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    isPinned: isPinned || false,
    postedBy: req.user._id,
  });

  res.status(201).json({ success: true, announcement });
});

// @desc    Get announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = asyncHandler(async (req, res) => {
  const { type, page = 1, limit = 10 } = req.query;
  const filter = {};
  if (type) filter.type = type;

  // Filter expired announcements
  filter.$or = [{ expiresAt: { $gt: new Date() } }, { expiresAt: { $exists: false } }, { expiresAt: null }];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Announcement.countDocuments(filter);
  const announcements = await Announcement.find(filter)
    .populate('postedBy', 'name avatar role')
    .sort({ isPinned: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({ success: true, total, announcements });
});

// @desc    Delete announcement (Admin can delete any, Faculty can delete own)
// @route   DELETE /api/announcements/:id
// @access  Private/Admin/Faculty (creator)
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    return res.status(404).json({ success: false, message: 'Announcement not found' });
  }

  if (req.user.role !== 'admin' && announcement.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Forbidden: You did not create this announcement' });
  }

  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Announcement deleted' });
});

// ─── Campus Feed Posts ─────────────────────────────────────────────────────────

// @desc    Create campus feed post
// @route   POST /api/feed
// @access  Private (students/faculty — pending approval; admin — auto-published)
const createCampusPost = asyncHandler(async (req, res) => {
  const { title, content, excerpt, category, tags } = req.body;

  const post = await CampusPost.create({
    title,
    content,
    excerpt: excerpt || content.substring(0, 200),
    coverImage: req.file ? req.file.path : '',
    category: category || 'general',
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    author: req.user._id,
    status: ['admin', 'faculty'].includes(req.user.role) ? 'published' : 'pending_approval',
  });

  res.status(201).json({ success: true, post });
});

// @desc    Get campus feed posts
// @route   GET /api/feed
// @access  Private
const getCampusPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 9, search, category } = req.query;
  const filter = { status: 'published' };
  if (category) filter.category = category;
  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await CampusPost.countDocuments(filter);
  const posts = await CampusPost.find(filter)
    .populate('author', 'name avatar rollNumber branch role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({ success: true, total, posts });
});

// @desc    Like/Unlike campus post
// @route   PUT /api/feed/:id/like
// @access  Private
const likeCampusPost = asyncHandler(async (req, res) => {
  const post = await CampusPost.findById(req.params.id);
  if (!post) { res.status(404); throw new Error('Post not found'); }

  const liked = post.likes.includes(req.user._id);
  if (liked) {
    post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
  } else {
    post.likes.push(req.user._id);
  }
  await post.save();
  res.json({ success: true, liked: !liked, likes: post.likes.length });
});

// @desc    Comment on campus post
// @route   POST /api/feed/:id/comment
// @access  Private
const commentOnCampusPost = asyncHandler(async (req, res) => {
  const post = await CampusPost.findById(req.params.id);
  if (!post) { res.status(404); throw new Error('Post not found'); }

  post.comments.push({ user: req.user._id, content: req.body.content });
  await post.save();

  const updated = await CampusPost.findById(req.params.id).populate('comments.user', 'name avatar');
  res.json({ success: true, comments: updated.comments });
});

// @desc    Admin: approve campus post
// @route   PUT /api/feed/:id/approve
// @access  Private/Admin
const approveCampusPost = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'approve' | 'reject'
  const status = action === 'reject' ? 'rejected' : 'published';

  const post = await CampusPost.findByIdAndUpdate(
    req.params.id,
    { status, approvedBy: req.user._id },
    { new: true }
  );
  if (!post) { res.status(404); throw new Error('Post not found'); }
  res.json({ success: true, post });
});

// @desc    Get pending campus posts (Admin/Faculty)
// @route   GET /api/feed/pending
// @access  Private/Admin
const getPendingCampusPosts = asyncHandler(async (req, res) => {
  const posts = await CampusPost.find({ status: 'pending_approval' })
    .populate('author', 'name rollNumber avatar role')
    .sort({ createdAt: -1 });
  res.json({ success: true, posts });
});

// @desc    Delete campus post
// @route   DELETE /api/feed/:id
// @access  Private (owner or admin/faculty)
const deleteCampusPost = asyncHandler(async (req, res) => {
  const post = await CampusPost.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

  if (req.user.role !== 'admin' && post.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  await post.deleteOne();
  res.json({ success: true, message: 'Post deleted' });
});

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (Admin or creator)
const updateAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, type, isPinned } = req.body;
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({ success: false, message: 'Announcement not found' });
  }

  if (req.user.role !== 'admin' && announcement.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Forbidden: Only admin or creator can edit' });
  }

  if (title) announcement.title = title;
  if (content) announcement.content = content;
  if (type) announcement.type = type;
  if (isPinned !== undefined) announcement.isPinned = isPinned;

  await announcement.save();
  res.json({ success: true, announcement });
});

// @desc    Update campus post
// @route   PUT /api/feed/:id
// @access  Private (Admin or author)
const updateCampusPost = asyncHandler(async (req, res) => {
  const { title, content, category, tags } = req.body;
  const post = await CampusPost.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  if (req.user.role !== 'admin' && post.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Forbidden: Only admin or author can edit' });
  }

  if (title) post.title = title;
  if (content) post.content = content;
  if (category) post.category = category;
  if (tags) post.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());

  await post.save();
  res.json({ success: true, post });
});

module.exports = {
  createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement,
  createCampusPost, getCampusPosts, updateCampusPost, likeCampusPost, commentOnCampusPost,
  approveCampusPost, getPendingCampusPosts, deleteCampusPost,
};

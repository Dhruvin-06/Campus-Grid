const { Announcement, Blog } = require('../models/Announcement');
const asyncHandler = require('express-async-handler');

// ─── Announcements ─────────────────────────────────────────────────────────────

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private/Admin/Faculty
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
    postedBy: req.user.id,
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

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
const deleteAnnouncement = asyncHandler(async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Announcement deleted' });
});

// ─── Blogs ─────────────────────────────────────────────────────────────────────

// @desc    Create blog post
// @route   POST /api/blogs
// @access  Private/Student
const createBlog = asyncHandler(async (req, res) => {
  const { title, content, excerpt, tags } = req.body;

  const blog = await Blog.create({
    title,
    content,
    excerpt: excerpt || content.substring(0, 200),
    coverImage: req.file ? req.file.path : '',
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    author: req.user.id,
    status: ['admin', 'faculty'].includes(req.user.role) ? 'published' : 'pending_approval',
  });

  res.status(201).json({ success: true, blog });
});

// @desc    Get blogs
// @route   GET /api/blogs
// @access  Private
const getBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 9, search } = req.query;
  const filter = { status: 'published' };
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Blog.countDocuments(filter);
  const blogs = await Blog.find(filter)
    .populate('author', 'name avatar rollNumber branch')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({ success: true, total, blogs });
});

// @desc    Like/Unlike blog
// @route   PUT /api/blogs/:id/like
// @access  Private
const likeBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) { res.status(404); throw new Error('Blog not found'); }

  const liked = blog.likes.includes(req.user.id);
  if (liked) {
    blog.likes = blog.likes.filter((id) => id.toString() !== req.user.id);
  } else {
    blog.likes.push(req.user.id);
  }
  await blog.save();
  res.json({ success: true, liked: !liked, likes: blog.likes.length });
});

// @desc    Comment on blog
// @route   POST /api/blogs/:id/comment
// @access  Private
const commentOnBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) { res.status(404); throw new Error('Blog not found'); }

  blog.comments.push({ user: req.user.id, content: req.body.content });
  await blog.save();

  const updated = await Blog.findById(req.params.id).populate('comments.user', 'name avatar');
  res.json({ success: true, comments: updated.comments });
});

// @desc    Admin: approve blog
// @route   PUT /api/blogs/:id/approve
// @access  Private/Admin/Faculty
const approveBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(
    req.params.id,
    { status: 'published', approvedBy: req.user.id },
    { new: true }
  );
  res.json({ success: true, blog });
});

// @desc    Get pending blogs (Admin)
// @route   GET /api/blogs/pending
// @access  Private/Admin
const getPendingBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ status: 'pending_approval' }).populate('author', 'name rollNumber');
  res.json({ success: true, blogs });
});

module.exports = {
  createAnnouncement, getAnnouncements, deleteAnnouncement,
  createBlog, getBlogs, likeBlog, commentOnBlog, approveBlog, getPendingBlogs,
};

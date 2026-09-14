const LostFound = require('../models/LostFound');
const asyncHandler = require('express-async-handler');

// @desc    Post a lost/found item
// @route   POST /api/lostfound
// @access  Private
const createPost = asyncHandler(async (req, res) => {
  const { type, title, description, category, location, contactInfo } = req.body;

  const post = await LostFound.create({
    type,
    title,
    description,
    category: category || 'other',
    location,
    contactInfo,
    imageUrl: req.file ? req.file.path : '',
    imagePublicId: req.file ? req.file.filename : '',
    postedBy: req.user.id,
  });

  res.status(201).json({ success: true, post });
});

// @desc    Get all lost/found posts
// @route   GET /api/lostfound
// @access  Private
const getPosts = asyncHandler(async (req, res) => {
  const { type, category, resolved, search, page = 1, limit = 12 } = req.query;

  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (resolved !== undefined) filter.resolved = resolved === 'true';
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await LostFound.countDocuments(filter);
  const posts = await LostFound.find(filter)
    .populate('postedBy', 'name rollNumber avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({ success: true, total, posts });
});

// @desc    Mark as resolved
// @route   PUT /api/lostfound/:id/resolve
// @access  Private (owner or admin)
const resolvePost = asyncHandler(async (req, res) => {
  const post = await LostFound.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  if (post.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  post.resolved = true;
  post.resolvedAt = new Date();
  post.claimedBy = req.body.claimedById || req.user.id;
  await post.save();

  res.json({ success: true, message: 'Marked as resolved', post });
});

// @desc    Delete a post
// @route   DELETE /api/lostfound/:id
// @access  Private (owner or admin)
const deletePost = asyncHandler(async (req, res) => {
  const post = await LostFound.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  if (post.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  await post.deleteOne();
  res.json({ success: true, message: 'Post deleted' });
});

module.exports = { createPost, getPosts, resolvePost, deletePost };

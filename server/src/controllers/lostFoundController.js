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

// @desc    Reach out / claim a lost or found item
// @route   PUT /api/lostfound/:id/claim
// @access  Private
const claimPost = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const post = await LostFound.findById(req.params.id).populate('postedBy', 'name email rollNumber');

  if (!post) {
    res.status(404);
    throw new Error('Item post not found');
  }

  const User = require('../models/User');
  await User.findByIdAndUpdate(post.postedBy._id, {
    $push: {
      notifications: {
        message: `📢 ${req.user.name} (${req.user.rollNumber}) reached out regarding your ${post.type} item "${post.title}": "${message || 'I have information regarding this item.'}"`,
        type: 'info',
        read: false,
        createdAt: new Date(),
      },
    },
  });

  res.json({
    success: true,
    message: 'Owner/finder has been notified!',
    contactInfo: post.contactInfo || post.postedBy.email || 'Direct Messaging Available',
    poster: post.postedBy,
  });
});

module.exports = { createPost, getPosts, resolvePost, deletePost, claimPost };

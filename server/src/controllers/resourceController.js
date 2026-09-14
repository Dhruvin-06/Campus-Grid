const Resource = require('../models/Resource');
const asyncHandler = require('express-async-handler');

// @desc    Upload a new resource
// @route   POST /api/resources
// @access  Private
const uploadResource = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  const { title, description, subject, branch, year, type, tags } = req.body;

  const resource = await Resource.create({
    title,
    description,
    subject,
    branch,
    year: year ? parseInt(year) : undefined,
    type: type || 'notes',
    fileUrl: req.file.path, // Cloudinary URL
    filePublicId: req.file.filename,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    uploadedBy: req.user.id,
    // Admin/faculty uploads auto-approved; student uploads need approval
    approved: ['admin', 'faculty'].includes(req.user.role),
  });

  res.status(201).json({ success: true, resource });
});

// @desc    Get all resources with filtering
// @route   GET /api/resources
// @access  Private
const getResources = asyncHandler(async (req, res) => {
  const { subject, branch, year, type, search, page = 1, limit = 12 } = req.query;

  const filter = { approved: true };
  if (subject) filter.subject = { $regex: subject, $options: 'i' };
  if (branch && branch !== 'All') filter.branch = branch;
  if (year) filter.year = parseInt(year);
  if (type) filter.type = type;
  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Resource.countDocuments(filter);
  const resources = await Resource.find(filter)
    .populate('uploadedBy', 'name rollNumber avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    resources,
  });
});

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
const getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id).populate(
    'uploadedBy',
    'name rollNumber avatar branch'
  );

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // Increment views
  resource.views += 1;
  await resource.save();

  res.json({ success: true, resource });
});

// @desc    Increment download count
// @route   PUT /api/resources/:id/download
// @access  Private
const trackDownload = asyncHandler(async (req, res) => {
  const resource = await Resource.findByIdAndUpdate(
    req.params.id,
    { $inc: { downloads: 1 } },
    { new: true }
  );

  res.json({ success: true, downloads: resource.downloads });
});

// @desc    Like/Unlike resource
// @route   PUT /api/resources/:id/like
// @access  Private
const likeResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  const alreadyLiked = resource.likes.includes(req.user.id);

  if (alreadyLiked) {
    resource.likes = resource.likes.filter((id) => id.toString() !== req.user.id);
  } else {
    resource.likes.push(req.user.id);
  }

  await resource.save();
  res.json({ success: true, likes: resource.likes.length, liked: !alreadyLiked });
});

// @desc    Admin: approve resource
// @route   PUT /api/resources/:id/approve
// @access  Private/Admin
const approveResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findByIdAndUpdate(
    req.params.id,
    { approved: true, approvedBy: req.user.id },
    { new: true }
  );

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  res.json({ success: true, message: 'Resource approved', resource });
});

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (owner or admin)
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // Only owner or admin can delete
  if (resource.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this resource');
  }

  await resource.deleteOne();
  res.json({ success: true, message: 'Resource deleted' });
});

// @desc    Get pending resources (Admin)
// @route   GET /api/resources/pending
// @access  Private/Admin
const getPendingResources = asyncHandler(async (req, res) => {
  const resources = await Resource.find({ approved: false })
    .populate('uploadedBy', 'name rollNumber branch')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: resources.length, resources });
});

module.exports = {
  uploadResource,
  getResources,
  getResourceById,
  trackDownload,
  likeResource,
  approveResource,
  deleteResource,
  getPendingResources,
};

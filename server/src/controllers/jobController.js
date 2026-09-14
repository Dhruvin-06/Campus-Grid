const Job = require('../models/Job');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Create job/placement listing
// @route   POST /api/jobs
// @access  Private/Admin/PlacementCell
const createJob = asyncHandler(async (req, res) => {
  const {
    title, company, type, description, eligibility,
    package: pkg, stipend, location, deadline, applyLink, tags,
  } = req.body;

  const job = await Job.create({
    title,
    company,
    type,
    description,
    eligibility: eligibility || {},
    package: pkg,
    stipend,
    location,
    deadline: deadline ? new Date(deadline) : undefined,
    applyLink,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    postedBy: req.user.id,
  });

  res.status(201).json({ success: true, job });
});

// @desc    Get all jobs with filtering
// @route   GET /api/jobs
// @access  Private
const getJobs = asyncHandler(async (req, res) => {
  const { type, branch, search, page = 1, limit = 12 } = req.query;

  const filter = { isActive: true };
  if (type) filter.type = type;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Job.countDocuments(filter);
  const jobs = await Job.find(filter)
    .populate('postedBy', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    jobs,
  });
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('postedBy', 'name avatar');

  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  job.views += 1;
  await job.save();

  res.json({ success: true, job });
});

// @desc    Bookmark/Unbookmark job
// @route   PUT /api/jobs/:id/bookmark
// @access  Private
const bookmarkJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  const alreadyBookmarked = job.bookmarks.includes(req.user.id);

  if (alreadyBookmarked) {
    job.bookmarks = job.bookmarks.filter((id) => id.toString() !== req.user.id);
    await User.findByIdAndUpdate(req.user.id, { $pull: { bookmarkedJobs: job._id } });
  } else {
    job.bookmarks.push(req.user.id);
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { bookmarkedJobs: job._id } });
  }

  await job.save();
  res.json({ success: true, bookmarked: !alreadyBookmarked, totalBookmarks: job.bookmarks.length });
});

// @desc    Get bookmarked jobs for current user
// @route   GET /api/jobs/bookmarks
// @access  Private
const getBookmarkedJobs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: 'bookmarkedJobs',
    populate: { path: 'postedBy', select: 'name avatar' },
  });

  res.json({ success: true, jobs: user.bookmarkedJobs });
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private/Admin/PlacementCell
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  res.json({ success: true, job });
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private/Admin/PlacementCell
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndDelete(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  res.json({ success: true, message: 'Job deleted' });
});

module.exports = { createJob, getJobs, getJobById, bookmarkJob, getBookmarkedJobs, updateJob, deleteJob };

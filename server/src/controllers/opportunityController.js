const Opportunity = require('../models/Opportunity');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// ─── Helper: Check if student is eligible ─────────────────────────────────────
const isEligible = (opportunity, student) => {
  if (!opportunity.branch.includes('All') && !opportunity.branch.includes(student.branch)) return false;
  if (opportunity.graduationYear && student.year && (4 - student.year + new Date().getFullYear()) !== opportunity.graduationYear) {
    // rough check — allow if not mismatched
  }
  return true;
};

// @desc    Get all published opportunities (with filters)
// @route   GET /api/opportunities
// @access  Private
const getOpportunities = asyncHandler(async (req, res) => {
  const { type, branch, search, saved, page = 1, limit = 12 } = req.query;

  const filter = { isPublished: true, isActive: true };
  if (type && type !== 'all') filter.type = type;
  if (branch && branch !== 'All') filter.branch = { $in: [branch, 'All'] };
  if (search) filter.$text = { $search: search };

  // Show only saved (bookmarked) opportunities for this user
  if (saved === 'true') {
    filter.saves = req.user._id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Opportunity.countDocuments(filter);
  const opportunities = await Opportunity.find(filter)
    .populate('postedBy', 'name avatar role')
    .populate('verifiedBy', 'name avatar')
    .sort({ isVerified: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Add isSaved flag for each opportunity
  const enriched = opportunities.map((opp) => ({
    ...opp.toObject(),
    isSaved: opp.saves.some((id) => id.toString() === req.user._id.toString()),
  }));

  res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), opportunities: enriched });
});

// @desc    Get single opportunity
// @route   GET /api/opportunities/:id
// @access  Private
const getOpportunityById = asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id)
    .populate('postedBy', 'name avatar role rollNumber')
    .populate('verifiedBy', 'name avatar');

  if (!opp) { res.status(404); throw new Error('Opportunity not found'); }

  // Increment views
  opp.views += 1;
  await opp.save();

  res.json({ success: true, opportunity: opp });
});

// @desc    Create opportunity
// @route   POST /api/opportunities
// @access  Private/Placement/Admin
const createOpportunity = asyncHandler(async (req, res) => {
  const {
    title, company, description, type, skills, eligibility,
    branch, graduationYear, minCGPA, location, packageOrStipend,
    deadline, applicationLink,
  } = req.body;

  const opportunity = await Opportunity.create({
    title,
    company,
    description,
    type,
    skills: skills ? (Array.isArray(skills) ? skills : skills.split(',').map((s) => s.trim())) : [],
    eligibility: eligibility || '',
    branch: branch ? (Array.isArray(branch) ? branch : branch.split(',').map((b) => b.trim())) : ['All'],
    graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
    minCGPA: minCGPA ? parseFloat(minCGPA) : 0,
    location: location || 'TBD',
    packageOrStipend: packageOrStipend || '',
    deadline: deadline ? new Date(deadline) : undefined,
    applicationLink: applicationLink || '',
    postedBy: req.user._id,
    // Admin-created opportunities auto-verified; placement cell needs admin verify
    isVerified: req.user.role === 'admin',
    isPublished: req.user.role === 'admin',
  });

  res.status(201).json({ success: true, opportunity });
});

// @desc    Update opportunity
// @route   PUT /api/opportunities/:id
// @desc    Update opportunity
// @route   PUT /api/opportunities/:id
// @access  Private/Placement/Admin
const updateOpportunity = asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id);
  if (!opp) { res.status(404); throw new Error('Opportunity not found'); }

  // Only admin or the original poster (placement cell) can edit
  const ownerId = opp.postedBy?.toString();
  const userId = (req.user._id || req.user.id)?.toString();
  if (req.user.role !== 'admin' && ownerId !== userId) {
    return res.status(403).json({ success: false, message: 'Forbidden: You do not own this opportunity' });
  }

  const updated = await Opportunity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, opportunity: updated });
});

// @desc    Verify opportunity (Admin only)
// @route   PUT /api/opportunities/:id/verify
// @access  Private/Admin
const verifyOpportunity = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'verify' | 'reject'
  const update = action === 'reject'
    ? { isVerified: false, isPublished: false }
    : { isVerified: true, isPublished: true, verifiedBy: req.user._id };

  const opp = await Opportunity.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!opp) { res.status(404); throw new Error('Opportunity not found'); }
  res.json({ success: true, opportunity: opp });
});

// @desc    Delete opportunity
// @route   DELETE /api/opportunities/:id
// @access  Private/Placement/Admin
const deleteOpportunity = asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id);
  if (!opp) { res.status(404); throw new Error('Opportunity not found'); }

  const ownerId = opp.postedBy?.toString();
  const userId = (req.user._id || req.user.id)?.toString();
  if (req.user.role !== 'admin' && ownerId !== userId) {
    return res.status(403).json({ success: false, message: 'Forbidden: You do not own this opportunity' });
  }

  await opp.deleteOne();
  res.json({ success: true, message: 'Opportunity deleted' });
});


// @desc    Save / unsave opportunity (bookmark)
// @route   PUT /api/opportunities/:id/save
// @access  Private
const saveOpportunity = asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id);
  if (!opp) { res.status(404); throw new Error('Opportunity not found'); }

  const alreadySaved = opp.saves.some((id) => id.toString() === req.user._id.toString());
  if (alreadySaved) {
    opp.saves = opp.saves.filter((id) => id.toString() !== req.user._id.toString());
  } else {
    opp.saves.push(req.user._id);
  }
  await opp.save();
  res.json({ success: true, saved: !alreadySaved, totalSaves: opp.saves.length });
});

// @desc    Get all opportunities for admin review (including unpublished)
// @route   GET /api/opportunities/admin/all
// @access  Private/Admin/Placement
const getAllOpportunitiesAdmin = asyncHandler(async (req, res) => {
  const { type, verified, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (type && type !== 'all') filter.type = type;
  if (verified === 'false') filter.isVerified = false;
  if (verified === 'true') filter.isVerified = true;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Opportunity.countDocuments(filter);
  const opportunities = await Opportunity.find(filter)
    .populate('postedBy', 'name avatar role rollNumber')
    .populate('verifiedBy', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({ success: true, total, opportunities });
});

module.exports = {
  getOpportunities, getOpportunityById, createOpportunity, updateOpportunity,
  verifyOpportunity, deleteOpportunity, saveOpportunity, getAllOpportunitiesAdmin,
};

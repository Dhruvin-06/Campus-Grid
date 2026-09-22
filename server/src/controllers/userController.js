const User = require('../models/User');
const Resource = require('../models/Resource');
const LostFound = require('../models/LostFound');
const Opportunity = require('../models/Opportunity');
const asyncHandler = require('express-async-handler');

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, branch, year, page = 1, limit = 20, search } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (branch) filter.branch = branch;
  if (year) filter.year = parseInt(year);
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    users,
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('connections', 'name avatar rollNumber branch year skills');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({ success: true, user });
});

// @desc    Peer match — get students with similar skills and interests
// @route   GET /api/users/peer-match
// @access  Private
const getPeerMatches = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user.id);

  const hasProfile = (currentUser.skills?.length || currentUser.technicalInterests?.length || currentUser.interests?.length);

  if (!hasProfile) {
    return res.json({
      success: true,
      message: 'Add skills and interests to your profile to find peer matches',
      matches: [],
    });
  }

  const mySkills = currentUser.skills || [];
  const myTechInterests = currentUser.technicalInterests || [];
  const myProjectInterests = currentUser.projectInterests || [];
  const myInterests = currentUser.interests || [];
  const connectedIds = (currentUser.connections || []).map((id) => id.toString());

  // Fetch all active students except self
  const candidates = await User.find({
    _id: { $ne: currentUser._id },
    role: 'student',
    isActive: true,
  }).select('name avatar rollNumber branch year skills interests technicalInterests projectInterests collaborationPrefs connections bio');

  // Score each candidate
  const scored = candidates
    .map((candidate) => {
      const cSkills = candidate.skills || [];
      const cTech = candidate.technicalInterests || [];
      const cProject = candidate.projectInterests || [];
      const cInterests = candidate.interests || [];

      // Intersection counts
      const sharedSkills = mySkills.filter((s) => cSkills.map((x) => x.toLowerCase()).includes(s.toLowerCase()));
      const sharedTech = myTechInterests.filter((s) => cTech.map((x) => x.toLowerCase()).includes(s.toLowerCase()));
      const sharedProject = myProjectInterests.filter((s) => cProject.map((x) => x.toLowerCase()).includes(s.toLowerCase()));
      const sharedInterests = myInterests.filter((s) => cInterests.map((x) => x.toLowerCase()).includes(s.toLowerCase()));

      const sameBranch = currentUser.branch === candidate.branch ? 1 : 0;
      const sameYear = currentUser.year === candidate.year ? 1 : 0;

      // Weighted scoring: skills 40pts max, tech interests 25pts, project 20pts, interests 10pts, branch 3pts, year 2pts
      const maxSkills = Math.max(mySkills.length, cSkills.length, 1);
      const maxTech = Math.max(myTechInterests.length, cTech.length, 1);
      const maxProject = Math.max(myProjectInterests.length, cProject.length, 1);
      const maxInterests = Math.max(myInterests.length, cInterests.length, 1);

      const score = Math.round(
        (sharedSkills.length / maxSkills) * 40 +
        (sharedTech.length / maxTech) * 25 +
        (sharedProject.length / maxProject) * 20 +
        (sharedInterests.length / maxInterests) * 10 +
        sameBranch * 3 +
        sameYear * 2
      );

      return {
        _id: candidate._id,
        name: candidate.name,
        avatar: candidate.avatar,
        rollNumber: candidate.rollNumber,
        branch: candidate.branch,
        year: candidate.year,
        skills: cSkills,
        technicalInterests: cTech,
        projectInterests: cProject,
        collaborationPrefs: candidate.collaborationPrefs,
        bio: candidate.bio,
        compatibilityScore: Math.min(score, 100),
        matchedOn: {
          skills: sharedSkills,
          technicalInterests: sharedTech,
          projectInterests: sharedProject,
          interests: sharedInterests,
          sameBranch: !!sameBranch,
          sameYear: !!sameYear,
        },
        isConnected: connectedIds.includes(candidate._id.toString()),
        hasPendingRequest: (candidate.connectionRequests || []).map((id) => id.toString()).includes(req.user.id),
      };
    })
    .filter((c) => c.compatibilityScore > 0) // must have at least something in common
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 30);

  res.json({ success: true, matches: scored });
});

// @desc    Send connection request
// @route   POST /api/users/:id/connect
// @access  Private
const sendConnectionRequest = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  if (targetUser._id.toString() === req.user.id) {
    res.status(400);
    throw new Error('Cannot connect with yourself');
  }

  if (targetUser.connections.includes(req.user.id)) {
    res.status(400);
    throw new Error('Already connected');
  }

  if (targetUser.connectionRequests.includes(req.user.id)) {
    res.status(400);
    throw new Error('Connection request already sent');
  }

  await User.findByIdAndUpdate(req.params.id, {
    $push: { connectionRequests: req.user.id },
  });

  res.json({ success: true, message: 'Connection request sent' });
});

// @desc    Accept connection request
// @route   PUT /api/users/:id/connect/accept
// @access  Private
const acceptConnection = asyncHandler(async (req, res) => {
  const requesterId = req.params.id;

  // Add to each other's connections, remove from requests
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { connectionRequests: requesterId },
    $addToSet: { connections: requesterId },
  });

  await User.findByIdAndUpdate(requesterId, {
    $addToSet: { connections: req.user.id },
  });

  res.json({ success: true, message: 'Connection accepted' });
});

// @desc    Reject / remove connection
// @route   DELETE /api/users/:id/connect
// @access  Private
const removeConnection = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { connectionRequests: req.params.id, connections: req.params.id },
  });

  await User.findByIdAndUpdate(req.params.id, {
    $pull: { connections: req.user.id },
  });

  res.json({ success: true, message: 'Connection removed' });
});

// @desc    Admin: toggle user active status (ban/unban)
// @route   PUT /api/users/:id/toggle-active
// @access  Private/Admin
const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    isActive: user.isActive,
  });
});

// @desc    Admin: change user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const changeUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ['student', 'faculty', 'placement', 'admin'];

  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error('Invalid role');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role, isVerified: true },
    { new: true }
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({ success: true, message: `User role updated to ${role}`, user });
});

// @desc    Upload/update avatar
// @route   PUT /api/users/avatar
// @access  Private
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: req.file.path }, // Cloudinary URL stored in req.file.path
    { new: true }
  );

  res.json({ success: true, avatar: user.avatar });
});

// @desc    Get public overview stats for dashboard (tailored securely per role on server)
// @route   GET /api/users/stats
// @access  Private
const getOverviewStats = asyncHandler(async (req, res) => {
  const { Announcement, CampusPost } = require('../models/Announcement');

  const [
    totalStudents,
    totalFaculty,
    totalPlacement,
    totalResources,
    pendingResources,
    totalLostFound,
    totalOpportunities,
    pendingPosts,
    mySavedOpps,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'faculty' }),
    User.countDocuments({ role: 'placement' }),
    Resource.countDocuments({ approved: true }),
    Resource.countDocuments({ approved: false }),
    LostFound.countDocuments({ resolved: false }),
    Opportunity.countDocuments({ isPublished: true, isActive: true }),
    CampusPost.countDocuments({ status: 'pending_approval' }),
    Opportunity.countDocuments({ saves: req.user._id }),
  ]);

  res.json({
    success: true,
    stats: {
      role: req.user.role,
      totalStudents,
      totalFaculty,
      totalPlacement,
      totalResources,
      pendingResources,
      totalLostFound,
      totalOpportunities,
      pendingPosts,
      mySavedOpps,
    },
  });
});


module.exports = {
  getAllUsers,
  getUserById,
  getPeerMatches,
  sendConnectionRequest,
  acceptConnection,
  removeConnection,
  toggleUserActive,
  changeUserRole,
  updateAvatar,
  getOverviewStats,
};

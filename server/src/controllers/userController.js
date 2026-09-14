const User = require('../models/User');
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

// @desc    Peer match — get students with similar skills
// @route   GET /api/users/peer-match
// @access  Private
const getPeerMatches = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user.id);

  if (!currentUser.skills || currentUser.skills.length === 0) {
    return res.json({
      success: true,
      message: 'Add skills to your profile to find peer matches',
      matches: [],
    });
  }

  // Find users who share at least one skill, excluding self and already-connected
  const matches = await User.aggregate([
    {
      $match: {
        _id: { $ne: currentUser._id },
        role: 'student',
        isActive: true,
        skills: { $in: currentUser.skills },
      },
    },
    {
      $addFields: {
        commonSkills: {
          $size: {
            $ifNull: [{ $setIntersection: ['$skills', currentUser.skills] }, []],
          },
        },
      },
    },
    { $sort: { commonSkills: -1 } },
    { $limit: 20 },
    {
      $project: {
        password: 0,
      },
    },
  ]);

  res.json({ success: true, matches });
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
  const validRoles = ['student', 'faculty', 'admin', 'placement_cell'];

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
};

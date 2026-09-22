const User = require('../models/User');
const { sendTokenResponse } = require('../utils/tokenUtils');
const asyncHandler = require('express-async-handler');
const { OAuth2Client } = require('google-auth-library');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, rollNumber, password, branch, year } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { rollNumber }] });
  if (existingUser) {
    res.status(400);
    throw new Error(
      existingUser.email === email ? 'Email already registered' : 'Roll number already registered'
    );
  }

  // 🔴 SECURITY: Public registration ALWAYS creates a student.
  // Role escalation is only possible via admin action: PUT /api/users/:id/role
  const user = await User.create({
    name,
    email,
    rollNumber,
    password,
    role: 'student',
    branch,
    year,
    isVerified: true,
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Get user with password
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated. Contact admin.');
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('connections', 'name avatar rollNumber branch');
  res.json({ success: true, user });
});

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, skills, interests, technicalInterests, projectInterests, collaborationPrefs, linkedIn, github, year, branch } = req.body;

  const updatedFields = {};
  if (name) updatedFields.name = name;
  if (bio !== undefined) updatedFields.bio = bio;
  if (skills) updatedFields.skills = skills;
  if (interests) updatedFields.interests = interests;
  if (technicalInterests) updatedFields.technicalInterests = technicalInterests;
  if (projectInterests) updatedFields.projectInterests = projectInterests;
  if (collaborationPrefs !== undefined) updatedFields.collaborationPrefs = collaborationPrefs;
  if (linkedIn !== undefined) updatedFields.linkedIn = linkedIn;
  if (github !== undefined) updatedFields.github = github;
  if (year) updatedFields.year = year;
  if (branch) updatedFields.branch = branch;

  const user = await User.findByIdAndUpdate(req.user.id, updatedFields, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, user });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Logout (clear cookie)
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Google OAuth Sign-In / Sign-Up (Step 1)
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400);
    throw new Error('Google ID token is required');
  }

  // Verify the Google ID token
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    res.status(401);
    throw new Error('Invalid Google token');
  }

  const { sub: googleId, email, name, given_name, family_name, picture } = payload;
  const displayName = name
    || `${given_name || ''} ${family_name || ''}`.trim()
    || email.split('@')[0];

  // Find existing user by googleId or email
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    // Existing user — link googleId if not already linked
    if (!user.googleId) {
      user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error('Your account has been deactivated. Contact admin.');
    }

    return sendTokenResponse(user, 200, res);
  }

  // NEW user — issue a short-lived setup token (10 min) and ask for profile info
  const jwt = require('jsonwebtoken');
  const setupToken = jwt.sign(
    { googleId, email, picture: picture || '' },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  res.json({
    success: true,
    needsProfile: true,
    setupToken,
    prefill: { name: displayName, email },
  });
});

// @desc    Complete Google profile (Step 2 — new users only)
// @route   POST /api/auth/google/complete
// @access  Public
const googleComplete = asyncHandler(async (req, res) => {
  const { setupToken, name, rollNumber, branch, year } = req.body;

  if (!setupToken || !name || !rollNumber || !branch) {
    res.status(400);
    throw new Error('Missing required profile fields');
  }

  // Verify the setup token
  let decoded;
  try {
    const jwt = require('jsonwebtoken');
    decoded = jwt.verify(setupToken, process.env.JWT_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error('Setup session expired. Please sign in with Google again.');
  }

  const { googleId, email, picture } = decoded;

  // Ensure not already registered (race condition guard)
  const existing = await User.findOne({ $or: [{ googleId }, { email }] });
  if (existing) {
    return sendTokenResponse(existing, 200, res);
  }

  // Check roll number uniqueness
  const rollExists = await User.findOne({ rollNumber: rollNumber.toUpperCase() });
  if (rollExists) {
    res.status(400);
    throw new Error('Roll number already registered. Use a different one.');
  }

  // Create the user with full profile
  const user = await User.create({
    name,
    email,
    googleId,
    avatar: picture || '',
    rollNumber: rollNumber.toUpperCase(),
    role: 'student',
    branch,
    year: year ? Number(year) : undefined,
    isVerified: true,
    isActive: true,
  });

  sendTokenResponse(user, 201, res);
});

module.exports = { register, login, getMe, updateProfile, changePassword, logout, googleAuth, googleComplete };


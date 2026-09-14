const jwt = require('jsonwebtoken');

/**
 * Generate a JWT access token (short-lived: 7d)
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Send token response with cookie
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  // Don't send password in response
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    rollNumber: user.rollNumber,
    role: user.role,
    branch: user.branch,
    year: user.year,
    avatar: user.avatar,
    bio: user.bio,
    skills: user.skills,
    interests: user.interests,
    isVerified: user.isVerified,
    linkedin: user.linkedIn,
    github: user.github,
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    token,
    user: userData,
  });
};

module.exports = { generateToken, sendTokenResponse };

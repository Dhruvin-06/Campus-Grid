const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - verifies JWT token and attaches user to req
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
};

/**
 * Restrict access to specific roles
 * Usage: authorize('admin', 'faculty')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

/**
 * Admin-only shortcut
 */
const adminOnly = authorize('admin');

/**
 * Faculty or Admin shortcut
 */
const staffOnly = authorize('faculty', 'admin');

/**
 * Placement Cell or Admin shortcut
 */
const placementOrAdmin = authorize('placement', 'admin');

/**
 * Placement Cell only (plus admin)
 */
const placementOnly = authorize('placement', 'admin');

/**
 * Faculty, Placement, or Admin shortcut
 */
const staffAndPlacement = authorize('faculty', 'placement', 'admin');

/**
 * Generic Ownership Middleware Factory for IDOR protection
 * Usage: requireOwnership(Model, 'id', 'user')
 */
const requireOwnership = (Model, idParam = 'id', ownerField = 'user', allowAdmin = true) => {
  return async (req, res, next) => {
    try {
      if (allowAdmin && req.user.role === 'admin') {
        return next(); // Admin override
      }

      const resource = await Model.findById(req.params[idParam]);
      if (!resource) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
      }

      const ownerId = resource[ownerField]?.toString() || resource[ownerField];
      if (ownerId !== req.user._id.toString() && ownerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not own this resource',
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper to check ownership or admin role in controller logic
 */
const isOwnerOrAdmin = (req, ownerId) => {
  if (req.user.role === 'admin') return true;
  if (!ownerId) return false;
  return ownerId.toString() === req.user._id.toString();
};

module.exports = {
  protect,
  authorize,
  adminOnly,
  staffOnly,
  placementOnly,
  placementOrAdmin,
  staffAndPlacement,
  requireOwnership,
  isOwnerOrAdmin,
};


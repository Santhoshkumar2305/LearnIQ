const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

/**
 * Middleware to protect routes and verify JWT tokens
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check if token is sent in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Not authorized, no token provided', 401);
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find user and attach to request object
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return sendError(res, 'The user belonging to this token no longer exists', 401);
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Not authorized, invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Not authorized, token expired', 401);
    }
    next(error);
  }
};

/**
 * Middleware to restrict route access to specific roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo
};

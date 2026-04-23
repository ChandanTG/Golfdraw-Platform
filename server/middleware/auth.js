const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protect routes - verify JWT
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new ErrorResponse('User no longer exists', 401));
    }

    if (!user.isActive) {
      return next(new ErrorResponse('Account has been deactivated', 403));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`Role '${req.user.role}' is not authorized for this action`, 403));
    }
    next();
  };
};

// Subscription check middleware
exports.requireSubscription = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user || user.subscription.status !== 'active') {
    return next(new ErrorResponse('An active subscription is required to access this feature', 403));
  }

  // Check if subscription hasn't expired
  if (user.subscription.currentPeriodEnd && new Date(user.subscription.currentPeriodEnd) < new Date()) {
    user.subscription.status = 'expired';
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Your subscription has expired. Please renew to continue.', 403));
  }

  next();
});

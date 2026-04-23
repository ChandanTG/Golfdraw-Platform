const crypto = require('crypto');
const User = require('../models/User');
const Charity = require('../models/Charity');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');

// Helper to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
      selectedCharity: user.selectedCharity,
      charityContributionPercent: user.charityContributionPercent,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, charityId, charityPercent } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already registered', 400));
  }

  // Validate charity if provided
  if (charityId) {
    const charity = await Charity.findById(charityId);
    if (!charity || !charity.isActive) {
      return next(new ErrorResponse('Invalid charity selected', 400));
    }
  }

  const user = await User.create({
    name,
    email,
    password,
    selectedCharity: charityId || null,
    charityContributionPercent: charityPercent || 10
  });

  // Update charity subscriber count
  if (charityId) {
    await Charity.findByIdAndUpdate(charityId, { $inc: { subscriberCount: 1 } });
  }

  // Generate verification token
  const verifyToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Welcome to Golf Draw - Verify Your Email',
      template: 'emailVerification',
      data: { name: user.name, verifyUrl }
    });
  } catch (err) {
    console.error('Email send failed:', err);
    // Don't fail registration if email fails
  }

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  if (!user.isActive) {
    return next(new ErrorResponse('Account has been deactivated. Please contact support.', 403));
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('selectedCharity', 'name logo slug category');

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    // Don't reveal if user exists or not
    return res.status(200).json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Golf Draw - Password Reset Request',
      template: 'resetPassword',
      data: { name: user.name, resetUrl }
    });

    res.status(200).json({ success: true, message: 'Password reset email sent' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired reset token', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired verification token', 400));
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Email verified successfully' });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Update user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = ['name', 'phone'];
  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true
  }).populate('selectedCharity', 'name logo slug');

  res.status(200).json({ success: true, data: user });
});

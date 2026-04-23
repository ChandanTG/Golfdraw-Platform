const Charity = require('../models/Charity');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');

// @desc    Get all charities
// @route   GET /api/charities
// @access  Public
exports.getCharities = asyncHandler(async (req, res, next) => {
  const query = { isActive: true };
  if (req.query.category) query.category = req.query.category;

  const charities = await Charity.find(query)
    .sort({ featuredOrder: -1, subscriberCount: -1 })
    .select('-events');

  res.status(200).json({ success: true, count: charities.length, data: charities });
});

// @desc    Get single charity
// @route   GET /api/charities/:id
// @access  Public
exports.getCharity = asyncHandler(async (req, res, next) => {
  const charity = await Charity.findOne({
    $or: [{ _id: req.params.id }, { slug: req.params.id }],
    isActive: true
  });

  if (!charity) return next(new ErrorResponse('Charity not found', 404));

  res.status(200).json({ success: true, data: charity });
});

// @desc    Create charity (admin)
// @route   POST /api/charities
// @access  Admin
exports.createCharity = asyncHandler(async (req, res, next) => {
  const charity = await Charity.create(req.body);
  res.status(201).json({ success: true, data: charity });
});

// @desc    Update charity (admin)
// @route   PUT /api/charities/:id
// @access  Admin
exports.updateCharity = asyncHandler(async (req, res, next) => {
  const charity = await Charity.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!charity) return next(new ErrorResponse('Charity not found', 404));

  res.status(200).json({ success: true, data: charity });
});

// @desc    Delete charity (admin)
// @route   DELETE /api/charities/:id
// @access  Admin
exports.deleteCharity = asyncHandler(async (req, res, next) => {
  const charity = await Charity.findById(req.params.id);
  if (!charity) return next(new ErrorResponse('Charity not found', 404));

  // Check if any users have this charity selected
  const userCount = await User.countDocuments({ selectedCharity: req.params.id });
  if (userCount > 0) {
    // Soft delete - just deactivate
    charity.isActive = false;
    await charity.save();
    return res.status(200).json({
      success: true,
      message: `Charity deactivated. ${userCount} users had selected this charity.`
    });
  }

  await Charity.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, data: {} });
});

// @desc    Select charity for user
// @route   PUT /api/charities/select
// @access  Private
exports.selectCharity = asyncHandler(async (req, res, next) => {
  const { charityId, contributionPercent } = req.body;

  const charity = await Charity.findById(charityId);
  if (!charity || !charity.isActive) {
    return next(new ErrorResponse('Charity not found or inactive', 404));
  }

  if (contributionPercent !== undefined && (contributionPercent < 10 || contributionPercent > 100)) {
    return next(new ErrorResponse('Contribution percentage must be between 10 and 100', 400));
  }

  const user = await User.findById(req.user.id);

  // Update old charity subscriber count
  if (user.selectedCharity && user.selectedCharity.toString() !== charityId) {
    await Charity.findByIdAndUpdate(user.selectedCharity, { $inc: { subscriberCount: -1 } });
    await Charity.findByIdAndUpdate(charityId, { $inc: { subscriberCount: 1 } });
  } else if (!user.selectedCharity) {
    await Charity.findByIdAndUpdate(charityId, { $inc: { subscriberCount: 1 } });
  }

  user.selectedCharity = charityId;
  if (contributionPercent !== undefined) {
    user.charityContributionPercent = contributionPercent;
  }
  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.user.id).populate('selectedCharity', 'name logo slug category');

  res.status(200).json({ success: true, data: updatedUser });
});

// @desc    Get charity stats (admin)
// @route   GET /api/charities/stats
// @access  Admin
exports.getCharityStats = asyncHandler(async (req, res, next) => {
  const stats = await Charity.aggregate([
    { $match: { isActive: true } },
    {
      $project: {
        name: 1,
        category: 1,
        subscriberCount: 1,
        totalContributions: 1
      }
    },
    { $sort: { subscriberCount: -1 } }
  ]);

  res.status(200).json({ success: true, data: stats });
});

// @desc    Add charity event (admin)
// @route   POST /api/charities/:id/events
// @access  Admin
exports.addCharityEvent = asyncHandler(async (req, res, next) => {
  const charity = await Charity.findByIdAndUpdate(
    req.params.id,
    { $push: { events: req.body } },
    { new: true, runValidators: true }
  );

  if (!charity) return next(new ErrorResponse('Charity not found', 404));

  res.status(201).json({ success: true, data: charity });
});

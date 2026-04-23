const User = require('../models/User');
const Score = require('../models/Score');
const Draw = require('../models/Draw');
const Winner = require('../models/Winner');
const Transaction = require('../models/Transaction');
const Charity = require('../models/Charity');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const [
    totalUsers,
    activeSubscribers,
    pendingWinners,
    totalCharities,
    recentTransactions
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ 'subscription.status': 'active' }),
    Winner.countDocuments({ verificationStatus: 'pending' }),
    Charity.countDocuments({ isActive: true }),
    Transaction.find({ type: 'subscription', status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(30)
  ]);

  // Calculate monthly revenue (sum of last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const revenueResult = await Transaction.aggregate([
    {
      $match: {
        type: 'subscription',
        status: 'completed',
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const monthlyRevenue = revenueResult[0]?.total || 0;

  // Prize pool estimate (70% of monthly revenue)
  const prizePool = monthlyRevenue * 0.7;

  // Charity contributions (10% of monthly revenue minimum)
  const charityContributions = monthlyRevenue * 0.1;

  // Subscription breakdown
  const subBreakdown = await User.aggregate([
    { $match: { role: 'user' } },
    {
      $group: {
        _id: '$subscription.status',
        count: { $sum: 1 }
      }
    }
  ]);

  // New users last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newUsersWeek = await User.countDocuments({
    role: 'user',
    createdAt: { $gte: sevenDaysAgo }
  });

  // Active draws
  const activeDraw = await Draw.findOne({
    status: { $in: ['scheduled', 'executed'] },
    isSimulation: false
  });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeSubscribers,
      pendingWinners,
      totalCharities,
      monthlyRevenue,
      prizePool,
      charityContributions,
      newUsersWeek,
      subscriptionBreakdown: subBreakdown,
      activeDraw
    }
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  const { search, status, role, page = 1, limit = 20 } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  if (status) query['subscription.status'] = status;
  if (role) query.role = role;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await User.countDocuments(query);

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('selectedCharity', 'name');

  res.status(200).json({
    success: true,
    total,
    pagination: { page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    data: users
  });
});

// @desc    Get single user (admin)
// @route   GET /api/admin/users/:id
// @access  Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate('selectedCharity', 'name logo');

  if (!user) return next(new ErrorResponse('User not found', 404));

  const scores = await Score.find({ user: user._id }).sort({ date: -1 });
  const winnings = await Winner.find({ user: user._id })
    .populate('draw', 'month year drawDate');

  res.status(200).json({
    success: true,
    data: { user, scores, winnings }
  });
});

// @desc    Update user (admin)
// @route   PUT /api/admin/users/:id
// @access  Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const allowedFields = ['name', 'email', 'role', 'isActive', 'charityContributionPercent'];
  const updateData = {};
  allowedFields.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true, runValidators: true
  });

  if (!user) return next(new ErrorResponse('User not found', 404));

  res.status(200).json({ success: true, data: user });
});

// @desc    Manually override subscription status (admin)
// @route   PUT /api/admin/users/:id/subscription
// @access  Admin
exports.updateUserSubscription = asyncHandler(async (req, res, next) => {
  const { status, plan, currentPeriodEnd } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));

  if (status) user.subscription.status = status;
  if (plan) user.subscription.plan = plan;
  if (currentPeriodEnd) user.subscription.currentPeriodEnd = new Date(currentPeriodEnd);

  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: user });
});

// @desc    Get platform reports
// @route   GET /api/admin/reports
// @access  Admin
exports.getReports = asyncHandler(async (req, res, next) => {
  const { period = '30' } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // User growth
  const userGrowth = await User.aggregate([
    { $match: { createdAt: { $gte: daysAgo }, role: 'user' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Revenue over time
  const revenueData = await Transaction.aggregate([
    { $match: { createdAt: { $gte: daysAgo }, type: 'subscription', status: 'completed' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Charity distribution
  const charityData = await User.aggregate([
    { $match: { selectedCharity: { $ne: null }, 'subscription.status': 'active' } },
    { $group: { _id: '$selectedCharity', count: { $sum: 1 } } },
    {
      $lookup: {
        from: 'charities',
        localField: '_id',
        foreignField: '_id',
        as: 'charity'
      }
    },
    { $unwind: '$charity' },
    { $project: { name: '$charity.name', count: 1 } }
  ]);

  // Draw stats
  const drawStats = await Draw.find({ status: 'published', isSimulation: false })
    .sort({ drawDate: -1 })
    .limit(6)
    .select('month year totalParticipants prizePool winners');

  res.status(200).json({
    success: true,
    data: {
      userGrowth,
      revenueData,
      charityData,
      drawStats
    }
  });
});

// @desc    Delete user (admin - soft delete)
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));

  user.isActive = false;
  user.email = `deleted_${Date.now()}_${user.email}`;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'User account deactivated' });
});

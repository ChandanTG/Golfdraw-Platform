const Score = require('../models/Score');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get user's scores (last 5)
// @route   GET /api/scores
// @access  Private
exports.getMyScores = asyncHandler(async (req, res, next) => {
  const scores = await Score.find({ user: req.user.id })
    .sort({ date: -1 })
    .limit(5);

  res.status(200).json({ success: true, count: scores.length, data: scores });
});

// @desc    Add a new score (auto-replaces oldest if 5 exist)
// @route   POST /api/scores
// @access  Private (Subscribers only)
exports.addScore = asyncHandler(async (req, res, next) => {
  // Check subscription
  if (req.user.subscription.status !== 'active') {
    return next(new ErrorResponse('Active subscription required to enter scores', 403));
  }

  const { score, date, course, notes } = req.body;

  // Validate score range
  if (score < 1 || score > 45) {
    return next(new ErrorResponse('Score must be between 1 and 45', 400));
  }

  // Validate date is not in the future
  if (new Date(date) > new Date()) {
    return next(new ErrorResponse('Score date cannot be in the future', 400));
  }

  let newScore;
  try {
    newScore = await Score.addScore(req.user.id, { score, date: new Date(date), course, notes });
  } catch (err) {
    return next(new ErrorResponse(err.message, 400));
  }

  res.status(201).json({ success: true, data: newScore });
});

// @desc    Update a score
// @route   PUT /api/scores/:id
// @access  Private
exports.updateScore = asyncHandler(async (req, res, next) => {
  let scoreDoc = await Score.findById(req.params.id);

  if (!scoreDoc) {
    return next(new ErrorResponse('Score not found', 404));
  }

  // Make sure user owns this score (unless admin)
  if (scoreDoc.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this score', 403));
  }

  const { score, course, notes } = req.body;

  // Don't allow changing the date (would need duplicate check)
  if (score !== undefined && (score < 1 || score > 45)) {
    return next(new ErrorResponse('Score must be between 1 and 45', 400));
  }

  const updatedScore = await Score.findByIdAndUpdate(
    req.params.id,
    { score, course, notes },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: updatedScore });
});

// @desc    Delete a score
// @route   DELETE /api/scores/:id
// @access  Private
exports.deleteScore = asyncHandler(async (req, res, next) => {
  const scoreDoc = await Score.findById(req.params.id);

  if (!scoreDoc) {
    return next(new ErrorResponse('Score not found', 404));
  }

  if (scoreDoc.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this score', 403));
  }

  await Score.findByIdAndDelete(req.params.id);

  res.status(200).json({ success: true, data: {} });
});

// @desc    Get scores for a specific user (admin)
// @route   GET /api/scores/user/:userId
// @access  Admin
exports.getUserScores = asyncHandler(async (req, res, next) => {
  const scores = await Score.find({ user: req.params.userId })
    .sort({ date: -1 })
    .populate('user', 'name email');

  res.status(200).json({ success: true, count: scores.length, data: scores });
});

// @desc    Get score statistics
// @route   GET /api/scores/stats
// @access  Private
exports.getScoreStats = asyncHandler(async (req, res, next) => {
  const scores = await Score.find({ user: req.user.id }).sort({ date: -1 });

  if (!scores.length) {
    return res.status(200).json({ success: true, data: null });
  }

  const values = scores.map(s => s.score);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);

  // Frequency distribution
  const frequency = {};
  values.forEach(v => { frequency[v] = (frequency[v] || 0) + 1; });

  res.status(200).json({
    success: true,
    data: {
      count: scores.length,
      average: parseFloat(avg.toFixed(2)),
      highest: max,
      lowest: min,
      scores,
      frequency
    }
  });
});

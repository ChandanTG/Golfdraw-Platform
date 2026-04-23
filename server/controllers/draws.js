const Draw = require('../models/Draw');
const Winner = require('../models/Winner');
const Score = require('../models/Score');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// Subscription prices in INR (paise)
const MONTHLY_PRICE = 85000; // ₹850
const YEARLY_PRICE = 850000; // ₹8500

// Prize distribution
const PRIZE_DIST = {
  fiveMatch: 0.40,
  fourMatch: 0.35,
  threeMatch: 0.25
};

/**
 * Generate winning numbers using random or frequency-based algorithm
 */
const generateWinningNumbers = async (method = 'random') => {
  const numbers = [];
  const used = new Set();

  if (method === 'frequency') {
    // Get all scores from last 3 months and pick most frequent
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const scores = await Score.aggregate([
      { $match: { date: { $gte: threeMonthsAgo } } },
      { $group: { _id: '$score', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const frequencyPool = scores.map(s => s._id);

    // Pick 5 numbers weighted by frequency
    let attempts = 0;
    while (numbers.length < 5 && attempts < 100) {
      attempts++;
      if (frequencyPool.length > 0 && Math.random() > 0.3) {
        // Pick from frequent numbers
        const idx = Math.floor(Math.random() * Math.min(10, frequencyPool.length));
        const val = frequencyPool[idx];
        if (!used.has(val)) {
          numbers.push(val);
          used.add(val);
        }
      } else {
        // Random number
        const val = Math.floor(Math.random() * 45) + 1;
        if (!used.has(val)) {
          numbers.push(val);
          used.add(val);
        }
      }
    }

    // Fallback to random if we couldn't get 5 unique numbers
    while (numbers.length < 5) {
      const val = Math.floor(Math.random() * 45) + 1;
      if (!used.has(val)) {
        numbers.push(val);
        used.add(val);
      }
    }
  } else {
    // Pure random
    while (numbers.length < 5) {
      const val = Math.floor(Math.random() * 45) + 1;
      if (!used.has(val)) {
        numbers.push(val);
        used.add(val);
      }
    }
  }

  return numbers.map((value, idx) => ({ position: idx + 1, value }));
};

/**
 * Execute draw logic - calculate matches and prizes
 */
const executeDraw = async (draw, jackpotCarried = 0) => {
  const winningValues = draw.winningNumbers.map(n => n.value);

  // Get all eligible subscribers with their scores
  const eligibleUsers = await User.find({
    'subscription.status': 'active',
    isActive: true
  });

  let activeSubscriberCount = eligibleUsers.length;

  // Calculate prize pool from this month's subscriptions
  // (In production, this would come from actual Stripe invoice amounts)
  const monthlyRevenue = activeSubscriberCount * MONTHLY_PRICE / 100; // approximate in INR
  const totalPool = monthlyRevenue * 0.7 + jackpotCarried; // 70% of revenue goes to prize pool

  const prizePool = {
    total: totalPool,
    fiveMatchPrize: Math.floor(totalPool * PRIZE_DIST.fiveMatch * 100) / 100,
    fourMatchPrize: Math.floor(totalPool * PRIZE_DIST.fourMatch * 100) / 100,
    threeMatchPrize: Math.floor(totalPool * PRIZE_DIST.threeMatch * 100) / 100,
    jackpotRollover: 0
  };

  const participants = [];
  const winners = { fiveMatch: [], fourMatch: [], threeMatch: [] };

  for (const user of eligibleUsers) {
    const userScores = await Score.find({ user: user._id })
      .sort({ date: -1 })
      .limit(5);

    if (userScores.length === 0) continue;

    const scoreValues = userScores.map(s => s.score);

    // Count matches (positional matching - each score vs corresponding winning number)
    // Or use set-based matching (score appears in winning numbers)
    let matchCount = 0;
    const matchedPositions = [];

    // Set-based matching: how many of user's scores are in the winning numbers
    const winningSet = new Set(winningValues);
    scoreValues.forEach((val, idx) => {
      if (winningSet.has(val)) {
        matchCount++;
        matchedPositions.push(idx + 1);
      }
    });

    const entry = {
      user: user._id,
      scores: scoreValues,
      matchCount,
      matchedPositions,
      prizeAmount: 0,
      isPaid: false
    };

    if (matchCount === 5) winners.fiveMatch.push(user._id);
    else if (matchCount === 4) winners.fourMatch.push(user._id);
    else if (matchCount === 3) winners.threeMatch.push(user._id);

    participants.push(entry);
  }

  // Handle jackpot rollover
  if (winners.fiveMatch.length === 0) {
    prizePool.jackpotRollover = prizePool.fiveMatchPrize;
    prizePool.fiveMatchPrize = 0;
  }

  // Assign prize amounts to participants
  participants.forEach(p => {
    const userId = p.user.toString();
    if (winners.fiveMatch.some(id => id.toString() === userId) && winners.fiveMatch.length > 0) {
      p.prizeAmount = prizePool.fiveMatchPrize / winners.fiveMatch.length;
    } else if (winners.fourMatch.some(id => id.toString() === userId) && winners.fourMatch.length > 0) {
      p.prizeAmount = prizePool.fourMatchPrize / winners.fourMatch.length;
    } else if (winners.threeMatch.some(id => id.toString() === userId) && winners.threeMatch.length > 0) {
      p.prizeAmount = prizePool.threeMatchPrize / winners.threeMatch.length;
    }
  });

  return { participants, winners, prizePool, totalParticipants: participants.length };
};

// @desc    Get all draws (paginated)
// @route   GET /api/draws
// @access  Public
exports.getDraws = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { status: 'published', isSimulation: false };

  const total = await Draw.countDocuments(query);
  const draws = await Draw.find(query)
    .sort({ drawDate: -1 })
    .skip(skip)
    .limit(limit)
    .select('-participants'); // Don't expose all participants publicly

  res.status(200).json({
    success: true,
    count: draws.length,
    total,
    pagination: { page, limit, pages: Math.ceil(total / limit) },
    data: draws
  });
});

// @desc    Get single draw
// @route   GET /api/draws/:id
// @access  Public
exports.getDraw = asyncHandler(async (req, res, next) => {
  const draw = await Draw.findById(req.params.id)
    .populate('winners.fiveMatch', 'name')
    .populate('winners.fourMatch', 'name')
    .populate('winners.threeMatch', 'name');

  if (!draw) return next(new ErrorResponse('Draw not found', 404));

  res.status(200).json({ success: true, data: draw });
});

// @desc    Get current month's draw info
// @route   GET /api/draws/current
// @access  Public
exports.getCurrentDraw = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const draw = await Draw.findOne({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    isSimulation: false
  });

  // Get eligible user count
  const eligibleCount = await User.countDocuments({ 'subscription.status': 'active' });

  res.status(200).json({
    success: true,
    data: draw,
    eligibleParticipants: eligibleCount
  });
});

// @desc    Schedule a draw (admin)
// @route   POST /api/draws/schedule
// @access  Admin
exports.scheduleDraw = asyncHandler(async (req, res, next) => {
  const { month, year, drawDate, drawMethod } = req.body;

  // Check for existing draw
  const existing = await Draw.findOne({ month, year, isSimulation: false });
  if (existing) {
    return next(new ErrorResponse('A draw already exists for this month/year', 400));
  }

  // Get jackpot from previous month if rolled over
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevDraw = await Draw.findOne({ month: prevMonth, year: prevYear, isSimulation: false, status: 'published' });
  const jackpotCarried = prevDraw?.prizePool?.jackpotRollover || 0;

  const draw = await Draw.create({
    month,
    year,
    drawDate: new Date(drawDate),
    drawMethod: drawMethod || 'random',
    jackpotCarriedIn: jackpotCarried,
    status: 'scheduled'
  });

  res.status(201).json({ success: true, data: draw });
});

// @desc    Simulate draw (admin - preview without committing)
// @route   POST /api/draws/:id/simulate
// @access  Admin
exports.simulateDraw = asyncHandler(async (req, res, next) => {
  const draw = await Draw.findById(req.params.id);
  if (!draw) return next(new ErrorResponse('Draw not found', 404));

  const winningNumbers = await generateWinningNumbers(req.body.drawMethod || draw.drawMethod);
  const tempDraw = { ...draw.toObject(), winningNumbers };
  const { participants, winners, prizePool, totalParticipants } = await executeDraw(tempDraw, draw.jackpotCarriedIn);

  res.status(200).json({
    success: true,
    simulation: true,
    data: {
      winningNumbers,
      winners: {
        fiveMatch: winners.fiveMatch.length,
        fourMatch: winners.fourMatch.length,
        threeMatch: winners.threeMatch.length
      },
      prizePool,
      totalParticipants
    }
  });
});

// @desc    Execute draw (admin - commit and save results)
// @route   POST /api/draws/:id/execute
// @access  Admin
exports.executeDraw = asyncHandler(async (req, res, next) => {
  let draw = await Draw.findById(req.params.id);
  if (!draw) return next(new ErrorResponse('Draw not found', 404));

  if (draw.status === 'published') {
    return next(new ErrorResponse('This draw has already been published', 400));
  }

  // Generate winning numbers
  const winningNumbers = req.body.winningNumbers || await generateWinningNumbers(draw.drawMethod);
  draw.winningNumbers = winningNumbers;

  // Execute draw
  const { participants, winners, prizePool, totalParticipants } = await executeDraw(draw, draw.jackpotCarriedIn);

  draw.participants = participants;
  draw.winners = winners;
  draw.prizePool = prizePool;
  draw.totalParticipants = totalParticipants;
  draw.status = 'executed';
  draw.executedAt = new Date();

  await draw.save();

  res.status(200).json({ success: true, data: draw });
});

// @desc    Publish draw results (admin)
// @route   POST /api/draws/:id/publish
// @access  Admin
exports.publishDraw = asyncHandler(async (req, res, next) => {
  const draw = await Draw.findById(req.params.id);
  if (!draw) return next(new ErrorResponse('Draw not found', 404));

  if (draw.status !== 'executed') {
    return next(new ErrorResponse('Draw must be executed before publishing', 400));
  }

  draw.status = 'published';
  draw.publishedAt = new Date();
  await draw.save();

  // Create Winner records
  const allWinners = [
    ...draw.winners.fiveMatch.map(uid => ({ userId: uid, matchType: '5-match' })),
    ...draw.winners.fourMatch.map(uid => ({ userId: uid, matchType: '4-match' })),
    ...draw.winners.threeMatch.map(uid => ({ userId: uid, matchType: '3-match' }))
  ];

  for (const w of allWinners) {
    const participantEntry = draw.participants.find(p => p.user.toString() === w.userId.toString());
    const prizeAmount = participantEntry?.prizeAmount || 0;

    await Winner.findOneAndUpdate(
      { user: w.userId, draw: draw._id },
      {
        user: w.userId,
        draw: draw._id,
        matchType: w.matchType,
        prizeAmount,
        verificationStatus: 'pending',
        paymentStatus: 'pending'
      },
      { upsert: true, new: true }
    );
  }

  res.status(200).json({ success: true, data: draw });
});

// @desc    Get user's draw history / participation
// @route   GET /api/draws/my-history
// @access  Private
exports.getMyDrawHistory = asyncHandler(async (req, res, next) => {
  const draws = await Draw.find({
    status: 'published',
    isSimulation: false,
    'participants.user': req.user.id
  })
    .sort({ drawDate: -1 })
    .limit(12);

  const history = draws.map(draw => {
    const myEntry = draw.participants.find(p => p.user.toString() === req.user.id);
    return {
      drawId: draw._id,
      month: draw.month,
      year: draw.year,
      drawDate: draw.drawDate,
      winningNumbers: draw.winningNumbers,
      myScores: myEntry?.scores,
      matchCount: myEntry?.matchCount || 0,
      prizeAmount: myEntry?.prizeAmount || 0
    };
  });

  res.status(200).json({ success: true, data: history });
});

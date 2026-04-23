const Winner = require('../models/Winner');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const multer = require('multer');

// Configure multer for proof uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.FILE_UPLOAD_PATH || './public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, `proof-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDFs are allowed for proof'), false);
  }
};

exports.upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_UPLOAD) || 10 * 1024 * 1024 },
  fileFilter
});

// @desc    Get my winnings
// @route   GET /api/winners/my
// @access  Private
exports.getMyWinnings = asyncHandler(async (req, res, next) => {
  const winners = await Winner.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate('draw', 'month year drawDate winningNumbers');

  res.status(200).json({ success: true, count: winners.length, data: winners });
});

// @desc    Upload proof for a win
// @route   POST /api/winners/:id/proof
// @access  Private
exports.uploadProof = asyncHandler(async (req, res, next) => {
  const winner = await Winner.findById(req.params.id);

  if (!winner) return next(new ErrorResponse('Winner record not found', 404));

  if (winner.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  if (winner.verificationStatus === 'approved') {
    return next(new ErrorResponse('This win has already been verified', 400));
  }

  if (!req.file) {
    return next(new ErrorResponse('Please upload a proof image', 400));
  }

  winner.proofImage = req.file.filename;
  winner.proofUploadedAt = new Date();
  winner.verificationStatus = 'pending';
  await winner.save();

  res.status(200).json({ success: true, data: winner });
});

// @desc    Get all winners (admin)
// @route   GET /api/winners
// @access  Admin
exports.getAllWinners = asyncHandler(async (req, res, next) => {
  const { status, paymentStatus, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.verificationStatus = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Winner.countDocuments(query);

  const winners = await Winner.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'name email subscription')
    .populate('draw', 'month year drawDate')
    .populate('verifiedBy', 'name');

  res.status(200).json({
    success: true,
    total,
    data: winners
  });
});

// @desc    Verify/approve/reject a winner (admin)
// @route   PUT /api/winners/:id/verify
// @access  Admin
exports.verifyWinner = asyncHandler(async (req, res, next) => {
  const { status, rejectionReason } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return next(new ErrorResponse('Status must be approved or rejected', 400));
  }

  const winner = await Winner.findById(req.params.id);
  if (!winner) return next(new ErrorResponse('Winner not found', 404));

  winner.verificationStatus = status;
  winner.verifiedBy = req.user.id;
  winner.verifiedAt = new Date();

  if (status === 'rejected') {
    winner.rejectionReason = rejectionReason;
  }

  await winner.save();

  res.status(200).json({ success: true, data: winner });
});

// @desc    Update payment status (admin)
// @route   PUT /api/winners/:id/payment
// @access  Admin
exports.updatePaymentStatus = asyncHandler(async (req, res, next) => {
  const { paymentStatus, paymentMethod, paymentReference } = req.body;

  const winner = await Winner.findByIdAndUpdate(
    req.params.id,
    {
      paymentStatus,
      paymentMethod,
      paymentReference,
      ...(paymentStatus === 'paid' ? { paidAt: new Date() } : {})
    },
    { new: true }
  ).populate('user', 'name email');

  if (!winner) return next(new ErrorResponse('Winner not found', 404));

  res.status(200).json({ success: true, data: winner });
});

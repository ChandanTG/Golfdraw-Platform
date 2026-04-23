const mongoose = require('mongoose');

const WinnerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  draw: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Draw',
    required: true
  },
  matchType: {
    type: String,
    enum: ['5-match', '4-match', '3-match'],
    required: true
  },
  prizeAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // Proof of claim
  proofImage: {
    type: String,
    default: null
  },
  proofUploadedAt: Date,
  // Admin verification
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: Date,
  rejectionReason: String,
  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending'
  },
  paymentMethod: String,
  paymentReference: String,
  paidAt: Date,
  // Notification
  notificationSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound unique index - one winner entry per user per draw
WinnerSchema.index({ user: 1, draw: 1 }, { unique: true });

module.exports = mongoose.model('Winner', WinnerSchema);

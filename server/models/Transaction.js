const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['subscription', 'prize_payout', 'charity_contribution', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'inr'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  // Stripe references
  stripePaymentIntentId: String,
  stripeInvoiceId: String,
  stripeChargeId: String,
  // Related entities
  draw: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Draw',
    default: null
  },
  charity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Charity',
    default: null
  },
  // Description
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', TransactionSchema);

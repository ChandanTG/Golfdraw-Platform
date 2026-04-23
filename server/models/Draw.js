const mongoose = require('mongoose');

const DrawNumberSchema = new mongoose.Schema({
  position: { type: Number, required: true }, // 1-5
  value: { type: Number, required: true, min: 1, max: 45 }
}, { _id: false });

const DrawEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scores: [{ type: Number, min: 1, max: 45 }], // the 5 scores entered
  matchCount: { type: Number, default: 0 }, // how many matched
  matchedPositions: [Number], // which positions matched
  prizeAmount: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false }
}, { _id: false });

const DrawSchema = new mongoose.Schema({
  month: {
    type: Number, // 1-12
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  drawDate: {
    type: Date,
    required: true
  },
  // The 5 winning numbers drawn
  winningNumbers: [DrawNumberSchema],
  // Draw method
  drawMethod: {
    type: String,
    enum: ['random', 'frequency'],
    default: 'random'
  },
  // All participants for this draw
  participants: [DrawEntrySchema],
  // Winners by category
  winners: {
    fiveMatch: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    fourMatch: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    threeMatch: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  // Prize pool breakdown
  prizePool: {
    total: { type: Number, default: 0 },
    fiveMatchPrize: { type: Number, default: 0 },  // 40%
    fourMatchPrize: { type: Number, default: 0 },   // 35%
    threeMatchPrize: { type: Number, default: 0 },  // 25%
    jackpotRollover: { type: Number, default: 0 }   // carried from previous if no 5-match
  },
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'simulated', 'executed', 'published'],
    default: 'scheduled'
  },
  isSimulation: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  executedAt: Date,
  // Jackpot from previous draw (rollover)
  jackpotCarriedIn: {
    type: Number,
    default: 0
  },
  totalParticipants: {
    type: Number,
    default: 0
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound unique index for month/year (one real draw per month)
DrawSchema.index({ month: 1, year: 1, isSimulation: 1 });

module.exports = mongoose.model('Draw', DrawSchema);

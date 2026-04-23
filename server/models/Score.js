const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  score: {
    type: Number,
    required: [true, 'Please provide a score'],
    min: [1, 'Score must be between 1 and 45'],
    max: [45, 'Score must be between 1 and 45']
  },
  date: {
    type: Date,
    required: [true, 'Please provide a date for this score']
  },
  course: {
    type: String,
    trim: true,
    maxlength: [200, 'Course name cannot exceed 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  // Whether this score was used in a draw
  usedInDraw: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Draw',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound unique index - user cannot have two scores for same date
ScoreSchema.index({ user: 1, date: 1 }, { unique: true });

// Static method to add/replace score (maintains max 5 scores per user)
ScoreSchema.statics.addScore = async function(userId, scoreData) {
  const Score = this;
  
  // Check for duplicate date
  const existingScore = await Score.findOne({
    user: userId,
    date: new Date(scoreData.date)
  });
  
  if (existingScore) {
    throw new Error('A score already exists for this date');
  }
  
  // Count current scores
  const count = await Score.countDocuments({ user: userId });
  
  if (count >= 5) {
    // Find and delete the oldest score
    const oldest = await Score.findOne({ user: userId }).sort({ date: 1 });
    if (oldest) {
      await Score.findByIdAndDelete(oldest._id);
    }
  }
  
  // Create new score
  return await Score.create({ user: userId, ...scoreData });
};

module.exports = mongoose.model('Score', ScoreSchema);

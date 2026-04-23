const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  // Subscription info (mirrored from Stripe)
  subscription: {
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'none', 'trialing', 'past_due'],
      default: 'none'
    },
    plan: {
      type: String,
      enum: ['monthly', 'yearly', null],
      default: null
    },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false }
  },
  // Charity selection
  selectedCharity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Charity',
    default: null
  },
  charityContributionPercent: {
    type: Number,
    default: 10, // minimum 10%
    min: [10, 'Minimum charity contribution is 10%'],
    max: [100, 'Cannot exceed 100%']
  },
  // Draw participation
  isEligibleForDraw: {
    type: Boolean,
    default: false
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for scores
UserSchema.virtual('scores', {
  ref: 'Score',
  localField: '_id',
  foreignField: 'user',
  options: { sort: { date: -1 }, limit: 5 }
});

// Hash password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update draw eligibility based on subscription
UserSchema.pre('save', function(next) {
  this.isEligibleForDraw = this.subscription.status === 'active';
  next();
});

// Sign JWT
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate password reset token
UserSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Generate email verification token
UserSchema.methods.getEmailVerificationToken = function() {
  const verifyToken = crypto.randomBytes(20).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verifyToken)
    .digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verifyToken;
};

module.exports = mongoose.model('User', UserSchema);

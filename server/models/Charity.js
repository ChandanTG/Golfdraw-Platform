const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  date: { type: Date, required: true },
  location: { type: String, trim: true },
  image: { type: String, default: null }
});

const CharitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a charity name'],
    unique: true,
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  logo: {
    type: String,
    default: null
  },
  images: [{
    type: String
  }],
  website: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['health', 'education', 'environment', 'sports', 'community', 'children', 'animals', 'other'],
    default: 'other'
  },
  events: [EventSchema],
  totalContributions: {
    type: Number,
    default: 0
  },
  subscriberCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featuredOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate slug from name
CharitySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

module.exports = mongoose.model('Charity', CharitySchema);

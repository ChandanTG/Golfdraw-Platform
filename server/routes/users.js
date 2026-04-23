const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

// @desc  Get user profile
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('selectedCharity', 'name logo slug category');
  res.status(200).json({ success: true, data: user });
}));

module.exports = router;

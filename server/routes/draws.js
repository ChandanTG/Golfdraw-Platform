const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDraws, getDraw, getCurrentDraw, scheduleDraw,
  simulateDraw, executeDraw, publishDraw, getMyDrawHistory
} = require('../controllers/draws');

// Public
router.get('/', getDraws);
router.get('/current', getCurrentDraw);
router.get('/:id', getDraw);

// Private
router.get('/my-history', protect, getMyDrawHistory);

// Admin only
router.post('/schedule', protect, authorize('admin'), scheduleDraw);
router.post('/:id/simulate', protect, authorize('admin'), simulateDraw);
router.post('/:id/execute', protect, authorize('admin'), executeDraw);
router.post('/:id/publish', protect, authorize('admin'), publishDraw);

module.exports = router;

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const {
  getMyScores, addScore, updateScore,
  deleteScore, getUserScores, getScoreStats
} = require('../controllers/scores');

router.use(protect);

router.get('/', getMyScores);
router.get('/stats', getScoreStats);
router.post('/', [
  body('score').isInt({ min: 1, max: 45 }).withMessage('Score must be between 1 and 45'),
  body('date').isISO8601().withMessage('Valid date required')
], validate, addScore);
router.put('/:id', updateScore);
router.delete('/:id', deleteScore);

// Admin
router.get('/user/:userId', authorize('admin'), getUserScores);

module.exports = router;

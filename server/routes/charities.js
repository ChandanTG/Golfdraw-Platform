const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCharities, getCharity, createCharity,
  updateCharity, deleteCharity, selectCharity,
  getCharityStats, addCharityEvent
} = require('../controllers/charities');

router.get('/', getCharities);
router.get('/stats', protect, authorize('admin'), getCharityStats);
router.get('/:id', getCharity);

router.put('/select', protect, selectCharity);

router.post('/', protect, authorize('admin'), createCharity);
router.put('/:id', protect, authorize('admin'), updateCharity);
router.delete('/:id', protect, authorize('admin'), deleteCharity);
router.post('/:id/events', protect, authorize('admin'), addCharityEvent);

module.exports = router;

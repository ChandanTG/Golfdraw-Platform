const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMyWinnings, uploadProof, getAllWinners,
  verifyWinner, updatePaymentStatus, upload
} = require('../controllers/winners');

router.use(protect);

router.get('/my', getMyWinnings);
router.post('/:id/proof', upload.single('proof'), uploadProof);

// Admin
router.get('/', authorize('admin'), getAllWinners);
router.put('/:id/verify', authorize('admin'), verifyWinner);
router.put('/:id/payment', authorize('admin'), updatePaymentStatus);

module.exports = router;

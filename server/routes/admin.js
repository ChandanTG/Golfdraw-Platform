const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardStats, getUsers, getUser, updateUser,
  updateUserSubscription, getReports, deleteUser
} = require('../controllers/admin');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/reports', getReports);
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/subscription', updateUserSubscription);
router.delete('/users/:id', deleteUser);

module.exports = router;

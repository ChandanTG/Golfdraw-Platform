const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createCheckoutSession, createBillingPortal, getSubscription,
  cancelSubscription, handleWebhook, getTransactions, mockPurchase
} = require('../controllers/payments');

// Stripe webhook - raw body parsing is set in server.js
router.post('/webhook', handleWebhook);

router.use(protect);
router.post('/create-checkout-session', createCheckoutSession);
router.post('/mock-purchase', mockPurchase);
router.post('/billing-portal', createBillingPortal);
router.get('/subscription', getSubscription);
router.post('/cancel', cancelSubscription);
router.get('/transactions', getTransactions);

module.exports = router;

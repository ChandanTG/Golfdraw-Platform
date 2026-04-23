const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create Stripe checkout session
// @route   POST /api/payments/create-checkout-session
// @access  Private
exports.createCheckoutSession = asyncHandler(async (req, res, next) => {
  const { plan } = req.body; // 'monthly' or 'yearly'

  if (!['monthly', 'yearly'].includes(plan)) {
    return next(new ErrorResponse('Invalid plan selected', 400));
  }

  const user = await User.findById(req.user.id);

  if (user.subscription.status === 'active') {
    return next(new ErrorResponse('You already have an active subscription', 400));
  }

  const priceId = plan === 'monthly'
    ? process.env.STRIPE_MONTHLY_PRICE_ID
    : process.env.STRIPE_YEARLY_PRICE_ID;

  // Create or retrieve Stripe customer
  let customerId = user.subscription.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user._id.toString() }
    });
    customerId = customer.id;
    user.subscription.stripeCustomerId = customerId;
    await user.save({ validateBeforeSave: false });
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    currency: 'inr',
    line_items: [{
      price: priceId,
      quantity: 1
    }],
    success_url: `${clientUrl}/dashboard?subscription=success`,
    cancel_url: `${clientUrl}/subscribe?cancelled=true`,
    subscription_data: {
      metadata: { userId: user._id.toString() }
    },
    metadata: { userId: user._id.toString(), plan }
  });

  res.status(200).json({ success: true, url: session.url, sessionId: session.id });
});

// @desc    Mock purchase (bypass Stripe)
// @route   POST /api/payments/mock-purchase
// @access  Private
exports.mockPurchase = asyncHandler(async (req, res, next) => {
  if (process.env.MOCK_PAYMENTS !== 'true') {
    return next(new ErrorResponse('Mock payments are not enabled', 403));
  }

  const { plan } = req.body;
  if (!['monthly', 'yearly'].includes(plan)) {
    return next(new ErrorResponse('Invalid plan selected', 400));
  }

  const user = await User.findById(req.user.id);
  if (user.subscription.status === 'active') {
    return next(new ErrorResponse('You already have an active subscription', 400));
  }

  // Update user subscription
  const now = new Date();
  const endDate = new Date();
  if (plan === 'monthly') {
    endDate.setMonth(now.getMonth() + 1);
  } else {
    endDate.setFullYear(now.getFullYear() + 1);
  }

  user.subscription.status = 'active';
  user.subscription.plan = plan;
  user.subscription.currentPeriodStart = now;
  user.subscription.currentPeriodEnd = endDate;
  user.subscription.stripeCustomerId = `mock_cus_${user._id}`;
  user.subscription.stripeSubscriptionId = `mock_sub_${Date.now()}`;

  await user.save({ validateBeforeSave: false });

  // Create mock transaction
  const amount = plan === 'monthly' ? 850 : 8500;
  await Transaction.create({
    user: user._id,
    type: 'subscription',
    amount: amount,
    currency: 'inr',
    status: 'completed',
    description: `Mock Subscription payment - ${plan} plan — ₹${amount}`
  });

  res.status(200).json({
    success: true,
    message: 'Mock purchase successful',
    data: user.subscription
  });
});

// @desc    Create billing portal session
// @route   POST /api/payments/billing-portal
// @access  Private
exports.createBillingPortal = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user.subscription.stripeCustomerId) {
    return next(new ErrorResponse('No billing account found', 404));
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: user.subscription.stripeCustomerId,
    return_url: `${clientUrl}/dashboard`
  });

  res.status(200).json({ success: true, url: session.url });
});

// @desc    Get subscription info
// @route   GET /api/payments/subscription
// @access  Private
exports.getSubscription = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user.subscription.stripeSubscriptionId) {
    return res.status(200).json({ success: true, data: null });
  }

  let stripeData = null;
  try {
    stripeData = await stripe.subscriptions.retrieve(user.subscription.stripeSubscriptionId);
  } catch (err) {
    // Stripe subscription may not exist anymore
  }

  res.status(200).json({
    success: true,
    data: {
      ...user.subscription.toObject(),
      stripeDetails: stripeData ? {
        currentPeriodEnd: new Date(stripeData.current_period_end * 1000),
        cancelAtPeriodEnd: stripeData.cancel_at_period_end,
        status: stripeData.status
      } : null
    }
  });
});

// @desc    Cancel subscription
// @route   POST /api/payments/cancel
// @access  Private
exports.cancelSubscription = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user.subscription.stripeSubscriptionId) {
    return next(new ErrorResponse('No active subscription found', 404));
  }

  const subscription = await stripe.subscriptions.update(
    user.subscription.stripeSubscriptionId,
    { cancel_at_period_end: true }
  );

  user.subscription.cancelAtPeriodEnd = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Subscription will be cancelled at the end of the current billing period',
    data: { cancelAt: new Date(subscription.current_period_end * 1000) }
  });
});

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Public (Stripe only)
exports.handleWebhook = asyncHandler(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { type, data } = event;
  const obj = data.object;

  console.log(`Stripe webhook: ${type}`);

  switch (type) {
    case 'checkout.session.completed': {
      const userId = obj.metadata?.userId;
      if (userId && obj.subscription) {
        const sub = await stripe.subscriptions.retrieve(obj.subscription);
        await updateUserSubscription(userId, sub, obj.metadata?.plan);
      }
      break;
    }

    case 'invoice.paid': {
      const customerId = obj.customer;
      const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
      if (user) {
        // Amount from Stripe is in paise for INR
        const amountInRupees = obj.amount_paid / 100;
        await Transaction.create({
          user: user._id,
          type: 'subscription',
          amount: amountInRupees,
          currency: 'inr',
          status: 'completed',
          stripeInvoiceId: obj.id,
          description: `Subscription payment - ${user.subscription.plan} plan — ₹${amountInRupees}`
        });

        if (user.subscription.status !== 'active') {
          user.subscription.status = 'active';
          await user.save({ validateBeforeSave: false });
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const customerId = obj.customer;
      const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
      if (user) {
        user.subscription.status = 'past_due';
        await user.save({ validateBeforeSave: false });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const user = await User.findOne({ 'subscription.stripeCustomerId': obj.customer });
      if (user) {
        user.subscription.status = obj.status;
        user.subscription.cancelAtPeriodEnd = obj.cancel_at_period_end;
        user.subscription.currentPeriodEnd = new Date(obj.current_period_end * 1000);
        await user.save({ validateBeforeSave: false });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const user = await User.findOne({ 'subscription.stripeCustomerId': obj.customer });
      if (user) {
        user.subscription.status = 'expired';
        user.subscription.stripeSubscriptionId = null;
        user.subscription.currentPeriodEnd = null;
        await user.save({ validateBeforeSave: false });
      }
      break;
    }

    default:
      break;
  }

  res.status(200).json({ received: true });
});

// Helper to update user subscription from Stripe data
const updateUserSubscription = async (userId, stripeSubscription, plan) => {
  const user = await User.findById(userId);
  if (!user) return;

  user.subscription.status = stripeSubscription.status;
  user.subscription.plan = plan || (stripeSubscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly');
  user.subscription.stripeSubscriptionId = stripeSubscription.id;
  user.subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
  user.subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
  user.subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;

  await user.save({ validateBeforeSave: false });
};

// @desc    Get transaction history
// @route   GET /api/payments/transactions
// @access  Private
exports.getTransactions = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const total = await Transaction.countDocuments({ user: req.user.id });
  const transactions = await Transaction.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('draw', 'month year')
    .populate('charity', 'name');

  res.status(200).json({
    success: true,
    total,
    pagination: { page, limit, pages: Math.ceil(total / limit) },
    data: transactions
  });
});

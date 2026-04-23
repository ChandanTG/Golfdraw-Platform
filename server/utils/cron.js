const cron = require('node-cron');
const Draw = require('../models/Draw');
const User = require('../models/User');

const scheduleCrons = () => {
  // Run every day at midnight - check and execute scheduled draws
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Cron: Checking for draws to execute...');
    try {
      const now = new Date();
      const draws = await Draw.find({
        status: 'scheduled',
        isSimulation: false,
        drawDate: { $lte: now }
      });

      for (const draw of draws) {
        console.log(`Executing draw: ${draw.month}/${draw.year}`);
        // Auto-execution logic can be triggered here
        // In production, admins manually trigger publish after reviewing
      }
    } catch (err) {
      console.error('Cron draw check error:', err.message);
    }
  });

  // Run on 1st of each month - expire old subscriptions
  cron.schedule('0 1 1 * *', async () => {
    console.log(' Cron: Checking expired subscriptions...');
    try {
      const result = await User.updateMany(
        {
          'subscription.status': 'active',
          'subscription.currentPeriodEnd': { $lt: new Date() },
          'subscription.cancelAtPeriodEnd': true
        },
        {
          $set: { 'subscription.status': 'expired' }
        }
      );
      console.log(`Expired ${result.modifiedCount} subscriptions`);
    } catch (err) {
      console.error('Cron subscription check error:', err.message);
    }
  });

  console.log(' Cron jobs scheduled');
};

module.exports = { scheduleCrons };

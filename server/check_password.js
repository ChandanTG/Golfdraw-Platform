const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await User.findOne({ email: 'admin@golfdraw.com' }).select('+password');
    if (admin) {
      const isMatch = await admin.matchPassword('Admin@123456');
      console.log('Password match:', isMatch);
    } else {
      console.log('Admin not found!');
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
};

checkPassword();

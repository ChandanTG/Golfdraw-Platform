const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await User.findOne({ email: 'admin@golfdraw.com' });
    if (admin) {
      console.log('Admin found:');
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Active:', admin.isActive);
      console.log('Verified:', admin.isEmailVerified);
    } else {
      console.log('Admin not found!');
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
};

checkAdmin();

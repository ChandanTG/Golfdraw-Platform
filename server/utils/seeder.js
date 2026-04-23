const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const Score = require('../models/Score');
const Charity = require('../models/Charity');
const Draw = require('../models/Draw');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected for seeding');
};

const charities = [
  {
    name: 'Hearts in Motion',
    slug: 'hearts-in-motion',
    description: 'Hearts in Motion supports cardiac care research and provides life-saving equipment to underfunded hospitals across the UK. Every penny raised goes directly to patient care.',
    shortDescription: 'Supporting cardiac care research and hospital equipment.',
    category: 'health',
    website: 'https://example.com/hearts',
    featuredOrder: 3
  },
  {
    name: 'The Learning Tree',
    slug: 'the-learning-tree',
    description: 'The Learning Tree provides educational resources, scholarships, and mentorship programs to disadvantaged youth across the UK, helping them reach their full potential.',
    shortDescription: 'Empowering youth through education and mentorship.',
    category: 'education',
    website: 'https://example.com/learning',
    featuredOrder: 2
  },
  {
    name: 'Green Fairways Foundation',
    slug: 'green-fairways-foundation',
    description: 'We plant trees and restore natural habitats around golf courses and green spaces, making our environment greener for future generations.',
    shortDescription: 'Restoring natural habitats around golf courses.',
    category: 'environment',
    website: 'https://example.com/green',
    featuredOrder: 1
  },
  {
    name: 'Young Champions',
    slug: 'young-champions',
    description: 'Young Champions funds sports programs for children in deprived communities, providing equipment, coaching, and access to facilities they would otherwise never experience.',
    shortDescription: 'Bringing sport to children in deprived communities.',
    category: 'sports',
    featuredOrder: 4
  },
  {
    name: 'Safe Haven',
    slug: 'safe-haven',
    description: "Safe Haven operates shelters and support services for the UK's most vulnerable families, ensuring every child has a warm bed and healthy meal.",
    shortDescription: 'Support services for vulnerable families.',
    category: 'community',
    featuredOrder: 5
  }
];

const seed = async () => {
  await connectDB();

  try {
    // Clear existing data
    await User.deleteMany({});
    await Score.deleteMany({});
    await Charity.deleteMany({});
    await Draw.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create charities
    const createdCharities = await Charity.create(charities);
    console.log(` Created ${createdCharities.length} charities`);

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@golfdraw.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
      subscription: { status: 'active', plan: 'yearly' }
    });
    console.log(` Created admin: ${adminUser.email}`);

    // Create sample subscribers
    const sampleUsers = [
      { name: 'James Wilson', email: 'james@example.com', charity: 0 },
      { name: 'Sarah Connor', email: 'sarah@example.com', charity: 1 },
      { name: 'Mike Thompson', email: 'mike@example.com', charity: 2 },
      { name: 'Emma Davis', email: 'emma@example.com', charity: 3 },
      { name: 'Robert Brown', email: 'robert@example.com', charity: 4 },
      { name: 'Lucy Palmer', email: 'lucy@example.com', charity: 0 },
    ];

    const createdUsers = [];
    for (const u of sampleUsers) {
      const user = await User.create({
        name: u.name,
        email: u.email,
        password: 'Password@123',
        role: 'user',
        isEmailVerified: true,
        isActive: true,
        selectedCharity: createdCharities[u.charity]._id,
        charityContributionPercent: 10,
        subscription: {
          status: 'active',
          plan: 'monthly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      createdUsers.push(user);

      // Add 5 scores per user
      const dates = [
        new Date('2025-01-05'),
        new Date('2025-01-12'),
        new Date('2025-01-19'),
        new Date('2025-01-26'),
        new Date('2025-02-02')
      ];
      for (const date of dates) {
        await Score.create({
          user: user._id,
          score: Math.floor(Math.random() * 30) + 10,
          date,
          course: ['St Andrews', 'Augusta', 'Pebble Beach', 'Royal Troon', 'Wentworth'][Math.floor(Math.random() * 5)]
        });
      }
    }

    console.log(` Created ${createdUsers.length} sample users with scores`);

    // Create a sample published draw
    const now = new Date();
    const draw = await Draw.create({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      drawDate: new Date(),
      drawMethod: 'random',
      winningNumbers: [
        { position: 1, value: 7 },
        { position: 2, value: 14 },
        { position: 3, value: 21 },
        { position: 4, value: 28 },
        { position: 5, value: 35 }
      ],
      status: 'published',
      publishedAt: new Date(),
      executedAt: new Date(),
      prizePool: {
        total: 700,
        fiveMatchPrize: 280,
        fourMatchPrize: 245,
        threeMatchPrize: 175,
        jackpotRollover: 0
      },
      totalParticipants: createdUsers.length,
      isSimulation: false
    });

    console.log(` Created sample published draw`);

    console.log('\n Seeding complete!\n');
    console.log(' Test Accounts:');
    console.log(`   Admin:    admin@golfdraw.com / Admin@123456`);
    console.log(`   User:     james@example.com / Password@123`);
    console.log(`   User:     sarah@example.com / Password@123`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();

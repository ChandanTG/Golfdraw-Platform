const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const { scheduleCrons } = require('./utils/cron');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 200,
  message: 'Too many requests from this IP, please try again after 10 minutes'
});
app.use('/api/', limiter);

// Stripe webhook must use raw body (before json parser)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS - Fixed for Vercel deployment
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In production on Vercel, frontend & backend share the same domain
    if (process.env.NODE_ENV === 'production') return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/scores', require('./routes/scores'));
app.use('/api/draws', require('./routes/draws'));
app.use('/api/charities', require('./routes/charities'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/winners', require('./routes/winners'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Golf Draw Platform API is running' });
});

// Serve static assets in production (fallback, Vercel handles this via vercel.json routes)
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(buildPath, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only call app.listen in non-Vercel environments
// Vercel handles the HTTP layer itself via the exported app
if (process.env.VERCEL !== '1') {
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    scheduleCrons();
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
} else {
  // On Vercel: try to schedule crons (will silently fail, that's OK)
  try { scheduleCrons(); } catch (_) {}
}

module.exports = app;

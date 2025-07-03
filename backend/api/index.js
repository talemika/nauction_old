// Import required modules
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

// Import the database connection and admin creation
const mongoose = require('mongoose');
const { createDefaultAdmin } = require('../utils/createAdmin');

// Create Express app
const app = express();

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nauction';
mongoose.connect(MONGODB_URI)
.then(async () => {
  console.log('MongoDB connected successfully');
  // Create default admin user after database connection
  await createDefaultAdmin();
})
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5179',
    'https://*.manus.space',
    'https://nauction-frontend.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Import passport configuration
require('../config/passport');

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes - Note: No /api prefix here since we're already in the /api directory
app.use('/auth', require('../routes/auth'));
app.use('/oauth', require('../routes/oauth')); // Google OAuth routes  
app.use('/auctions', require('../routes/auctions'));
app.use('/bids', require('../routes/bids'));
app.use('/maxbids', require('../routes/maxBid'));
app.use('/upload', require('../routes/upload'));
app.use('/currency', require('../routes/currency'));
app.use('/search', require('../routes/search'));
app.use('/users', require('../routes/users'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'nauction API is running!' });
});

// Export the app for Vercel
module.exports = app;


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');
const { createDefaultAdmin } = require('./utils/createAdmin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://bjhnrhac.manus.space',
    'https://ouqsdgyh.manus.space',
    'https://tvmgvvuw.manus.space',
    'https://zdvddujf.manus.space',
    'https://nnlrfrmm.manus.space',
    'https://tztzliag.manus.space',
    'https://eykpjywi.manus.space',
    'https://xewomthj.manus.space'
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

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auction-app';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully');
  // Create default admin user after database connection
  await createDefaultAdmin();
})
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/auth', require('./routes/oauth')); // Google OAuth routes
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/currency', require('./routes/currency'));
app.use('/api/search', require('./routes/search'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/max-bid', require('./routes/maxBid'));
app.use('/api/users', require('./routes/users'));
app.use('/api/seller-agreements', require('./routes/sellerAgreements'));

// Add Buy It Now functionality to auctions route
const auctionsRouter = require('./routes/auctions');
const buyItNowRouter = require('./routes/buyItNow');
const maxBidRouter = require('./routes/maxBid');
app.use('/api/auctions', buyItNowRouter);
app.use('/api/auctions', maxBidRouter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'Auction App API is running!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});


// Simplified API function for troubleshooting
const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors({
  origin: [
    'https://nauction-frontend.vercel.app',
    'https://*.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Simple test routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Simplified nauction API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/auth/me', (req, res) => {
  res.status(401).json({ 
    message: 'Not authenticated',
    endpoint: '/auth/me',
    method: req.method
  });
});

app.get('/auctions', (req, res) => {
  res.json({ 
    message: 'Auctions endpoint working',
    data: [],
    count: 0
  });
});

app.get('/currency/rates', (req, res) => {
  res.json({ 
    message: 'Currency endpoint working',
    rates: {
      USD: 1,
      NGN: 1600
    }
  });
});

// Catch-all route for debugging
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found in simplified API',
    requestedPath: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /',
      'GET /health', 
      'GET /auth/me',
      'GET /auctions',
      'GET /currency/rates'
    ]
  });
});

module.exports = app;


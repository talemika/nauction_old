const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  console.log('=== Auth Middleware Debug ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Extracted token:', token ? 'Token present' : 'No token');

  if (!token) {
    console.log('No token provided - returning 401');
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log('JWT verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    console.log('JWT decoded successfully:', decoded);
    
    try {
      // Get user from database to ensure they still exist
      const user = await User.findById(decoded.userId);
      if (!user) {
        console.log('User not found in database for ID:', decoded.userId);
        return res.status(401).json({ message: 'User not found' });
      }
      
      console.log('User found:', user.email, 'Role:', user.role);
      
      req.user = {
        id: user._id,
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      console.log('Auth successful, proceeding to next middleware');
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ message: 'Server error in authentication' });
    }
  });
};

// Export both named and default
module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;


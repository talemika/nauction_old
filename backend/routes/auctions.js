const express = require('express');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const authenticateToken = require('./auth').authenticateToken;
const { requireAdminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// Get all active auctions with search and filter support
router.get('/', async (req, res) => {
  try {
    const {
      search,
      minPrice,
      maxPrice,
      currency,
      hasReserve,
      hasBuyItNow,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build the query object
    let query = { status: 'active' };

    // Add search functionality
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Add price range filtering
    if (minPrice || maxPrice) {
      query.startingPrice = {};
      if (minPrice) {
        query.startingPrice.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.startingPrice.$lte = parseFloat(maxPrice);
      }
    }

    // Add currency filtering
    if (currency && ['NGN', 'USD'].includes(currency)) {
      query.currency = currency;
    }

    // Add reserve price filtering
    if (hasReserve !== undefined && hasReserve !== '') {
      if (hasReserve === 'true') {
        query.reservePrice = { $exists: true, $ne: null, $gt: 0 };
      } else if (hasReserve === 'false') {
        query.$or = [
          { reservePrice: { $exists: false } },
          { reservePrice: null },
          { reservePrice: 0 }
        ];
      }
    }

    // Add buy it now filtering
    if (hasBuyItNow !== undefined && hasBuyItNow !== '') {
      if (hasBuyItNow === 'true') {
        query.buyItNowPrice = { $exists: true, $ne: null, $gt: 0 };
      } else if (hasBuyItNow === 'false') {
        query.$or = [
          { buyItNowPrice: { $exists: false } },
          { buyItNowPrice: null },
          { buyItNowPrice: 0 }
        ];
      }
    }

    // Build sort object
    let sortObj = {};
    const validSortFields = ['createdAt', 'startingPrice', 'currentPrice', 'endTime', 'title'];
    if (validSortFields.includes(sortBy)) {
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1; // Default sort
    }

    const auctions = await Auction.find(query)
      .populate('seller', 'username')
      .populate('winner', 'username')
      .sort(sortObj);

    // Update auction statuses
    for (let auction of auctions) {
      await auction.updateStatus();
    }

    res.json({ 
      auctions,
      total: auctions.length,
      filters: {
        search: search || '',
        minPrice: minPrice || '',
        maxPrice: maxPrice || '',
        currency: currency || '',
        hasReserve: hasReserve || '',
        hasBuyItNow: hasBuyItNow || '',
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Error fetching auctions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get auction by ID
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'username')
      .populate('winner', 'username');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Update auction status
    await auction.updateStatus();

    // Get bid history
    const bids = await Bid.find({ auction: auction._id })
      .populate('bidder', 'username')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      auction,
      bids
    });
  } catch (error) {
    console.error('Error fetching auction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new auction (requires admin authentication)
router.post('/', requireAdminAuth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      startingPrice, 
      buyItNowPrice,
      reservePrice,
      bidIncrement,
      media, 
      currency,
      startTime,
      endTime,
      duration
    } = req.body;

    // Validate Buy It Now price
    if (buyItNowPrice && buyItNowPrice <= startingPrice) {
      return res.status(400).json({ 
        message: 'Buy It Now price must be higher than starting price' 
      });
    }

    // Validate reserve price
    if (reservePrice && reservePrice < startingPrice) {
      return res.status(400).json({ 
        message: 'Reserve price cannot be lower than starting price' 
      });
    }

    // Calculate end time
    let auctionEndTime;
    if (endTime) {
      auctionEndTime = new Date(endTime);
    } else if (startTime && duration) {
      auctionEndTime = new Date(startTime);
      auctionEndTime.setHours(auctionEndTime.getHours() + duration);
    } else {
      // Default: start now, end in 24 hours
      auctionEndTime = new Date();
      auctionEndTime.setHours(auctionEndTime.getHours() + (duration || 24));
    }

    const auctionStartTime = startTime ? new Date(startTime) : new Date();

    const auction = new Auction({
      title,
      description,
      startingPrice,
      buyItNowPrice: buyItNowPrice || null,
      reservePrice: reservePrice || null,
      bidIncrement: bidIncrement || 1.00,
      currency: currency || 'NGN',
      media: media || [],
      seller: req.user.userId,
      startTime: auctionStartTime,
      endTime: auctionEndTime,
      status: 'active' // Set status to active immediately
    });

    await auction.save();
    await auction.populate('seller', 'username');

    res.status(201).json({
      message: 'Auction created successfully',
      auction
    });
  } catch (error) {
    console.error('Error creating auction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's auctions
router.get('/user/my-auctions', authenticateToken, async (req, res) => {
  try {
    const auctions = await Auction.find({ seller: req.user.userId })
      .populate('winner', 'username')
      .sort({ createdAt: -1 });

    res.json(auctions);
  } catch (error) {
    console.error('Error fetching user auctions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel auction (only by seller)
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.seller.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this auction' });
    }

    if (auction.status !== 'active') {
      return res.status(400).json({ message: 'Cannot cancel non-active auction' });
    }

    auction.status = 'cancelled';
    await auction.save();

    res.json({ message: 'Auction cancelled successfully', auction });
  } catch (error) {
    console.error('Error cancelling auction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


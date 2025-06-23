const express = require('express');
const Bid = require('../models/Bid');
const Auction = require('../models/Auction');
const User = require('../models/User');
const authenticateToken = require('./auth').authenticateToken;

const router = express.Router();

// Place a bid
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { auctionId, amount, currency } = req.body;

    // Check if auction exists and is active
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (!auction.isActive()) {
      return res.status(400).json({ message: 'Auction is not active' });
    }

    // Check if user is not the seller
    if (auction.seller.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot bid on your own auction' });
    }

    // Get user's current balance
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use auction's currency if no currency specified
    const bidCurrency = currency || auction.currency;

    // Check if bid amount is higher than current price
    if (amount <= auction.currentPrice) {
      const currencySymbol = auction.currency === 'NGN' ? '₦' : '$';
      return res.status(400).json({ 
        message: `Bid amount must be higher than current price of ${currencySymbol}${auction.currentPrice}` 
      });
    }

    // Calculate required balance (20% of bid amount)
    const requiredBalance = amount * 0.20;
    const currencySymbol = bidCurrency === 'NGN' ? '₦' : '$';

    // Check if user has sufficient balance (20% of bid amount)
    if (user.balance < requiredBalance) {
      return res.status(400).json({ 
        message: `Insufficient balance. You need at least ${currencySymbol}${requiredBalance.toFixed(2)} (20% of bid amount) to place this bid. Your current balance is ${currencySymbol}${user.balance.toFixed(2)}.`,
        code: 'INSUFFICIENT_BALANCE',
        required: requiredBalance,
        current: user.balance,
        percentage: 20
      });
    }

    // Create new bid
    const bid = new Bid({
      auction: auctionId,
      bidder: req.user.userId,
      amount,
      currency: bidCurrency
    });
    await bid.save();
    await bid.populate('bidder', 'username');

    res.status(201).json({
      message: 'Bid placed successfully',
      bid,
      remainingBalance: user.balance - requiredBalance
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    if (error.message.includes('Bid amount must be higher') || 
        error.message.includes('Auction is not active') ||
        error.message.includes('Insufficient balance')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if user can bid on an auction (balance validation)
router.get('/can-bid/:auctionId', authenticateToken, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate minimum bid amount (current price + 1)
    const minimumBid = auction.currentPrice + 1;
    const requiredBalance = minimumBid * 0.20;
    const currencySymbol = auction.currency === 'NGN' ? '₦' : '$';

    const canBid = user.balance >= requiredBalance && auction.isActive() && 
                   auction.seller.toString() !== req.user.userId;

    res.json({
      canBid,
      userBalance: user.balance,
      requiredBalance,
      minimumBid,
      currentPrice: auction.currentPrice,
      currency: auction.currency,
      currencySymbol,
      reasons: !canBid ? [
        user.balance < requiredBalance ? `Insufficient balance. Need ${currencySymbol}${requiredBalance.toFixed(2)}` : null,
        !auction.isActive() ? 'Auction is not active' : null,
        auction.seller.toString() === req.user.userId ? 'Cannot bid on your own auction' : null
      ].filter(Boolean) : []
    });
  } catch (error) {
    console.error('Error checking bid eligibility:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bids for an auction
router.get('/auction/:auctionId', async (req, res) => {
  try {
    const bids = await Bid.find({ auction: req.params.auctionId })
      .populate('bidder', 'username')
      .sort({ timestamp: -1 });

    res.json(bids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's bids
router.get('/user/my-bids', authenticateToken, async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user.userId })
      .populate('auction', 'title currentPrice status endTime')
      .sort({ timestamp: -1 });

    res.json(bids);
  } catch (error) {
    console.error('Error fetching user bids:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get highest bid for an auction
router.get('/auction/:auctionId/highest', async (req, res) => {
  try {
    const highestBid = await Bid.findOne({ auction: req.params.auctionId })
      .populate('bidder', 'username')
      .sort({ amount: -1 });

    res.json(highestBid);
  } catch (error) {
    console.error('Error fetching highest bid:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


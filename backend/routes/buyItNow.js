const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Auction = require('../models/Auction');
const User = require('../models/User');
const Bid = require('../models/Bid');

// Buy It Now route
router.post('/:id/buy-now', authenticateToken, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'username');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (!auction.canBuyItNow()) {
      return res.status(400).json({ 
        message: 'Buy It Now is not available for this auction' 
      });
    }

    if (auction.seller._id.toString() === req.user.userId) {
      return res.status(400).json({ 
        message: 'You cannot buy your own auction' 
      });
    }

    // Check if user has sufficient balance
    const User = require('../models/User');
    const buyer = await User.findById(req.user.userId);
    
    if (!buyer) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (buyer.balance < auction.buyItNowPrice) {
      return res.status(400).json({ 
        message: 'Insufficient balance to buy this item' 
      });
    }

    // Process the purchase
    buyer.balance -= auction.buyItNowPrice;
    await buyer.save();

    // Update auction
    auction.status = 'sold';
    auction.winner = req.user.userId;
    auction.currentPrice = auction.buyItNowPrice;
    auction.soldViaBuyItNow = true;
    await auction.save();

    // Create a bid record for the Buy It Now purchase
    const Bid = require('../models/Bid');
    const buyNowBid = new Bid({
      auction: auction._id,
      bidder: req.user.userId,
      amount: auction.buyItNowPrice,
      currency: auction.currency,
      isBuyItNow: true
    });
    await buyNowBid.save();

    res.json({
      message: 'Item purchased successfully via Buy It Now',
      auction,
      purchasePrice: auction.buyItNowPrice,
      remainingBalance: buyer.balance
    });

  } catch (error) {
    console.error('Error processing Buy It Now:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


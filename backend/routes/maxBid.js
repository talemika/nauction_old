const express = require('express');
const MaxBid = require('../models/MaxBid');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Set or update max bid for an auction
router.post('/:auctionId/max-bid', authenticateToken, async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { maxAmount } = req.body;
    const userId = req.user.userId;

    // Validate max amount
    if (!maxAmount || maxAmount <= 0) {
      return res.status(400).json({ message: 'Max bid amount must be greater than 0' });
    }

    // Check if auction exists and is active
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.status !== 'active') {
      return res.status(400).json({ message: 'Auction is not active' });
    }

    if (new Date() > auction.endTime) {
      return res.status(400).json({ message: 'Auction has ended' });
    }

    // Check if user has sufficient balance (20% of max bid)
    const user = await User.findById(userId);
    const requiredBalance = maxAmount * 0.2;
    
    if (user.balance < requiredBalance) {
      return res.status(400).json({ 
        message: `Insufficient balance. You need at least ${requiredBalance.toFixed(2)} (20% of max bid) to set this max bid.`,
        requiredBalance,
        currentBalance: user.balance
      });
    }

    // Check if max bid is higher than current price + increment
    const bidIncrement = auction.bidIncrement || 1.00;
    const minimumMaxBid = auction.currentPrice + bidIncrement;
    
    if (maxAmount < minimumMaxBid) {
      return res.status(400).json({ 
        message: `Max bid must be at least ${minimumMaxBid.toFixed(2)} (current price + bid increment)`,
        minimumAmount: minimumMaxBid
      });
    }

    // Create or update max bid
    let maxBid = await MaxBid.findOne({ user: userId, auction: auctionId });
    
    if (maxBid) {
      maxBid.maxAmount = maxAmount;
      maxBid.isActive = true;
      await maxBid.save();
    } else {
      maxBid = new MaxBid({
        user: userId,
        auction: auctionId,
        maxAmount,
        isActive: true
      });
      await maxBid.save();
    }

    // Trigger auto-bidding logic
    await processAutoBidding(auctionId);

    res.json({
      message: 'Max bid set successfully',
      maxBid: {
        id: maxBid._id,
        maxAmount: maxBid.maxAmount,
        isActive: maxBid.isActive
      }
    });
  } catch (error) {
    console.error('Set max bid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's max bid for an auction
router.get('/:auctionId/max-bid', authenticateToken, async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user.userId;

    const maxBid = await MaxBid.findOne({ user: userId, auction: auctionId });
    
    if (!maxBid) {
      return res.json({ maxBid: null });
    }

    res.json({
      maxBid: {
        id: maxBid._id,
        maxAmount: maxBid.maxAmount,
        isActive: maxBid.isActive,
        lastAutoBidAmount: maxBid.lastAutoBidAmount,
        autoBidCount: maxBid.autoBidCount
      }
    });
  } catch (error) {
    console.error('Get max bid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel max bid
router.delete('/:auctionId/max-bid', authenticateToken, async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user.userId;

    const maxBid = await MaxBid.findOne({ user: userId, auction: auctionId });
    
    if (!maxBid) {
      return res.status(404).json({ message: 'Max bid not found' });
    }

    maxBid.isActive = false;
    await maxBid.save();

    res.json({ message: 'Max bid cancelled successfully' });
  } catch (error) {
    console.error('Cancel max bid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auto-bidding logic function
async function processAutoBidding(auctionId) {
  try {
    const auction = await Auction.findById(auctionId);
    if (!auction || auction.status !== 'active') return;

    // Get all active max bids for this auction, sorted by max amount (highest first)
    const maxBids = await MaxBid.find({ 
      auction: auctionId, 
      isActive: true 
    }).populate('user').sort({ maxAmount: -1 });

    if (maxBids.length === 0) return;

    const bidIncrement = auction.bidIncrement || 1.00;
    let currentPrice = auction.currentPrice;
    let hasNewBids = false;

    // Get the current highest bidder
    const currentHighestBid = await Bid.findOne({ auction: auctionId }).sort({ amount: -1 });
    const currentHighestBidder = currentHighestBid ? currentHighestBid.bidder.toString() : null;

    // Process auto-bidding for eligible users
    for (const maxBid of maxBids) {
      // Skip if this user is already the highest bidder
      if (currentHighestBidder === maxBid.user._id.toString()) continue;

      // Check if this max bid can place another bid
      if (maxBid.canAutoBid(currentPrice, bidIncrement)) {
        const nextBidAmount = maxBid.getNextBidAmount(currentPrice, bidIncrement);

        // Check user balance (20% requirement)
        const requiredBalance = nextBidAmount * 0.2;
        if (maxBid.user.balance < requiredBalance) {
          // Deactivate max bid if insufficient balance
          maxBid.isActive = false;
          await maxBid.save();
          continue;
        }

        // Place auto bid
        const autoBid = new Bid({
          auction: auctionId,
          bidder: maxBid.user._id,
          amount: nextBidAmount,
          isAutoBid: true
        });

        await autoBid.save();

        // Update auction current price
        auction.currentPrice = nextBidAmount;
        await auction.save();

        // Update max bid tracking
        maxBid.lastAutoBidAmount = nextBidAmount;
        maxBid.autoBidCount += 1;
        await maxBid.save();

        currentPrice = nextBidAmount;
        hasNewBids = true;

        // Update current highest bidder
        currentHighestBidder = maxBid.user._id.toString();

        // If this bid reaches the max amount, deactivate the max bid
        if (nextBidAmount >= maxBid.maxAmount) {
          maxBid.isActive = false;
          await maxBid.save();
        }
      }
    }

    // If there were new bids, trigger another round of auto-bidding
    if (hasNewBids) {
      // Small delay to prevent infinite loops
      setTimeout(() => processAutoBidding(auctionId), 1000);
    }
  } catch (error) {
    console.error('Auto-bidding error:', error);
  }
}

module.exports = router;
module.exports.processAutoBidding = processAutoBidding;


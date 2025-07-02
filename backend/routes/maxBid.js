const express = require('express');
const MaxBid = require('../models/MaxBid');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const User = require('../models/User');
const authenticateToken = require('./auth').authenticateToken;

const router = express.Router();

// Set or update max bid for an auction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { auctionId, maxAmount, currency } = req.body;

    // Validate input
    if (!auctionId || !maxAmount || maxAmount <= 0) {
      return res.status(400).json({ 
        message: 'Auction ID and valid max amount are required' 
      });
    }

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
      return res.status(400).json({ message: 'Cannot set max bid on your own auction' });
    }

    // Use auction's currency if no currency specified
    const bidCurrency = currency || auction.currency;

    // Check if max amount is higher than current price
    if (maxAmount <= auction.currentPrice) {
      const currencySymbol = auction.currency === 'NGN' ? '₦' : '$';
      return res.status(400).json({ 
        message: `Max bid amount must be higher than current price of ${currencySymbol}${auction.currentPrice}` 
      });
    }

    // Get user's current balance
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate required balance (20% of max bid amount)
    const requiredBalance = maxAmount * 0.20;
    const currencySymbol = bidCurrency === 'NGN' ? '₦' : '$';

    // Check if user has sufficient balance
    if (user.balance < requiredBalance) {
      return res.status(400).json({ 
        message: `Insufficient balance. You need at least ${currencySymbol}${requiredBalance.toFixed(2)} (20% of max bid amount) to set this max bid. Your current balance is ${currencySymbol}${user.balance.toFixed(2)}.`,
        code: 'INSUFFICIENT_BALANCE',
        required: requiredBalance,
        current: user.balance,
        percentage: 20
      });
    }

    // Check if user already has an active max bid for this auction
    let existingMaxBid = await MaxBid.findUserMaxBid(auctionId, req.user.userId);

    if (existingMaxBid) {
      // Update existing max bid
      existingMaxBid.maxAmount = maxAmount;
      existingMaxBid.currency = bidCurrency;
      await existingMaxBid.save();
      
      res.json({
        message: 'Max bid updated successfully',
        maxBid: existingMaxBid
      });
    } else {
      // Create new max bid
      const maxBid = new MaxBid({
        auction: auctionId,
        bidder: req.user.userId,
        maxAmount,
        currency: bidCurrency
      });
      await maxBid.save();
      await maxBid.populate('bidder', 'username');

      res.json({
        message: 'Max bid set successfully',
        maxBid
      });
    }

    // Trigger auto-bidding after setting max bid
    setTimeout(() => processAutoBidding(auctionId), 500);

  } catch (error) {
    console.error('Error setting max bid:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's max bid for an auction
router.get('/auction/:auctionId', authenticateToken, async (req, res) => {
  try {
    const maxBid = await MaxBid.findUserMaxBid(req.params.auctionId, req.user.userId);
    
    if (!maxBid) {
      return res.status(404).json({ message: 'No max bid found for this auction' });
    }

    res.json({ maxBid });
  } catch (error) {
    console.error('Error fetching max bid:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all active max bids for an auction (admin only)
router.get('/auction/:auctionId/all', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you might want to add admin middleware here)
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const maxBids = await MaxBid.findActiveForAuction(req.params.auctionId);
    res.json({ maxBids });
  } catch (error) {
    console.error('Error fetching max bids:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel/deactivate max bid
router.delete('/:maxBidId', authenticateToken, async (req, res) => {
  try {
    const maxBid = await MaxBid.findById(req.params.maxBidId);
    
    if (!maxBid) {
      return res.status(404).json({ message: 'Max bid not found' });
    }

    // Check if user owns this max bid
    if (maxBid.bidder.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this max bid' });
    }

    await maxBid.deactivate();
    res.json({ message: 'Max bid cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling max bid:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's all active max bids
router.get('/user/active', authenticateToken, async (req, res) => {
  try {
    const maxBids = await MaxBid.find({ 
      bidder: req.user.userId, 
      isActive: true 
    })
    .populate('auction', 'title currentPrice endTime status')
    .sort({ createdAt: -1 });

    res.json({ maxBids });
  } catch (error) {
    console.error('Error fetching user max bids:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auto-bidding logic function
async function processAutoBidding(auctionId) {
  try {
    console.log(`Processing auto-bidding for auction: ${auctionId}`);
    
    // Get auction details
    const auction = await Auction.findById(auctionId);
    if (!auction || !auction.isActive()) {
      console.log('Auction not found or not active');
      return;
    }

    // Get all active max bids for this auction, sorted by max amount (highest first)
    const maxBids = await MaxBid.findActiveForAuction(auctionId);
    if (maxBids.length === 0) {
      console.log('No active max bids found');
      return;
    }

    // Get current highest bidder
    const currentWinner = auction.winner;
    let autoBidPlaced = false;

    // Process auto-bidding for eligible max bids
    for (const maxBid of maxBids) {
      // Skip if this user is already the current winner
      if (currentWinner && currentWinner.toString() === maxBid.bidder._id.toString()) {
        continue;
      }

      // Check if this max bid can still auto-bid
      if (maxBid.canAutoBid(auction.currentPrice, auction.bidIncrement)) {
        const nextBidAmount = maxBid.getNextAutoBidAmount(auction.currentPrice, auction.bidIncrement);
        
        // Check user's balance
        const user = await User.findById(maxBid.bidder._id);
        const requiredBalance = nextBidAmount * 0.20;
        
        if (user.balance < requiredBalance) {
          console.log(`Insufficient balance for auto-bid by user ${user.username}`);
          continue;
        }

        // Place auto-bid
        const autoBid = new Bid({
          auction: auctionId,
          bidder: maxBid.bidder._id,
          amount: nextBidAmount,
          currency: maxBid.currency,
          isAutoBid: true,
          maxBid: maxBid._id
        });

        await autoBid.save();
        
        // Update max bid tracking
        maxBid.lastAutoBidAmount = nextBidAmount;
        maxBid.autoBidCount += 1;
        await maxBid.save();

        console.log(`Auto-bid placed: ${nextBidAmount} by user ${user.username}`);
        autoBidPlaced = true;
        
        // Update auction current price and winner
        auction.currentPrice = nextBidAmount;
        auction.winner = maxBid.bidder._id;
        await auction.save();

        // Only place one auto-bid per cycle to allow for proper sequencing
        break;
      }
    }

    // If an auto-bid was placed, trigger another round after a short delay
    if (autoBidPlaced) {
      setTimeout(() => processAutoBidding(auctionId), 1000);
    }

  } catch (error) {
    console.error('Error in auto-bidding process:', error);
  }
}

// Export the processAutoBidding function for use in other routes
module.exports = router;
module.exports.processAutoBidding = processAutoBidding;


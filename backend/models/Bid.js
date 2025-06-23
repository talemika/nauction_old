const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['NGN', 'USD'],
    default: 'NGN'
  },
  isBuyItNow: {
    type: Boolean,
    default: false
  },
  isAutoBid: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure bid amount is higher than current price (except for Buy It Now)
bidSchema.pre('save', async function(next) {
  try {
    // Skip validation for Buy It Now purchases
    if (this.isBuyItNow) {
      return next();
    }

    const Auction = mongoose.model('Auction');
    const auction = await Auction.findById(this.auction);
    
    if (!auction) {
      return next(new Error('Auction not found'));
    }
    
    if (!auction.isActive()) {
      return next(new Error('Auction is not active'));
    }
    
    if (this.amount <= auction.currentPrice) {
      return next(new Error('Bid amount must be higher than current price'));
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Update auction current price after successful bid (except Buy It Now)
bidSchema.post('save', async function(doc) {
  try {
    // Skip price update for Buy It Now (handled separately)
    if (doc.isBuyItNow) {
      return;
    }

    const Auction = mongoose.model('Auction');
    await Auction.findByIdAndUpdate(doc.auction, {
      currentPrice: doc.amount,
      winner: doc.bidder
    });
  } catch (error) {
    console.error('Error updating auction price:', error);
  }
});

module.exports = mongoose.model('Bid', bidSchema);


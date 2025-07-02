const mongoose = require('mongoose');

const maxBidSchema = new mongoose.Schema({
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
  maxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['NGN', 'USD'],
    default: 'NGN'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  currentProxyBid: {
    type: Number,
    default: 0
  },
  lastAutoBidAmount: {
    type: Number,
    default: 0
  },
  autoBidCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure one active max bid per user per auction
maxBidSchema.index({ auction: 1, bidder: 1, isActive: 1 }, { 
  unique: true,
  partialFilterExpression: { isActive: true }
});

// Index for efficient queries
maxBidSchema.index({ auction: 1, isActive: 1 });
maxBidSchema.index({ bidder: 1, isActive: 1 });

// Validation: Max bid amount should be higher than current auction price
maxBidSchema.pre('save', async function(next) {
  try {
    if (this.isNew || this.isModified('maxAmount')) {
      const Auction = mongoose.model('Auction');
      const auction = await Auction.findById(this.auction);
      
      if (!auction) {
        return next(new Error('Auction not found'));
      }
      
      if (!auction.isActive()) {
        return next(new Error('Cannot set max bid on inactive auction'));
      }
      
      if (this.maxAmount <= auction.currentPrice) {
        return next(new Error('Max bid amount must be higher than current auction price'));
      }
      
      // Check if user is not the seller
      if (auction.seller.toString() === this.bidder.toString()) {
        return next(new Error('Cannot set max bid on your own auction'));
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if max bid can still auto-bid
maxBidSchema.methods.canAutoBid = function(currentPrice, bidIncrement) {
  if (!this.isActive) return false;
  
  const nextBidAmount = currentPrice + bidIncrement;
  return nextBidAmount <= this.maxAmount;
};

// Method to calculate next auto-bid amount
maxBidSchema.methods.getNextAutoBidAmount = function(currentPrice, bidIncrement) {
  const nextBidAmount = currentPrice + bidIncrement;
  return Math.min(nextBidAmount, this.maxAmount);
};

// Method to deactivate max bid
maxBidSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Static method to find active max bids for an auction
maxBidSchema.statics.findActiveForAuction = function(auctionId) {
  return this.find({ 
    auction: auctionId, 
    isActive: true 
  }).populate('bidder', 'username').sort({ maxAmount: -1 });
};

// Static method to find user's active max bid for an auction
maxBidSchema.statics.findUserMaxBid = function(auctionId, userId) {
  return this.findOne({ 
    auction: auctionId, 
    bidder: userId, 
    isActive: true 
  });
};

module.exports = mongoose.model('MaxBid', maxBidSchema);


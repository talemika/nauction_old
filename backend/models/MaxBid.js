const mongoose = require('mongoose');

const maxBidSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true
  },
  maxAmount: {
    type: Number,
    required: true,
    min: 0.01
  },
  isActive: {
    type: Boolean,
    default: true
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

// Ensure one max bid per user per auction
maxBidSchema.index({ user: 1, auction: 1 }, { unique: true });

// Method to check if max bid can place another bid
maxBidSchema.methods.canAutoBid = function(currentPrice, bidIncrement) {
  if (!this.isActive) return false;
  
  const nextBidAmount = currentPrice + bidIncrement;
  return nextBidAmount <= this.maxAmount;
};

// Method to calculate next auto bid amount
maxBidSchema.methods.getNextBidAmount = function(currentPrice, bidIncrement) {
  const nextBidAmount = currentPrice + bidIncrement;
  return Math.min(nextBidAmount, this.maxAmount);
};

module.exports = mongoose.model('MaxBid', maxBidSchema);


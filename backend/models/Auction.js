const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  startingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    default: function() {
      return this.startingPrice;
    }
  },
  estimatedRetailValue: {
    type: Number,
    min: 0,
    default: null
  },
  buyItNowPrice: {
    type: Number,
    min: 0,
    default: null
  },
  reservePrice: {
    type: Number,
    min: 0,
    default: null
  },
  bidIncrement: {
    type: Number,
    min: 0.01,
    default: 1.00
  },
  auctionType: {
    type: String,
    enum: ['pure_sale', 'reserve_price'],
    default: 'pure_sale'
  },
  currency: {
    type: String,
    enum: ['NGN', 'USD'],
    default: 'NGN'
  },
  media: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    }
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerAgreement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SellerAgreement',
    default: null
  },
  isSellerAgreementComplete: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    trim: true,
    maxlength: 50
  },
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    default: 'good'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  status: {
    type: String,
    enum: ['draft', 'pending_agreement', 'active', 'ended', 'cancelled', 'sold'],
    default: 'draft'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  soldViaBuyItNow: {
    type: Boolean,
    default: false
  },
  reserveMet: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Check if auction is still active
auctionSchema.methods.isActive = function() {
  return this.status === 'active' && new Date() < this.endTime;
};

// Check if reserve price is met
auctionSchema.methods.isReserveMet = function() {
  if (this.auctionType === 'pure_sale') {
    return true; // Pure sale items always "meet reserve"
  }
  if (!this.reservePrice) {
    return true; // No reserve price set
  }
  return this.currentPrice >= this.reservePrice;
};

// Check if Buy It Now is available
auctionSchema.methods.canBuyItNow = function() {
  return this.isActive() && this.buyItNowPrice && this.buyItNowPrice > 0;
};

// Check if auction can go live
auctionSchema.methods.canGoLive = function() {
  return this.isSellerAgreementComplete && this.status === 'pending_agreement';
};

// Update auction status based on end time and reserve
auctionSchema.methods.updateStatus = function() {
  if (this.status === 'active' && new Date() >= this.endTime) {
    if (this.auctionType === 'reserve_price' && !this.isReserveMet()) {
      this.status = 'ended'; // Reserve not met, auction ends without sale
    } else {
      this.status = 'ended'; // Will be marked as sold if there's a winner
      this.reserveMet = this.isReserveMet();
    }
  }
  return this.save();
};

// Validation: Buy It Now price should be higher than starting price
auctionSchema.pre('save', function(next) {
  if (this.buyItNowPrice && this.buyItNowPrice <= this.startingPrice) {
    return next(new Error('Buy It Now price must be higher than starting price'));
  }
  
  if (this.reservePrice && this.reservePrice < this.startingPrice) {
    return next(new Error('Reserve price cannot be lower than starting price'));
  }
  
  next();
});

module.exports = mongoose.model('Auction', auctionSchema);


const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
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
  addedAt: {
    type: Date,
    default: Date.now
  },
  notificationPreferences: {
    bidUpdates: {
      type: Boolean,
      default: true
    },
    priceChanges: {
      type: Boolean,
      default: true
    },
    endingSoon: {
      type: Boolean,
      default: true
    },
    auctionEnded: {
      type: Boolean,
      default: true
    }
  },
  lastNotificationSent: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure user can't add same auction twice
watchlistSchema.index({ user: 1, auction: 1 }, { unique: true });

// Method to check if user should receive notification
watchlistSchema.methods.shouldNotify = function(notificationType) {
  return this.isActive && this.notificationPreferences[notificationType];
};

// Method to update last notification time
watchlistSchema.methods.updateLastNotification = function() {
  this.lastNotificationSent = new Date();
  return this.save();
};

module.exports = mongoose.model('Watchlist', watchlistSchema);


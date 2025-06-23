const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const Auction = require('../models/Auction');
const { authenticateToken } = require('../middleware/auth');

// Add auction to watchlist
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { auctionId } = req.body;
    const userId = req.user.id;

    // Check if auction exists
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Check if already in watchlist
    const existingWatchlist = await Watchlist.findOne({
      user: userId,
      auction: auctionId
    });

    if (existingWatchlist) {
      if (existingWatchlist.isActive) {
        return res.status(400).json({ message: 'Auction already in watchlist' });
      } else {
        // Reactivate if previously removed
        existingWatchlist.isActive = true;
        await existingWatchlist.save();
        return res.json({ 
          message: 'Auction added back to watchlist',
          watchlist: existingWatchlist 
        });
      }
    }

    // Create new watchlist entry
    const watchlistItem = new Watchlist({
      user: userId,
      auction: auctionId
    });

    await watchlistItem.save();
    await watchlistItem.populate('auction', 'title currentPrice endTime status');

    res.status(201).json({
      message: 'Auction added to watchlist',
      watchlist: watchlistItem
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove auction from watchlist
router.delete('/:auctionId', authenticateToken, async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user.id;

    const watchlistItem = await Watchlist.findOne({
      user: userId,
      auction: auctionId,
      isActive: true
    });

    if (!watchlistItem) {
      return res.status(404).json({ message: 'Auction not found in watchlist' });
    }

    watchlistItem.isActive = false;
    await watchlistItem.save();

    res.json({ message: 'Auction removed from watchlist' });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's watchlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const watchlist = await Watchlist.find({
      user: userId,
      isActive: true
    })
    .populate({
      path: 'auction',
      select: 'title description currentPrice startingPrice endTime status media category condition auctionType estimatedRetailValue',
      match: { status: { $ne: 'cancelled' } }
    })
    .sort({ addedAt: -1 })
    .skip(skip)
    .limit(limit);

    // Filter out items where auction was not found (deleted auctions)
    const activeWatchlist = watchlist.filter(item => item.auction);

    const total = await Watchlist.countDocuments({
      user: userId,
      isActive: true
    });

    res.json({
      watchlist: activeWatchlist,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if auction is in user's watchlist
router.get('/check/:auctionId', authenticateToken, async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user.id;

    const watchlistItem = await Watchlist.findOne({
      user: userId,
      auction: auctionId,
      isActive: true
    });

    res.json({ inWatchlist: !!watchlistItem });
  } catch (error) {
    console.error('Error checking watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update notification preferences
router.put('/:auctionId/notifications', authenticateToken, async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user.id;
    const { notificationPreferences } = req.body;

    const watchlistItem = await Watchlist.findOne({
      user: userId,
      auction: auctionId,
      isActive: true
    });

    if (!watchlistItem) {
      return res.status(404).json({ message: 'Auction not found in watchlist' });
    }

    watchlistItem.notificationPreferences = {
      ...watchlistItem.notificationPreferences,
      ...notificationPreferences
    };

    await watchlistItem.save();

    res.json({
      message: 'Notification preferences updated',
      preferences: watchlistItem.notificationPreferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get watchlist statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Watchlist.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'auctions',
          localField: 'auction',
          foreignField: '_id',
          as: 'auctionData'
        }
      },
      {
        $unwind: '$auctionData'
      },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          activeAuctions: {
            $sum: {
              $cond: [{ $eq: ['$auctionData.status', 'active'] }, 1, 0]
            }
          },
          endingSoon: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$auctionData.status', 'active'] },
                    { $lt: ['$auctionData.endTime', new Date(Date.now() + 24 * 60 * 60 * 1000)] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalValue: { $sum: '$auctionData.currentPrice' }
        }
      }
    ]);

    const result = stats[0] || {
      totalItems: 0,
      activeAuctions: 0,
      endingSoon: 0,
      totalValue: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching watchlist stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { Heart, HeartOff, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

const WatchlistButton = ({ auction, className = "" }) => {
  const { isAuthenticated, user } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && auction) {
      checkWatchlistStatus();
    }
  }, [isAuthenticated, auction]);

  const checkWatchlistStatus = async () => {
    try {
      const response = await api.get(`/watchlist/check/${auction._id}`);
      setInWatchlist(response.data.inWatchlist);
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    }
  };

  const toggleWatchlist = async () => {
    if (!isAuthenticated) {
      // Could show a login prompt here
      return;
    }

    setLoading(true);
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${auction._id}`);
        setInWatchlist(false);
      } else {
        await api.post('/watchlist', { auctionId: auction._id });
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Don't show for auction owner
  if (user && auction.seller === user.id) {
    return null;
  }

  return (
    <Button
      variant={inWatchlist ? "default" : "outline"}
      size="sm"
      onClick={toggleWatchlist}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : inWatchlist ? (
        <>
          <Heart className="h-4 w-4 mr-1 fill-current" />
          In Watchlist
        </>
      ) : (
        <>
          <HeartOff className="h-4 w-4 mr-1" />
          Add to Watchlist
        </>
      )}
    </Button>
  );
};

export default WatchlistButton;


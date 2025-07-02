import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { maxBidsAPI } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Loader2, Target, X, ExternalLink, Clock } from 'lucide-react';

const MyMaxBids = () => {
  const [maxBids, setMaxBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMaxBids();
    }
  }, [isAuthenticated]);

  const fetchMaxBids = async () => {
    try {
      setLoading(true);
      const response = await maxBidsAPI.getUserActiveMaxBids();
      setMaxBids(response.data.maxBids);
    } catch (error) {
      console.error('Error fetching max bids:', error);
      setError('Failed to fetch your max bids');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMaxBid = async (maxBidId) => {
    try {
      setCancellingId(maxBidId);
      await maxBidsAPI.cancelMaxBid(maxBidId);
      // Remove the cancelled max bid from the list
      setMaxBids(maxBids.filter(mb => mb._id !== maxBidId));
    } catch (error) {
      console.error('Error cancelling max bid:', error);
      setError('Failed to cancel max bid');
    } finally {
      setCancellingId(null);
    }
  };

  const formatPrice = (amount, currency = 'NGN') => {
    const symbol = currency === 'NGN' ? '₦' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const isAuctionActive = (auction) => {
    return auction.status === 'active' && new Date(auction.endTime) > new Date();
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Please log in to view your max bids.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading your max bids...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Target className="h-6 w-6" />
          <h1 className="text-3xl font-bold">My Auto-Bids</h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {maxBids.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <Target className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No Active Auto-Bids</h3>
                  <p className="text-muted-foreground">
                    You don't have any active auto-bids. Set up auto-bidding on auctions to automatically bid up to your maximum amount.
                  </p>
                </div>
                <Button asChild>
                  <Link to="/">Browse Auctions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {maxBids.map((maxBid) => (
              <Card key={maxBid._id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        <Link 
                          to={`/auction/${maxBid.auction._id}`}
                          className="hover:text-primary transition-colors flex items-center space-x-2"
                        >
                          <span>{maxBid.auction.title}</span>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Ends: {formatDate(maxBid.auction.endTime)}</span>
                        </div>
                        <Badge 
                          variant={isAuctionActive(maxBid.auction) ? "default" : "secondary"}
                        >
                          {maxBid.auction.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelMaxBid(maxBid._id)}
                      disabled={cancellingId === maxBid._id || !isAuctionActive(maxBid.auction)}
                      className="flex items-center space-x-1"
                    >
                      {cancellingId === maxBid._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span>Cancel</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Current Price</p>
                      <p className="font-semibold text-green-600">
                        {formatPrice(maxBid.auction.currentPrice, maxBid.currency)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Your Max Bid</p>
                      <p className="font-semibold text-blue-600">
                        {formatPrice(maxBid.maxAmount, maxBid.currency)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Auto-Bids Placed</p>
                      <p className="font-semibold">
                        {maxBid.autoBidCount}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Last Auto-Bid</p>
                      <p className="font-semibold">
                        {maxBid.lastAutoBidAmount > 0 
                          ? formatPrice(maxBid.lastAutoBidAmount, maxBid.currency)
                          : 'None'
                        }
                      </p>
                    </div>
                  </div>

                  {maxBid.maxAmount <= maxBid.auction.currentPrice && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Max bid reached:</strong> Your maximum bid amount has been reached or exceeded by the current price.
                      </p>
                    </div>
                  )}

                  {!isAuctionActive(maxBid.auction) && (
                    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">
                        This auction has ended. Auto-bidding is no longer active.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyMaxBids;


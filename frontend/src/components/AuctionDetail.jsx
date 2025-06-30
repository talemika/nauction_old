import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Clock, DollarSign, User, Gavel, Loader2 } from 'lucide-react';
import { api, bidsAPI } from '../lib/api';
import { auctionsAPI } from '../lib/api';

const AuctionDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAuctionDetails();
  }, [id]);

  const fetchAuctionDetails = async () => {
    try {
      setLoading(true);
      const response = await auctionsAPI.getById(id);
      setAuction(response.data.auction);
      setBids(response.data.bids || []);
    } catch (err) {
      setError('Failed to fetch auction details');
      console.error('Error fetching auction:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setBidLoading(true);
    setError('');
    setSuccess('');

    try {
      const amount = parseFloat(bidAmount);
      const minimumBid = auction.currentPrice + (auction.bidIncrement || 1.00);
      
      if (amount < minimumBid) {
        setError(`Bid must be at least ${formatPrice(minimumBid)} (current price + ${formatPrice(auction.bidIncrement || 1.00)} increment)`);
        setBidLoading(false);
        return;
      }

      await bidsAPI.placeBid({
        auctionId: auction._id,
        amount: amount,
      });

      setSuccess('Bid placed successfully!');
      setBidAmount('');
      
      // Refresh auction details
      await fetchAuctionDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setBidLoading(false);
    }
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const isAuctionActive = () => {
    return auction?.status === 'active' && new Date() < new Date(auction.endTime);
  };

  const canBid = () => {
    return isAuthenticated && isAuctionActive() && auction?.seller?._id !== user?.id;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading auction details...</div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-destructive">Auction not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Auction Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{auction.title}</h1>
          <Badge variant={auction.status === 'active' ? 'default' : 'secondary'}>
            {auction.status}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4 text-muted-foreground">
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>Seller: {auction.seller?.username}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>Ends: {formatDate(auction.endTime)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media */}
          <Card>
            <CardContent className="p-6">
              {auction.media && auction.media.length > 0 ? (
                <div className="space-y-4">
                  {auction.media.length === 1 ? (
                    <div className="w-full h-96 bg-muted rounded-md overflow-hidden">
                      {auction.media[0].type === 'image' ? (
                        <img 
                          src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${auction.media[0].url}`}
                          alt={auction.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video 
                          src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${auction.media[0].url}`}
                          className="w-full h-full object-cover"
                          controls
                        />
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {auction.media.map((media, index) => (
                        <div key={index} className="w-full h-48 bg-muted rounded-md overflow-hidden">
                          {media.type === 'image' ? (
                            <img 
                              src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${media.url}`}
                              alt={`${auction.title} - ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video 
                              src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${media.url}`}
                              className="w-full h-full object-cover"
                              controls
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-96 bg-muted rounded-md flex items-center justify-center">
                  <div className="text-muted-foreground">No Media Available</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{auction.description}</p>
            </CardContent>
          </Card>

          {/* Auction Details */}
          <Card>
            <CardHeader>
              <CardTitle>Auction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auction Type:</span>
                    <span className="font-medium capitalize">
                      {auction.auctionType?.replace('_', ' ') || 'Pure Sale'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">
                      {auction.category || 'Uncategorized'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Condition:</span>
                    <span className="font-medium capitalize">
                      {auction.condition || 'Good'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {auction.estimatedRetailValue && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated Retail Value:</span>
                      <span className="font-medium">
                        {formatPrice(auction.estimatedRetailValue)}
                      </span>
                    </div>
                  )}
                  
                  {auction.reservePrice && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reserve Price:</span>
                      <span className="font-medium">
                        {formatPrice(auction.reservePrice)}
                      </span>
                    </div>
                  )}
                  
                  {auction.buyItNowPrice && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buy It Now:</span>
                      <span className="font-medium text-green-600">
                        {formatPrice(auction.buyItNowPrice)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bid History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bids</CardTitle>
            </CardHeader>
            <CardContent>
              {bids.length === 0 ? (
                <p className="text-muted-foreground">No bids yet. Be the first to bid!</p>
              ) : (
                <div className="space-y-3">
                  {bids.map((bid, index) => (
                    <div key={bid._id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{bid.bidder?.username}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {index === 0 && (
                            <Badge variant="default">Highest Bid</Badge>
                          )}
                          {bid.isAutoBid && (
                            <Badge variant="secondary" className="text-xs">
                              Auto-Bid
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold text-green-600">
                          {formatPrice(bid.amount)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(bid.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Price & Time */}
          <Card>
            <CardHeader>
              <CardTitle>Auction Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground">Current Price</div>
                <div className="text-3xl font-bold text-green-600">
                  {formatPrice(auction.currentPrice)}
                </div>
              </div>

              <Separator />

              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground">Time Remaining</div>
                <div className="text-xl font-semibold">
                  {formatTimeRemaining(auction.endTime)}
                </div>
              </div>

              <Separator />

              <div className="text-center space-y-1">
                <div className="text-sm text-muted-foreground">Starting Price</div>
                <div className="text-lg">{formatPrice(auction.startingPrice)}</div>
              </div>

              <div className="text-center space-y-1">
                <div className="text-sm text-muted-foreground">Bid Increment</div>
                <div className="text-lg">{formatPrice(auction.bidIncrement || 1.00)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Bidding Form */}
          {canBid() ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gavel className="h-5 w-5" />
                  <span>Place Your Bid</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePlaceBid} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="bidAmount">Bid Amount ($)</Label>
                    <Input
                      id="bidAmount"
                      type="number"
                      step="0.01"
                      min={auction.currentPrice + (auction.bidIncrement || 1.00)}
                      placeholder={`Minimum: $${(auction.currentPrice + (auction.bidIncrement || 1.00)).toFixed(2)}`}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Bid increment: {formatPrice(auction.bidIncrement || 1.00)}
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={bidLoading}>
                    {bidLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Place Bid
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                {!isAuthenticated ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Login to place bids</p>
                    <Button onClick={() => navigate('/login')} className="w-full">
                      Login
                    </Button>
                  </div>
                ) : !isAuctionActive() ? (
                  <p className="text-muted-foreground">This auction has ended</p>
                ) : auction?.seller?._id === user?.id ? (
                  <p className="text-muted-foreground">You cannot bid on your own auction</p>
                ) : (
                  <p className="text-muted-foreground">Bidding not available</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;


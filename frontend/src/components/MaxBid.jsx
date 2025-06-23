import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Loader2, Target, Zap, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';

const MaxBid = ({ auction }) => {
  const { isAuthenticated, user } = useAuth();
  const { formatPrice } = useCurrency();
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [currentMaxBid, setCurrentMaxBid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch current max bid on component mount
  useEffect(() => {
    if (isAuthenticated && auction) {
      fetchCurrentMaxBid();
    }
  }, [isAuthenticated, auction]);

  const fetchCurrentMaxBid = async () => {
    try {
      const response = await api.get(`/auctions/${auction._id}/max-bid`);
      setCurrentMaxBid(response.data.maxBid);
    } catch (error) {
      console.error('Error fetching max bid:', error);
    }
  };

  const handleSetMaxBid = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const amount = parseFloat(maxBidAmount);
      
      if (!amount || amount <= 0) {
        setError('Please enter a valid max bid amount');
        return;
      }

      const response = await api.post(`/auctions/${auction._id}/max-bid`, {
        maxAmount: amount
      });

      setSuccess(response.data.message);
      setMaxBidAmount('');
      await fetchCurrentMaxBid();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set max bid');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMaxBid = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/auctions/${auction._id}/max-bid`);
      setSuccess('Max bid cancelled successfully');
      setCurrentMaxBid(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel max bid');
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

  // Don't show for ended auctions
  if (auction.status !== 'active' || new Date() > new Date(auction.endTime)) {
    return null;
  }

  const bidIncrement = auction.bidIncrement || 1.00;
  const minimumMaxBid = auction.currentPrice + bidIncrement;
  const requiredBalance = maxBidAmount ? (parseFloat(maxBidAmount) * 0.2) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Auto-Bidding</span>
        </CardTitle>
        <CardDescription>
          Set a maximum bid amount and let the system automatically bid for you
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Max Bid Status */}
        {currentMaxBid && currentMaxBid.isActive && (
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Max Bid Active:</span>
                  <Badge variant="default">{formatPrice(currentMaxBid.maxAmount)}</Badge>
                </div>
                {currentMaxBid.autoBidCount > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Auto-bids placed: {currentMaxBid.autoBidCount} | 
                    Last bid: {formatPrice(currentMaxBid.lastAutoBidAmount)}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Max Bid Form */}
        {(!currentMaxBid || !currentMaxBid.isActive) && (
          <form onSubmit={handleSetMaxBid} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxBidAmount">Maximum Bid Amount</Label>
              <Input
                id="maxBidAmount"
                type="number"
                step="0.01"
                min={minimumMaxBid}
                placeholder={`Minimum: ${formatPrice(minimumMaxBid)}`}
                value={maxBidAmount}
                onChange={(e) => setMaxBidAmount(e.target.value)}
                required
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Minimum max bid: {formatPrice(minimumMaxBid)}</p>
                <p>• Required balance (20%): {formatPrice(requiredBalance)}</p>
                <p>• Current balance: {formatPrice(user?.balance || 0)}</p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set Max Bid
            </Button>
          </form>
        )}

        {/* Cancel Max Bid */}
        {currentMaxBid && currentMaxBid.isActive && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleCancelMaxBid}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel Auto-Bidding
          </Button>
        )}

        {/* How Auto-Bidding Works */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p className="font-medium">How Auto-Bidding Works:</p>
          <p>• System automatically bids the minimum amount needed to stay ahead</p>
          <p>• Stops when your max bid amount is reached</p>
          <p>• Requires 20% of max bid amount in your balance</p>
          <p>• You can cancel anytime before auction ends</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaxBid;


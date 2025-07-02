import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { maxBidsAPI } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Loader2, Target, X, CheckCircle, AlertCircle } from 'lucide-react';

const MaxBidComponent = ({ auction, onMaxBidUpdate }) => {
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [currentMaxBid, setCurrentMaxBid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetchingMaxBid, setFetchingMaxBid] = useState(true);

  const { user, isAuthenticated } = useAuth();

  // Fetch user's current max bid for this auction
  useEffect(() => {
    if (isAuthenticated && auction?._id) {
      fetchCurrentMaxBid();
    }
  }, [isAuthenticated, auction?._id]);

  const fetchCurrentMaxBid = async () => {
    try {
      setFetchingMaxBid(true);
      const response = await maxBidsAPI.getUserMaxBid(auction._id);
      setCurrentMaxBid(response.data.maxBid);
      setMaxBidAmount(response.data.maxBid.maxAmount.toString());
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching max bid:', error);
      }
      setCurrentMaxBid(null);
    } finally {
      setFetchingMaxBid(false);
    }
  };

  const handleSetMaxBid = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const amount = parseFloat(maxBidAmount);
      
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (amount <= auction.currentPrice) {
        setError(`Max bid must be higher than current price of ${auction.currency === 'NGN' ? '₦' : '$'}${auction.currentPrice}`);
        return;
      }

      const maxBidData = {
        auctionId: auction._id,
        maxAmount: amount,
        currency: auction.currency
      };

      const response = await maxBidsAPI.setMaxBid(maxBidData);
      setCurrentMaxBid(response.data.maxBid);
      setSuccess(currentMaxBid ? 'Max bid updated successfully!' : 'Max bid set successfully!');
      
      // Notify parent component
      if (onMaxBidUpdate) {
        onMaxBidUpdate(response.data.maxBid);
      }
    } catch (error) {
      console.error('Error setting max bid:', error);
      setError(error.response?.data?.message || 'Failed to set max bid');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMaxBid = async () => {
    if (!currentMaxBid) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await maxBidsAPI.cancelMaxBid(currentMaxBid._id);
      setCurrentMaxBid(null);
      setMaxBidAmount('');
      setSuccess('Max bid cancelled successfully!');
      
      // Notify parent component
      if (onMaxBidUpdate) {
        onMaxBidUpdate(null);
      }
    } catch (error) {
      console.error('Error cancelling max bid:', error);
      setError(error.response?.data?.message || 'Failed to cancel max bid');
    } finally {
      setLoading(false);
    }
  };

  // Don't show if user is not authenticated or is the seller
  if (!isAuthenticated || auction?.seller?._id === user?.id || auction?.seller === user?.id) {
    return null;
  }

  // Don't show if auction is not active
  if (auction?.status !== 'active') {
    return null;
  }

  if (fetchingMaxBid) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading max bid...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Auto-Bidding</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentMaxBid && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Auto-bidding Active</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Max bid: {auction.currency === 'NGN' ? '₦' : '$'}{currentMaxBid.maxAmount.toLocaleString()}
                </p>
                {currentMaxBid.autoBidCount > 0 && (
                  <p className="text-xs text-gray-500">
                    Auto-bids placed: {currentMaxBid.autoBidCount}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxBidAmount">
              {currentMaxBid ? 'Update Max Bid Amount' : 'Set Max Bid Amount'}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {auction.currency === 'NGN' ? '₦' : '$'}
              </span>
              <Input
                id="maxBidAmount"
                type="number"
                value={maxBidAmount}
                onChange={(e) => setMaxBidAmount(e.target.value)}
                placeholder="Enter maximum bid amount"
                className="pl-8"
                min={auction.currentPrice + 1}
                step="0.01"
              />
            </div>
            <p className="text-xs text-gray-500">
              Minimum: {auction.currency === 'NGN' ? '₦' : '$'}{(auction.currentPrice + auction.bidIncrement).toLocaleString()}
            </p>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">How Auto-Bidding Works:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• We'll automatically bid for you when others bid</li>
                  <li>• Bids increase by the minimum increment ({auction.currency === 'NGN' ? '₦' : '$'}{auction.bidIncrement})</li>
                  <li>• Auto-bidding stops when your max amount is reached</li>
                  <li>• You need 20% of your max bid in your account balance</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handleSetMaxBid}
              disabled={loading || !maxBidAmount}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentMaxBid ? 'Update Max Bid' : 'Set Max Bid'}
            </Button>
            
            {currentMaxBid && (
              <Button
                variant="outline"
                onClick={handleCancelMaxBid}
                disabled={loading}
                className="flex items-center space-x-1"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaxBidComponent;


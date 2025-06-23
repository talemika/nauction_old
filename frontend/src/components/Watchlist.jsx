import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Heart, 
  HeartOff, 
  Clock, 
  DollarSign, 
  Eye, 
  Trash2, 
  Settings,
  Bell,
  BellOff,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

const Watchlist = () => {
  const { isAuthenticated, user } = useAuth();
  const { formatPrice } = useCurrency();
  const [watchlist, setWatchlist] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchlist();
      fetchStats();
    }
  }, [isAuthenticated]);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const response = await api.get('/watchlist');
      setWatchlist(response.data.watchlist);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/watchlist/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching watchlist stats:', error);
    }
  };

  const removeFromWatchlist = async (auctionId) => {
    try {
      setActionLoading(prev => ({ ...prev, [auctionId]: true }));
      await api.delete(`/watchlist/${auctionId}`);
      setWatchlist(prev => prev.filter(item => item.auction._id !== auctionId));
      await fetchStats();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      setError('Failed to remove item from watchlist');
    } finally {
      setActionLoading(prev => ({ ...prev, [auctionId]: false }));
    }
  };

  const updateNotificationPreferences = async (auctionId, preferences) => {
    try {
      setActionLoading(prev => ({ ...prev, [`${auctionId}_notifications`]: true }));
      await api.put(`/watchlist/${auctionId}/notifications`, {
        notificationPreferences: preferences
      });
      
      setWatchlist(prev => prev.map(item => 
        item.auction._id === auctionId 
          ? { ...item, notificationPreferences: { ...item.notificationPreferences, ...preferences } }
          : item
      ));
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      setError('Failed to update notification preferences');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${auctionId}_notifications`]: false }));
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

  const getStatusBadge = (auction) => {
    const now = new Date();
    const endTime = new Date(auction.endTime);
    
    if (auction.status === 'ended') {
      return <Badge variant="secondary">Ended</Badge>;
    }
    
    if (endTime <= now) {
      return <Badge variant="destructive">Ended</Badge>;
    }
    
    const timeLeft = endTime - now;
    const hoursLeft = timeLeft / (1000 * 60 * 60);
    
    if (hoursLeft <= 24) {
      return <Badge variant="destructive">Ending Soon</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to view your watchlist
            </p>
            <Link to="/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading watchlist...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Watchlist</h1>
            <p className="text-muted-foreground">
              Keep track of auctions you're interested in
            </p>
          </div>
          <Heart className="h-8 w-8 text-red-500" />
        </div>

        {/* Stats */}
        {stats.totalItems > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.totalItems}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.activeAuctions}</div>
                <div className="text-sm text-muted-foreground">Active Auctions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{stats.endingSoon}</div>
                <div className="text-sm text-muted-foreground">Ending Soon</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{formatPrice(stats.totalValue)}</div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Watchlist Items */}
        {watchlist.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
              <p className="text-muted-foreground mb-4">
                Start adding auctions to your watchlist to keep track of items you're interested in
              </p>
              <Link to="/">
                <Button>Browse Auctions</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((item) => (
              <Card key={item._id} className="overflow-hidden">
                <div className="relative">
                  {item.auction.media && item.auction.media.length > 0 ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${item.auction.media[0].url}`}
                      alt={item.auction.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(item.auction)}
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {item.auction.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {item.auction.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price and Time */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Price:</span>
                      <span className="font-semibold text-green-600">
                        {formatPrice(item.auction.currentPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Time Left:</span>
                      <span className="font-medium">
                        {formatTimeRemaining(item.auction.endTime)}
                      </span>
                    </div>
                  </div>

                  {/* Auction Details */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="capitalize">
                        {item.auction.auctionType?.replace('_', ' ') || 'Pure Sale'}
                      </span>
                    </div>
                    {item.auction.category && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span>{item.auction.category}</span>
                      </div>
                    )}
                    {item.auction.condition && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Condition:</span>
                        <span className="capitalize">{item.auction.condition}</span>
                      </div>
                    )}
                  </div>

                  {/* Notification Preferences */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Notifications:</span>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateNotificationPreferences(item.auction._id, {
                          bidUpdates: !item.notificationPreferences?.bidUpdates
                        })}
                        disabled={actionLoading[`${item.auction._id}_notifications`]}
                      >
                        {item.notificationPreferences?.bidUpdates ? (
                          <Bell className="h-3 w-3" />
                        ) : (
                          <BellOff className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link to={`/auction/${item.auction._id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFromWatchlist(item.auction._id)}
                      disabled={actionLoading[item.auction._id]}
                    >
                      {actionLoading[item.auction._id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;


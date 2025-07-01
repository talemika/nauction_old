import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useCurrency } from '../hooks/useCurrency';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, DollarSign, User } from 'lucide-react';

const Home = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { displayAmount } = useCurrency();

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auctions');
      setAuctions(response.data.auctions || []);
    } catch (err) {
      setError('Failed to fetch auctions');
      console.error('Error fetching auctions:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading auctions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Welcome to Auction House</h1>
        <p className="text-lg text-muted-foreground">
          Discover amazing items and place your bids on active auctions
        </p>
      </div>

      {/* Active Auctions */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Active Auctions</h2>
        
        {auctions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No active auctions at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <Card key={auction._id} className="overflow-hidden">
                <div className="relative">
                  {auction.media && auction.media.length > 0 ? (
                    <img 
                      src={`${process.env.NODE_ENV === 'production' 
                        ? 'https://5000-ikh7t640hxicw0sx0ks08-287ac3c4.manusvm.computer' 
                        : 'http://localhost:5000'}${auction.media[0].url}`}
                      alt={auction.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No Image</span>
                    </div>
                  )}
                  <Badge 
                    variant={auction.status === 'active' ? 'default' : 'secondary'}
                    className="absolute top-2 right-2"
                  >
                    {auction.status}
                  </Badge>
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">{auction.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground line-clamp-2">{auction.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Price:</span>
                      <span className="font-semibold text-green-600">
                        {displayAmount(auction.currentPrice)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Time Left:</span>
                      <span className="font-medium">{formatTimeRemaining(auction.endTime)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Seller:</span>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span className="text-sm">{auction.seller?.username}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Link to={`/auction/${auction._id}`} className="w-full">
                    <Button className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;


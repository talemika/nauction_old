  const checkBidEligibility = async () => {
    if (!auction || !isAuthenticated) return;
    
    try {
      setBalanceLoading(true);
      const response = await fetch(`/api/bids/can-bid/${auction._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setBalanceInfo(data);
    } catch (err) {
      console.error('Error checking bid eligibility:', err);
    } finally {
      setBalanceLoading(false);
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
      
      if (amount <= auction.currentPrice) {
        setError(`Bid must be higher than current price of $${auction.currentPrice}`);
        setBidLoading(false);
        return;
      }

      await bidsAPI.placeBid({
        auctionId: auction._id,
        amount: amount,
      });

      setSuccess('Bid placed successfully!');
      setBidAmount('');
      
      // Refresh auction details and balance info
      await fetchAuctionDetails();
      await checkBidEligibility();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to place bid';
      setError(errorMessage);
      
      // If it's a balance error, refresh balance info
      if (err.response?.data?.code === 'INSUFFICIENT_BALANCE') {
        await checkBidEligibility();
      }
    } finally {
      setBidLoading(false);
    }
  };

  const handleTopUp = () => {
    navigate('/profile');
  };


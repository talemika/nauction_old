import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  Gavel, 
  AlertTriangle, 
  Clock, 
  Wallet, 
  CheckCircle,
  Info
} from 'lucide-react';

const BiddingTermsPopup = ({ isOpen, onClose, onAccept, auctionItem }) => {
  const [termsAccepted, setTermsAccepted] = useState({
    balanceRequirement: false,
    paymentTimeline: false,
    forfeitPenalty: false,
    bindingBid: false,
    pickupResponsibility: false
  });

  const [error, setError] = useState('');

  const handleTermChange = (termKey, checked) => {
    setTermsAccepted(prev => ({
      ...prev,
      [termKey]: checked
    }));
    setError('');
  };

  const areAllTermsAccepted = () => {
    return Object.values(termsAccepted).every(term => term === true);
  };

  const handleAccept = () => {
    if (!areAllTermsAccepted()) {
      setError('Please accept all terms and conditions to proceed with bidding.');
      return;
    }
    
    onAccept();
    onClose();
    
    // Reset for next time
    setTermsAccepted({
      balanceRequirement: false,
      paymentTimeline: false,
      forfeitPenalty: false,
      bindingBid: false,
      pickupResponsibility: false
    });
    setError('');
  };

  const handleClose = () => {
    onClose();
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Bidding Terms & Conditions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {auctionItem && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-1">Auction Item:</h3>
              <p className="text-blue-700">{auctionItem.title}</p>
              <p className="text-sm text-blue-600 mt-1">
                Current Price: {auctionItem.currentPrice} {auctionItem.currency}
              </p>
            </div>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Please read and accept all terms below before placing your bid. All bids are legally binding.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="balanceRequirement"
                checked={termsAccepted.balanceRequirement}
                onCheckedChange={(checked) => handleTermChange('balanceRequirement', checked)}
              />
              <div className="flex-1">
                <Label htmlFor="balanceRequirement" className="text-sm font-medium flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  Balance Requirement
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  I understand that I must maintain at least 20% of the current bid price in my account balance to place and maintain bids on this item.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start space-x-3">
              <Checkbox
                id="paymentTimeline"
                checked={termsAccepted.paymentTimeline}
                onCheckedChange={(checked) => handleTermChange('paymentTimeline', checked)}
              />
              <div className="flex-1">
                <Label htmlFor="paymentTimeline" className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Payment Timeline
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  I agree to pay the remaining balance (80%) within 3 business days if I win this auction. Failure to pay within this timeframe will result in penalties.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start space-x-3">
              <Checkbox
                id="forfeitPenalty"
                checked={termsAccepted.forfeitPenalty}
                onCheckedChange={(checked) => handleTermChange('forfeitPenalty', checked)}
              />
              <div className="flex-1">
                <Label htmlFor="forfeitPenalty" className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Forfeit Penalty
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  I understand that if I fail to complete payment within 3 business days, I will forfeit 10% of the final bid amount, which will be automatically deducted from my account balance.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start space-x-3">
              <Checkbox
                id="bindingBid"
                checked={termsAccepted.bindingBid}
                onCheckedChange={(checked) => handleTermChange('bindingBid', checked)}
              />
              <div className="flex-1">
                <Label htmlFor="bindingBid" className="text-sm font-medium flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-purple-600" />
                  Binding Commitment
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  I acknowledge that all bids are legally binding commitments to purchase. I cannot retract my bid once placed and must complete the purchase if I win.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start space-x-3">
              <Checkbox
                id="pickupResponsibility"
                checked={termsAccepted.pickupResponsibility}
                onCheckedChange={(checked) => handleTermChange('pickupResponsibility', checked)}
              />
              <div className="flex-1">
                <Label htmlFor="pickupResponsibility" className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Pickup & Communication
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  I agree to respond promptly to pickup notifications and arrange item collection within the specified timeframe. I understand I will be contacted via email or WhatsApp.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Final Reminder</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  By accepting these terms, you are making a legal commitment to purchase this item if you win the auction. Please ensure you have sufficient funds and genuine intent to complete the purchase.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAccept}
              disabled={!areAllTermsAccepted()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Accept Terms & Continue Bidding
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BiddingTermsPopup;


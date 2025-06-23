import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Gavel, 
  Wallet, 
  CreditCard, 
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Info,
  Phone,
  Clock,
  Camera,
  FileText,
  Package,
  Users
} from 'lucide-react';

const BiddingInfo = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Bidding & Buying Guide</h1>
        <p className="text-muted-foreground">
          Everything you need to know about bidding and purchasing items on our auction platform
        </p>
      </div>

      {/* Bidding and Buying Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Bidding and Buying
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> You must have at least 20% of the current bid price of an item as your account balance before you are able to bid.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Balance Requirement</h4>
                <p className="text-sm text-muted-foreground">
                  Before placing any bid, ensure your account balance is at least 20% of the current item price.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium">Payment Timeline</h4>
                <p className="text-sm text-muted-foreground">
                  Payment of balance for all winning bids is due within 3 business days, otherwise you will be charged a forfeit fee of 10% of the winning bid amount which will be deducted from your account balance.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium">Payment Failure Penalty</h4>
                <p className="text-sm text-muted-foreground">
                  If you win a bid and are not able to pay the remaining 80%, you will forfeit 10% of the final bid amount. This will be automatically subtracted from your account balance.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Winning Bid Notification</h4>
                <p className="text-sm text-muted-foreground">
                  If you have the winning bid, you will be alerted by email or WhatsApp with next steps for making payment and picking up the items.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">Buy It Now Option</h4>
                <p className="text-sm text-muted-foreground">
                  Where available, you can use the "Buy It Now" price to purchase an item immediately without waiting for the auction to end.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seller Listing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            For Individuals Who Want to List Items for Auction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              To list an item for auction, please send us the following details:
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Item Details</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete name and description of the item</li>
                  <li>• Age of the item</li>
                  <li>• Condition (new, like new, good, fairly used, poor, needs repairs)</li>
                  <li>• For electronics/automobiles: working condition (perfect, some functionality, not working, scrap)</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Camera className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Visual Documentation</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• At least 10 clear pictures from all angles (high quality camera)</li>
                  <li>• At least one video showing all angles of the product</li>
                  <li>• For electronics/automobiles: video showing working condition</li>
                  <li>• Picture of receipt (if available)</li>
                  <li>• Send via email or WhatsApp</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">Estimated Retail Value</h4>
                <p className="text-sm text-muted-foreground">
                  Please provide an estimated retail value for your item. This helps bidders understand the item's market worth.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Listing Process</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Since auction listings can only be created by admins, our team will create the actual listing on your behalf after reviewing your submission.
            </p>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Once your item is approved, you'll receive an agreement link to complete the seller terms and conditions before your auction goes live.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Account Balance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Account Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              Before bidding on items, you must have an account balance that is equal to at least 20% of the current price of the item that you intend to bid on.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">How to Top Up Your Balance</h4>
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h5 className="font-medium">Online Top-Up</h5>
                    <p className="text-sm text-muted-foreground">
                      Use the "Add Money to My Balance" button in your profile to top up instantly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h5 className="font-medium">Bank Transfer</h5>
                    <p className="text-sm text-muted-foreground">
                      Transfer the amount to our bank account. After making the transfer, send a receipt via WhatsApp or email so we can validate and add it to your balance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Contact Information</h4>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <span className="text-sm">WhatsApp: Send receipt and balance requests</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Email: Send receipt and balance requests</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bidding Process Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Bidding Process
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">1</Badge>
                <div>
                  <h4 className="font-medium">Check Your Balance</h4>
                  <p className="text-sm text-muted-foreground">Ensure you have at least 20% of the item's current price</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">2</Badge>
                <div>
                  <h4 className="font-medium">Place Your Bid</h4>
                  <p className="text-sm text-muted-foreground">Enter an amount higher than the current bid</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">3</Badge>
                <div>
                  <h4 className="font-medium">Monitor the Auction</h4>
                  <p className="text-sm text-muted-foreground">Keep track of other bids until the auction ends</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">4</Badge>
                <div>
                  <h4 className="font-medium">Win & Pay</h4>
                  <p className="text-sm text-muted-foreground">If you win, complete payment and arrange pickup</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-800">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-orange-600">•</span>
              <span>All bids are binding. Make sure you can complete the purchase before bidding.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600">•</span>
              <span>Balance requirements are checked in real-time before each bid.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600">•</span>
              <span>Payment failure penalties are automatically deducted from your account balance.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600">•</span>
              <span>Contact support immediately if you have any issues with payments or pickups.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default BiddingInfo;


import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { 
  FileText, 
  User, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle,
  Mail,
  Phone
} from 'lucide-react';
import api from '../lib/api';

const SellerAgreement = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    homeAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    bankAccount: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      routingNumber: ''
    },
    agreements: {
      ownershipCertification: false,
      liabilityAcceptance: false,
      platformAuthorization: false,
      reservePriceFlexibility: false,
      itemHandover: false,
      commissionAcceptance: false,
      paymentTerms: false,
      relistingTerms: false
    }
  });

  useEffect(() => {
    fetchAgreement();
  }, [id, token]);

  const fetchAgreement = async () => {
    try {
      const response = await api.get(`/seller-agreements/${id}?token=${token}`);
      setAgreement(response.data.agreement);
      
      // Pre-fill form if data exists
      if (response.data.agreement.firstName) {
        setFormData(response.data.agreement);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching agreement:', error);
      setError('Failed to load seller agreement. Please check your link.');
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAgreementChange = (agreementKey, checked) => {
    setFormData(prev => ({
      ...prev,
      agreements: {
        ...prev.agreements,
        [agreementKey]: checked
      }
    }));
  };

  const areAllAgreementsChecked = () => {
    return Object.values(formData.agreements).every(agreement => agreement === true);
  };

  const isFormValid = () => {
    return (
      formData.firstName &&
      formData.lastName &&
      formData.email &&
      formData.phoneNumber &&
      formData.homeAddress.street &&
      formData.homeAddress.city &&
      formData.homeAddress.state &&
      formData.homeAddress.zipCode &&
      formData.homeAddress.country &&
      formData.bankAccount.accountName &&
      formData.bankAccount.accountNumber &&
      formData.bankAccount.bankName &&
      areAllAgreementsChecked()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('Please fill in all required fields and accept all terms.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.put(`/seller-agreements/${id}/submit?token=${token}`, formData);
      setSuccess(true);
    } catch (error) {
      console.error('Error submitting agreement:', error);
      setError('Failed to submit agreement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading seller agreement...</p>
        </div>
      </div>
    );
  }

  if (error && !agreement) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (success || agreement?.isComplete) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold text-green-800">Agreement Completed!</h2>
              <p className="text-green-700">
                Thank you for completing the seller agreement. Your auction listing is now live and available for bidding.
              </p>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">Auction Details:</h3>
                <p className="text-sm text-green-700">{agreement?.auction?.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Seller Agreement</h1>
        <p className="text-muted-foreground">
          Complete this agreement to list your item for auction
        </p>
        {agreement?.auction && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800">Auction Item:</h3>
            <p className="text-blue-700">{agreement.auction.title}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Home Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Home Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                value={formData.homeAddress.street}
                onChange={(e) => handleInputChange('homeAddress.street', e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.homeAddress.city}
                  onChange={(e) => handleInputChange('homeAddress.city', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.homeAddress.state}
                  onChange={(e) => handleInputChange('homeAddress.state', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="zipCode">Zip Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.homeAddress.zipCode}
                  onChange={(e) => handleInputChange('homeAddress.zipCode', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.homeAddress.country}
                  onChange={(e) => handleInputChange('homeAddress.country', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  value={formData.bankAccount.accountName}
                  onChange={(e) => handleInputChange('bankAccount.accountName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  value={formData.bankAccount.accountNumber}
                  onChange={(e) => handleInputChange('bankAccount.accountNumber', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={formData.bankAccount.bankName}
                  onChange={(e) => handleInputChange('bankAccount.bankName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input
                  id="routingNumber"
                  value={formData.bankAccount.routingNumber}
                  onChange={(e) => handleInputChange('bankAccount.routingNumber', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Terms and Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Please read and accept all terms and conditions below:
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="ownershipCertification"
                  checked={formData.agreements.ownershipCertification}
                  onCheckedChange={(checked) => handleAgreementChange('ownershipCertification', checked)}
                />
                <Label htmlFor="ownershipCertification" className="text-sm leading-relaxed">
                  I certify that I am the true owner of the item or that I have the authority from the true owner of the item to list it on the auction site for sale.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="liabilityAcceptance"
                  checked={formData.agreements.liabilityAcceptance}
                  onCheckedChange={(checked) => handleAgreementChange('liabilityAcceptance', checked)}
                />
                <Label htmlFor="liabilityAcceptance" className="text-sm leading-relaxed">
                  We shall not be held liable for listing of items that have been stolen or that are not authorized to be sold. I accept full liability for this listing.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="platformAuthorization"
                  checked={formData.agreements.platformAuthorization}
                  onCheckedChange={(checked) => handleAgreementChange('platformAuthorization', checked)}
                />
                <Label htmlFor="platformAuthorization" className="text-sm leading-relaxed">
                  I authorize the listing of the item on your platform to be sold through an auction.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="reservePriceFlexibility"
                  checked={formData.agreements.reservePriceFlexibility}
                  onCheckedChange={(checked) => handleAgreementChange('reservePriceFlexibility', checked)}
                />
                <Label htmlFor="reservePriceFlexibility" className="text-sm leading-relaxed">
                  If a reserve price is set and bidding for the item does not get to the reserve price, I have the option to authorize you to sell the item at the highest bid price.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="itemHandover"
                  checked={formData.agreements.itemHandover}
                  onCheckedChange={(checked) => handleAgreementChange('itemHandover', checked)}
                />
                <Label htmlFor="itemHandover" className="text-sm leading-relaxed">
                  Item to be sold must be handed over to you prior to the auction start date.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="commissionAcceptance"
                  checked={formData.agreements.commissionAcceptance}
                  onCheckedChange={(checked) => handleAgreementChange('commissionAcceptance', checked)}
                />
                <Label htmlFor="commissionAcceptance" className="text-sm leading-relaxed">
                  Once an item is sold, 5% of the sale price will be due to you as commission for sale of the item. This will be deducted from the amount paid by the buyer and the balance will be sent to my designated bank account.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="paymentTerms"
                  checked={formData.agreements.paymentTerms}
                  onCheckedChange={(checked) => handleAgreementChange('paymentTerms', checked)}
                />
                <Label htmlFor="paymentTerms" className="text-sm leading-relaxed">
                  Once an item sells, the sale amount (minus 5% commission) will be sent to me within 5 business days of the sale of the item provided that the buyer follows through on payment for the item (within 3 business days).
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="relistingTerms"
                  checked={formData.agreements.relistingTerms}
                  onCheckedChange={(checked) => handleAgreementChange('relistingTerms', checked)}
                />
                <Label htmlFor="relistingTerms" className="text-sm leading-relaxed">
                  If the buyer does not follow through on final payment, then the item will be relisted within 4 business days at no additional cost to me.
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={!isFormValid() || submitting}
            className="px-8 py-2"
          >
            {submitting ? 'Submitting...' : 'Submit Agreement'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SellerAgreement;


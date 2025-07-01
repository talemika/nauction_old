import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auctionsAPI, api } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Plus } from 'lucide-react';

const CreateAuction = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingPrice: '',
    buyItNowPrice: '',
    reservePrice: '',
    bidIncrement: '1.00',
    currency: 'NGN',
    startTime: '',
    endTime: '',
    duration: '24',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or not admin
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return [];

    setUploading(true);
    const uploadedFiles = [];

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/upload/single', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        uploadedFiles.push({
          url: response.data.file.url,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          filename: response.data.file.filename,
          originalName: response.data.file.originalName,
        });
      }

      setUploadedMedia(uploadedFiles);
      return uploadedFiles;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload files');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.title || !formData.description || !formData.startingPrice) {
        setError('Please fill in all required fields');
        return;
      }

      if (parseFloat(formData.startingPrice) <= 0) {
        setError('Starting price must be greater than 0');
        return;
      }

      if (formData.buyItNowPrice && parseFloat(formData.buyItNowPrice) <= parseFloat(formData.startingPrice)) {
        setError('Buy It Now price must be higher than starting price');
        return;
      }

      if (formData.reservePrice && parseFloat(formData.reservePrice) < parseFloat(formData.startingPrice)) {
        setError('Reserve price cannot be lower than starting price');
        return;
      }

      if (parseFloat(formData.bidIncrement) <= 0) {
        setError('Bid increment must be greater than 0');
        return;
      }

      // Upload files if any
      let mediaData = uploadedMedia;
      if (selectedFiles.length > 0 && uploadedMedia.length === 0) {
        mediaData = await uploadFiles();
        if (!mediaData) {
          return; // Upload failed, error already set
        }
      }

      const auctionData = {
        title: formData.title,
        description: formData.description,
        startingPrice: parseFloat(formData.startingPrice),
        buyItNowPrice: formData.buyItNowPrice ? parseFloat(formData.buyItNowPrice) : null,
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
        bidIncrement: parseFloat(formData.bidIncrement),
        currency: formData.currency,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        duration: formData.endTime ? undefined : parseInt(formData.duration),
        media: mediaData,
      };

      const response = await auctionsAPI.create(auctionData);
      
      // Redirect to the created auction
      navigate(`/auction/${response.data.auction._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (user && user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can create auctions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Auction</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  required
                  maxLength={100}
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter auction title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  maxLength={1000}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the item being auctioned"
                  rows={4}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startingPrice">Starting Price *</Label>
                  <Input
                    id="startingPrice"
                    name="startingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.startingPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency *</Label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="NGN">Nigerian Naira (NGN)</option>
                    <option value="USD">US Dollar (USD)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="buyItNowPrice">Buy It Now Price (optional)</Label>
                  <Input
                    id="buyItNowPrice"
                    name="buyItNowPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.buyItNowPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow buyers to purchase immediately at this price
                  </p>
                </div>

                <div>
                  <Label htmlFor="reservePrice">Reserve Price (optional)</Label>
                  <Input
                    id="reservePrice"
                    name="reservePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.reservePrice}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum price you'll accept for this item
                  </p>
                </div>

                <div>
                  <Label htmlFor="bidIncrement">Bid Increment *</Label>
                  <Input
                    id="bidIncrement"
                    name="bidIncrement"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.bidIncrement}
                    onChange={handleChange}
                    placeholder="1.00"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum amount each bid must increase
                  </p>
                </div>
              </div>
            </div>

            {/* Timing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Auction Timing</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time (optional)</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Leave empty to start immediately
                  </p>
                </div>

                <div>
                  <Label htmlFor="endTime">End Time (optional)</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="24"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Used if no end time specified
                  </p>
                </div>
              </div>
            </div>

            {/* Media Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Media</h3>
              
              <div>
                <Label htmlFor="media">Upload Images/Videos</Label>
                <Input
                  id="media"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Select multiple images or videos to showcase your item
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Selected files:</p>
                  <ul className="text-sm text-muted-foreground">
                    {selectedFiles.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {uploadedMedia.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-green-600">Uploaded files:</p>
                  <ul className="text-sm text-muted-foreground">
                    {uploadedMedia.map((media, index) => (
                      <li key={index}>{media.originalName}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={loading || uploading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Auction...
                  </>
                ) : uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading Files...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Auction
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/')}
                disabled={loading || uploading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAuction;


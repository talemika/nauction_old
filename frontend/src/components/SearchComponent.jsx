import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

const SearchComponent = ({ onSearch, initialFilters = {} }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    currency: '',
    hasReserve: '',
    hasBuyItNow: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters
  });

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle search submission
  const handleSearch = () => {
    onSearch(filters);
  };

  // Handle clear filters
  const handleClear = () => {
    const clearedFilters = {
      search: '',
      minPrice: '',
      maxPrice: '',
      currency: '',
      hasReserve: '',
      hasBuyItNow: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  // Handle Enter key press in search input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Remove auto-search to prevent infinite loops
  // Users will need to click Search button or press Enter

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search & Filter Auctions</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1"
          >
            <Filter className="h-4 w-4" />
            <span>{isExpanded ? 'Less' : 'More'} Filters</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search auctions by title or description..."
              value={filters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
            />
          </div>
          <Button onClick={handleSearch} className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </Button>
          <Button variant="outline" onClick={handleClear} className="flex items-center space-x-2">
            <X className="h-4 w-4" />
            <span>Clear</span>
          </Button>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Price Range */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Price Range</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={(e) => handleInputChange('minPrice', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Auction Type Filters */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Auction Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Reserve Price Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Reserve Price</Label>
                  <select
                    value={filters.hasReserve}
                    onChange={(e) => handleInputChange('hasReserve', e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="">All Items</option>
                    <option value="true">Has Reserve Price</option>
                    <option value="false">No Reserve (Pure Sale)</option>
                  </select>
                </div>

                {/* Buy It Now Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Buy It Now</Label>
                  <select
                    value={filters.hasBuyItNow}
                    onChange={(e) => handleInputChange('hasBuyItNow', e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="">All Items</option>
                    <option value="true">Has Buy It Now</option>
                    <option value="false">Auction Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Currency and Sort */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Currency Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Currency</Label>
                <select
                  value={filters.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">All Currencies</option>
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="USD">US Dollar (USD)</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Sort By</Label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleInputChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="startingPrice">Starting Price</option>
                  <option value="currentPrice">Current Price</option>
                  <option value="endTime">End Time</option>
                  <option value="title">Title</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Sort Order</Label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(filters.search || filters.minPrice || filters.maxPrice || filters.currency || filters.hasReserve || filters.hasBuyItNow) && (
              <div className="pt-2">
                <Label className="text-sm font-medium mb-2 block">Active Filters:</Label>
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Search: "{filters.search}"
                      <button
                        onClick={() => handleInputChange('search', '')}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filters.minPrice && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Min: {filters.minPrice}
                      <button
                        onClick={() => handleInputChange('minPrice', '')}
                        className="ml-1 hover:text-green-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filters.maxPrice && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Max: {filters.maxPrice}
                      <button
                        onClick={() => handleInputChange('maxPrice', '')}
                        className="ml-1 hover:text-green-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filters.currency && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      Currency: {filters.currency}
                      <button
                        onClick={() => handleInputChange('currency', '')}
                        className="ml-1 hover:text-purple-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filters.hasReserve && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                      Reserve: {filters.hasReserve === 'true' ? 'Has Reserve' : 'No Reserve'}
                      <button
                        onClick={() => handleInputChange('hasReserve', '')}
                        className="ml-1 hover:text-orange-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filters.hasBuyItNow && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                      Buy It Now: {filters.hasBuyItNow === 'true' ? 'Available' : 'Not Available'}
                      <button
                        onClick={() => handleInputChange('hasBuyItNow', '')}
                        className="ml-1 hover:text-indigo-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchComponent;


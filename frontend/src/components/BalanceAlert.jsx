import React from 'react';
import { AlertTriangle, Wallet, Info } from 'lucide-react';

const BalanceAlert = ({ 
  userBalance, 
  requiredBalance, 
  currentPrice, 
  currency, 
  canBid, 
  reasons = [],
  onTopUp 
}) => {
  const currencySymbol = currency === 'NGN' ? '₦' : '$';
  
  if (canBid) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <Wallet className="h-5 w-5 text-green-600 mr-2" />
          <div>
            <h4 className="text-green-800 font-medium">Ready to Bid</h4>
            <p className="text-green-700 text-sm">
              Your balance: {currencySymbol}{userBalance.toFixed(2)} | 
              Required: {currencySymbol}{requiredBalance.toFixed(2)} (20% of next bid)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-red-800 font-medium mb-2">Cannot Place Bid</h4>
          
          {reasons.map((reason, index) => (
            <p key={index} className="text-red-700 text-sm mb-1">
              • {reason}
            </p>
          ))}
          
          <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
            <div className="text-sm text-red-800">
              <div className="flex justify-between mb-1">
                <span>Your Balance:</span>
                <span className="font-medium">{currencySymbol}{userBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Required (20%):</span>
                <span className="font-medium">{currencySymbol}{requiredBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shortfall:</span>
                <span className="font-medium text-red-600">
                  {currencySymbol}{Math.max(0, requiredBalance - userBalance).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {userBalance < requiredBalance && (
            <div className="mt-3">
              <button
                onClick={onTopUp}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Add Money to Balance
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceAlert;


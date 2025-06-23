const mongoose = require('mongoose');

const sellerAgreementSchema = new mongoose.Schema({
  // Auction reference
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true,
    unique: true
  },
  
  // Seller information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  homeAddress: {
    street: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    }
  },
  
  // Terms and conditions agreements
  agreements: {
    ownershipCertification: {
      type: Boolean,
      required: true,
      default: false
    },
    liabilityAcceptance: {
      type: Boolean,
      required: true,
      default: false
    },
    platformAuthorization: {
      type: Boolean,
      required: true,
      default: false
    },
    reservePriceFlexibility: {
      type: Boolean,
      required: true,
      default: false
    },
    itemHandover: {
      type: Boolean,
      required: true,
      default: false
    },
    commissionAcceptance: {
      type: Boolean,
      required: true,
      default: false
    },
    paymentTerms: {
      type: Boolean,
      required: true,
      default: false
    },
    relistingTerms: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  
  // Bank account information for payment
  bankAccount: {
    accountName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    routingNumber: {
      type: String,
      trim: true,
      maxlength: 20
    }
  },
  
  // Agreement completion status
  isComplete: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  
  // Email verification
  emailToken: {
    type: String,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date,
    default: null
  },
  
  // IP address for tracking
  ipAddress: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Check if all required agreements are accepted
sellerAgreementSchema.methods.areAllAgreementsAccepted = function() {
  const agreements = this.agreements;
  return Object.values(agreements).every(agreement => agreement === true);
};

// Mark agreement as complete
sellerAgreementSchema.methods.markComplete = function() {
  if (this.areAllAgreementsAccepted()) {
    this.isComplete = true;
    this.completedAt = new Date();
    return this.save();
  } else {
    throw new Error('All agreements must be accepted before marking as complete');
  }
};

// Pre-save validation
sellerAgreementSchema.pre('save', function(next) {
  // Auto-mark as complete if all agreements are accepted
  if (this.areAllAgreementsAccepted() && !this.isComplete) {
    this.isComplete = true;
    this.completedAt = new Date();
  }
  
  // Reset completion if agreements are changed
  if (!this.areAllAgreementsAccepted() && this.isComplete) {
    this.isComplete = false;
    this.completedAt = null;
  }
  
  next();
});

module.exports = mongoose.model('SellerAgreement', sellerAgreementSchema);


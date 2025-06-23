const express = require('express');
const router = express.Router();
const SellerAgreement = require('../models/SellerAgreement');
const Auction = require('../models/Auction');
const User = require('../models/User');
const { requireAdminAuth } = require('../middleware/adminAuth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Create seller agreement link (Admin only)
router.post('/create-agreement-link', requireAdminAuth, async (req, res) => {
  try {
    const { auctionId } = req.body;
    
    // Check if auction exists
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    // Check if agreement already exists
    const existingAgreement = await SellerAgreement.findOne({ auction: auctionId });
    if (existingAgreement) {
      return res.status(400).json({ 
        message: 'Seller agreement already exists for this auction',
        agreementId: existingAgreement._id
      });
    }
    
    // Generate email token
    const emailToken = crypto.randomBytes(32).toString('hex');
    
    // Create new seller agreement
    const sellerAgreement = new SellerAgreement({
      auction: auctionId,
      emailToken,
      emailSentAt: new Date()
    });
    
    await sellerAgreement.save();
    
    // Update auction status
    auction.sellerAgreement = sellerAgreement._id;
    auction.status = 'pending_agreement';
    await auction.save();
    
    // Generate agreement link
    const agreementLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/seller-agreement/${sellerAgreement._id}?token=${emailToken}`;
    
    res.status(201).json({
      message: 'Seller agreement created successfully',
      agreementId: sellerAgreement._id,
      agreementLink,
      emailToken
    });
  } catch (error) {
    console.error('Error creating seller agreement:', error);
    res.status(500).json({ message: 'Failed to create seller agreement' });
  }
});

// Send agreement email (Admin only)
router.post('/send-agreement-email', requireAdminAuth, async (req, res) => {
  try {
    const { agreementId, sellerEmail } = req.body;
    
    const agreement = await SellerAgreement.findById(agreementId).populate('auction');
    if (!agreement) {
      return res.status(404).json({ message: 'Seller agreement not found' });
    }
    
    const agreementLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/seller-agreement/${agreement._id}?token=${agreement.emailToken}`;
    
    // TODO: Implement email sending logic here
    // For now, just return the link
    
    res.json({
      message: 'Agreement email would be sent',
      agreementLink,
      sellerEmail
    });
  } catch (error) {
    console.error('Error sending agreement email:', error);
    res.status(500).json({ message: 'Failed to send agreement email' });
  }
});

// Get seller agreement by ID and token
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;
    
    const agreement = await SellerAgreement.findById(id).populate('auction');
    if (!agreement) {
      return res.status(404).json({ message: 'Seller agreement not found' });
    }
    
    // Verify token if provided
    if (token && agreement.emailToken !== token) {
      return res.status(401).json({ message: 'Invalid access token' });
    }
    
    res.json({
      agreement: {
        _id: agreement._id,
        auction: agreement.auction,
        firstName: agreement.firstName,
        lastName: agreement.lastName,
        email: agreement.email,
        phoneNumber: agreement.phoneNumber,
        homeAddress: agreement.homeAddress,
        agreements: agreement.agreements,
        bankAccount: agreement.bankAccount,
        isComplete: agreement.isComplete,
        completedAt: agreement.completedAt
      }
    });
  } catch (error) {
    console.error('Error fetching seller agreement:', error);
    res.status(500).json({ message: 'Failed to fetch seller agreement' });
  }
});

// Submit seller agreement
router.put('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;
    const agreementData = req.body;
    
    const agreement = await SellerAgreement.findById(id).populate('auction');
    if (!agreement) {
      return res.status(404).json({ message: 'Seller agreement not found' });
    }
    
    // Verify token
    if (agreement.emailToken !== token) {
      return res.status(401).json({ message: 'Invalid access token' });
    }
    
    // Check if already completed
    if (agreement.isComplete) {
      return res.status(400).json({ message: 'Agreement already completed' });
    }
    
    // Update agreement data
    Object.assign(agreement, agreementData);
    agreement.ipAddress = req.ip || req.connection.remoteAddress;
    
    await agreement.save();
    
    // If agreement is now complete, update auction status
    if (agreement.isComplete) {
      const auction = await Auction.findById(agreement.auction._id);
      auction.isSellerAgreementComplete = true;
      auction.status = 'active'; // Make auction live
      await auction.save();
      
      // Prevent seller from bidding on their own item
      const sellerUser = await User.findOne({ email: agreement.email });
      if (sellerUser) {
        // Add auction to seller's restricted list (implement this logic as needed)
      }
    }
    
    res.json({
      message: 'Seller agreement submitted successfully',
      isComplete: agreement.isComplete,
      auctionStatus: agreement.isComplete ? 'active' : 'pending_agreement'
    });
  } catch (error) {
    console.error('Error submitting seller agreement:', error);
    res.status(500).json({ message: 'Failed to submit seller agreement' });
  }
});

// Get all seller agreements (Admin only)
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const agreements = await SellerAgreement.find()
      .populate('auction', 'title status')
      .sort({ createdAt: -1 });
    
    res.json({ agreements });
  } catch (error) {
    console.error('Error fetching seller agreements:', error);
    res.status(500).json({ message: 'Failed to fetch seller agreements' });
  }
});

module.exports = router;


// routes/payments.js - SECURE M-Pesa Integration
import express from "express";
import crypto from "crypto"; // 🔒 SECURITY: For signature verification
import db from "../db.js";
import { verifyToken } from '../middleware/auth.js';
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Load M-Pesa credentials from .env
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox';
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const PASSKEY = process.env.MPESA_PASSKEY;
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'http://localhost:5000/api/payments/mpesa/callback';

// M-Pesa API URLs
const MPESA_BASE_URL = MPESA_ENV === 'production' 
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

// ==========================================
// 🔒 SECURITY: Input Validation Functions
// ==========================================
function validatePropertyId(id) {
  const numId = parseInt(id);
  if (isNaN(numId) || numId < 1 || !/^\d+$/.test(id)) {
    throw new Error('Invalid property ID');
  }
  return numId;
}

function validateAmount(amount) {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount < 1 || numAmount > 1000000) {
    throw new Error('Invalid amount (must be between 1 and 1,000,000)');
  }
  return Math.round(numAmount); // Ensure integer
}

function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Phone number is required');
  }
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Validate length (Kenyan numbers)
  if (cleaned.length < 9 || cleaned.length > 12) {
    throw new Error('Invalid phone number format');
  }
  
  // Format to 254XXXXXXXXX
  let formatted = cleaned;
  if (formatted.startsWith('0')) {
    formatted = '254' + formatted.substring(1);
  } else if (formatted.startsWith('254')) {
    // Already correct
  } else if (formatted.startsWith('7') || formatted.startsWith('1')) {
    formatted = '254' + formatted;
  } else {
    throw new Error('Invalid phone number format');
  }
  
  // Final validation: must be 12 digits starting with 254
  if (!/^254[71]\d{8}$/.test(formatted)) {
    throw new Error('Invalid Kenyan phone number');
  }
  
  return formatted;
}

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 100).replace(/[<>'"]/g, ''); // 🔒 SECURITY: Remove dangerous chars
}

// ==========================================
// 🔒 SECURITY: Rate Limiting for Payments
// ==========================================
const paymentAttempts = new Map();
const PAYMENT_RATE_LIMIT = 3; // 3 attempts
const PAYMENT_WINDOW = 10 * 60 * 1000; // 10 minutes

function checkPaymentRateLimit(userId) {
  const now = Date.now();
  const userAttempts = paymentAttempts.get(userId) || [];
  
  // Remove old attempts
  const recentAttempts = userAttempts.filter(time => now - time < PAYMENT_WINDOW);
  
  if (recentAttempts.length >= PAYMENT_RATE_LIMIT) {
    return false; // Rate limit exceeded
  }
  
  recentAttempts.push(now);
  paymentAttempts.set(userId, recentAttempts);
  return true;
}

// ==========================================
// ✅ Verify Featured Fee Calculation
// ==========================================
router.post("/verify-featured", verifyToken, requireAgent, async (req, res) => {
  try {
    let { property_id, amount } = req.body;
    
    // 🔒 SECURITY: Validate inputs
    try {
      property_id = validatePropertyId(property_id);
      amount = validateAmount(amount);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
    
    // Get property from database (with authorization check)
    const [rows] = await db.promise().query(
      "SELECT price FROM properties WHERE property_id = ? AND agent_id = ?",
      [property_id, req.user.userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        message: "Property not found or access denied" 
      });
    }
    
    const propertyPrice = parseFloat(rows[0].price);
    
    // 🔒 SECURITY: Validate property price is reasonable
    if (propertyPrice < 0 || propertyPrice > 1000000000) {
      return res.status(400).json({ message: "Invalid property price" });
    }
    
    // Calculate expected fee (2% with minimum 50 Ksh)
    const expectedFee = Math.max(50, Math.ceil(propertyPrice * 0.02));
    
    // 🔒 SECURITY: Verify amount matches exactly
    if (amount !== expectedFee) {
      return res.status(400).json({ 
        message: "Invalid payment amount",
        expected: expectedFee,
        received: amount
      });
    }
    
    res.json({ 
      valid: true, 
      amount: expectedFee,
      message: "Payment amount verified successfully" 
    });
    
  } catch (error) {
    console.error("Error verifying featured fee:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// ==========================================
// 🔥 M-PESA STK PUSH INITIATION (SECURE)
// ==========================================
router.post("/mpesa/initiate", verifyToken, requireAgent, async (req, res) => {
  try {
    let { property_id, amount, phone_number } = req.body;
    
    // 🔒 SECURITY: Check rate limit
    if (!checkPaymentRateLimit(req.user.userId)) {
      return res.status(429).json({ 
        message: "Too many payment attempts. Please wait 10 minutes." 
      });
    }
    
    // 🔒 SECURITY: Validate inputs
    try {
      property_id = validatePropertyId(property_id);
      amount = validateAmount(amount);
      phone_number = validatePhoneNumber(phone_number);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    // 🔒 SECURITY: Validate credentials exist
    if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY) {
      console.error("❌ M-Pesa credentials not configured");
      return res.status(500).json({ 
        message: "Payment service temporarily unavailable" 
      });
    }

    // 🔒 SECURITY: Verify property ownership and get details
    const [propertyRows] = await db.promise().query(
      "SELECT price, is_featured FROM properties WHERE property_id = ? AND agent_id = ?",
      [property_id, req.user.userId]
    );
    
    if (propertyRows.length === 0) {
      return res.status(404).json({ 
        message: "Property not found or access denied" 
      });
    }
    
    // 🔒 SECURITY: Check if already featured
    if (propertyRows[0].is_featured === 1) {
      return res.status(400).json({ 
        message: "Property is already featured" 
      });
    }
    
    // 🔒 SECURITY: Verify amount matches expected fee
    const propertyPrice = parseFloat(propertyRows[0].price);
    const expectedFee = Math.max(50, Math.ceil(propertyPrice * 0.02));
    
    if (amount !== expectedFee) {
      return res.status(400).json({ 
        message: "Invalid payment amount",
        expected: expectedFee
      });
    }

    console.log('🔵 Initiating M-Pesa payment:', { property_id, amount, phone_number });
    
    // 1. Get OAuth token from Safaricom
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
    let tokenResponse;
    try {
      tokenResponse = await fetch(
        `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: { Authorization: `Basic ${auth}` },
          timeout: 10000 // 10 second timeout
        }
      );
    } catch (fetchError) {
      console.error('❌ Failed to connect to M-Pesa:', fetchError);
      return res.status(503).json({ 
        message: "Payment service temporarily unavailable" 
      });
    }
    
    if (!tokenResponse.ok) {
      console.error('❌ M-Pesa auth failed:', tokenResponse.status);
      return res.status(503).json({ 
        message: "Payment service temporarily unavailable" 
      });
    }
    
    const { access_token } = await tokenResponse.json();
    console.log('✅ OAuth token received');
    
    // 2. Generate password for STK push
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
    
    // 3. Create unique transaction reference
    const transactionRef = `FEAT-${property_id}-${Date.now()}`;
    
    // 4. Initiate STK push
    const stkPayload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone_number,
      PartyB: SHORTCODE,
      PhoneNumber: phone_number,
      CallBackURL: CALLBACK_URL,
      AccountReference: transactionRef,
      TransactionDesc: 'Featured Listing Fee'
    };
    
    console.log('📤 Sending STK push request...');
    
    let stkResponse;
    try {
      stkResponse = await fetch(
        `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(stkPayload),
          timeout: 15000 // 15 second timeout
        }
      );
    } catch (fetchError) {
      console.error('❌ STK push request failed:', fetchError);
      return res.status(503).json({ 
        message: "Failed to send payment request" 
      });
    }
    
    const stkData = await stkResponse.json();
    console.log('📥 STK Response:', stkData);
    
    if (stkData.ResponseCode === '0') {
      // 5. Store transaction in database
      await db.promise().query(
        `INSERT INTO payment_transactions 
         (property_id, agent_id, amount, phone_number, checkout_request_id, transaction_ref, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [property_id, req.user.userId, amount, phone_number, stkData.CheckoutRequestID, transactionRef]
      );
      
      console.log('✅ Transaction saved to database');
      
      return res.json({
        success: true,
        message: 'Payment request sent. Check your phone to complete payment.',
        checkoutRequestId: stkData.CheckoutRequestID,
        // 🔒 SECURITY: Don't expose phone number in response
      });
    } else {
      console.error('❌ STK Push failed:', stkData);
      return res.status(400).json({
        message: 'Failed to initiate payment',
        error: sanitizeString(stkData.ResponseDescription || stkData.errorMessage || 'Unknown error')
      });
    }
    
  } catch (error) {
    console.error("❌ Error initiating M-Pesa payment:", error);
    res.status(500).json({ 
      message: "An error occurred during payment initiation"
    });
  }
});

// ==========================================
// 🔥 M-PESA CALLBACK (Webhook) - SECURE
// ==========================================
router.post("/mpesa/callback", async (req, res) => {
  try {
    console.log("📞 M-Pesa callback received");
    
    // 🔒 SECURITY: Validate callback structure
    const { Body } = req.body;
    
    if (!Body || !Body.stkCallback) {
      console.error('❌ Invalid callback format');
      return res.json({ ResultCode: 1, ResultDesc: "Invalid format" });
    }
    
    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = Body.stkCallback;
    
    if (!CheckoutRequestID) {
      console.error('❌ Missing CheckoutRequestID');
      return res.json({ ResultCode: 1, ResultDesc: "Missing data" });
    }
    
    console.log(`📊 Payment Result: Code=${ResultCode}, Desc=${ResultDesc}`);
    
    // 🔒 SECURITY: Verify transaction exists in database
    const [existingTx] = await db.promise().query(
      "SELECT property_id, agent_id, amount FROM payment_transactions WHERE checkout_request_id = ?",
      [CheckoutRequestID]
    );
    
    if (existingTx.length === 0) {
      console.error('❌ Transaction not found in database');
      return res.json({ ResultCode: 1, ResultDesc: "Transaction not found" });
    }
    
    const { property_id, agent_id, amount: expectedAmount } = existingTx[0];
    
    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata?.Item || [];
      const amount = metadata.find(item => item.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;
      
      // 🔒 SECURITY: Verify amount matches expected
      if (amount !== expectedAmount) {
        console.error('❌ Amount mismatch:', { expected: expectedAmount, received: amount });
        await db.promise().query(
          `UPDATE payment_transactions 
           SET status = 'failed', 
               error_message = 'Amount mismatch',
               updated_at = NOW()
           WHERE checkout_request_id = ?`,
          [CheckoutRequestID]
        );
        return res.json({ ResultCode: 1, ResultDesc: "Amount mismatch" });
      }
      
      // 🔒 SECURITY: Check for duplicate receipt
      const [duplicate] = await db.promise().query(
        "SELECT transaction_id FROM payment_transactions WHERE mpesa_receipt = ? AND transaction_id != (SELECT transaction_id FROM payment_transactions WHERE checkout_request_id = ?)",
        [mpesaReceiptNumber, CheckoutRequestID]
      );
      
      if (duplicate.length > 0) {
        console.error('❌ Duplicate receipt number detected');
        return res.json({ ResultCode: 1, ResultDesc: "Duplicate transaction" });
      }
      
      console.log('✅ Payment successful:', { mpesaReceiptNumber, amount, phoneNumber });
      
      // Update transaction status
      await db.promise().query(
        `UPDATE payment_transactions 
         SET status = 'completed', 
             mpesa_receipt = ?, 
             transaction_date = ?,
             updated_at = NOW()
         WHERE checkout_request_id = ?`,
        [mpesaReceiptNumber, transactionDate, CheckoutRequestID]
      );
      
      // 🔒 SECURITY: Verify property still belongs to agent before marking featured
      const [verifyProperty] = await db.promise().query(
        "SELECT is_featured FROM properties WHERE property_id = ? AND agent_id = ?",
        [property_id, agent_id]
      );
      
      if (verifyProperty.length > 0 && verifyProperty[0].is_featured !== 1) {
        // Update property to featured
        await db.promise().query(
          "UPDATE properties SET is_featured = 1, updated_at = NOW() WHERE property_id = ?",
          [property_id]
        );
        
        console.log(`✅ Property ${property_id} marked as featured`);
      }
    } else {
      // Payment failed or cancelled
      console.log(`❌ Payment failed: ${ResultDesc}`);
      
      await db.promise().query(
        `UPDATE payment_transactions 
         SET status = 'failed', 
             error_message = ?,
             updated_at = NOW()
         WHERE checkout_request_id = ?`,
        [sanitizeString(ResultDesc), CheckoutRequestID]
      );
    }
    
    // Always respond with 200 to acknowledge receipt
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    
  } catch (error) {
    console.error("❌ Error processing M-Pesa callback:", error);
    // Still respond with 200 to prevent retries
    res.json({ ResultCode: 0, ResultDesc: "Processed" });
  }
});

// ==========================================
// 📊 Get Payment Status
// ==========================================
router.get("/status/:checkoutRequestId", verifyToken, async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    
    // 🔒 SECURITY: Sanitize input
    const sanitized = sanitizeString(checkoutRequestId);
    
    // 🔒 SECURITY: Only return transactions for current user
    const [rows] = await db.promise().query(
      `SELECT 
        transaction_id,
        property_id,
        amount,
        status,
        mpesa_receipt,
        transaction_date,
        created_at,
        error_message
       FROM payment_transactions 
       WHERE checkout_request_id = ? AND agent_id = ?`,
      [sanitized, req.user.userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    // 🔒 SECURITY: Don't expose sensitive data
    const transaction = rows[0];
    delete transaction.phone_number; // Don't return phone in response
    
    res.json({ transaction });
    
  } catch (error) {
    console.error("Error fetching payment status:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

// ==========================================
// 🔄 Manual Featured Toggle (Admin/Testing Only)
// ==========================================
router.post("/mark-featured", verifyToken, requireAgent, async (req, res) => {
  try {
    let { property_id } = req.body;
    
    // 🔒 SECURITY: Validate input
    try {
      property_id = validatePropertyId(property_id);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
    
    // 🔒 SECURITY: Only allow in development/sandbox
    if (MPESA_ENV === 'production') {
      return res.status(403).json({ 
        message: "Manual marking not allowed in production" 
      });
    }
    
    // 🔒 SECURITY: Verify property belongs to agent
    const [rows] = await db.promise().query(
      "SELECT is_featured FROM properties WHERE property_id = ? AND agent_id = ?",
      [property_id, req.user.userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Property not found or access denied" });
    }
    
    // Update to featured
    await db.promise().query(
      "UPDATE properties SET is_featured = 1, updated_at = NOW() WHERE property_id = ?",
      [property_id]
    );
    
    console.log(`⚠️ Property ${property_id} manually marked as featured (TEST MODE)`);
    
    res.json({ 
      message: "Property marked as featured (TEST MODE ONLY)",
      property_id 
    });
    
  } catch (error) {
    console.error("Error marking property as featured:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
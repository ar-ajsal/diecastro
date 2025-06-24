/**
 * Utility functions for Razorpay integration
 */

const crypto = require('crypto');

/**
 * Verify Razorpay payment signature
 * 
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @param {string} secret - Razorpay secret key
 * @returns {boolean} - True if signature is valid
 */
const verifyPaymentSignature = (orderId, paymentId, signature, secret) => {
  const sign = orderId + "|" + paymentId;
  const expectedSign = crypto
    .createHmac("sha256", secret)
    .update(sign)
    .digest("hex");
  
  return expectedSign === signature;
};

/**
 * Format amount for Razorpay (convert to paise)
 * 
 * @param {number} amount - Amount in rupees
 * @returns {number} - Amount in paise
 */
const formatAmountForRazorpay = (amount) => {
  return Math.round(amount * 100);
};

/**
 * Handle Razorpay errors
 * 
 * @param {Error} error - Error object
 * @returns {Object} - Error object with code and message
 */
const handleRazorpayError = (error) => {
  console.error('Razorpay error:', error);
  
  // Default error
  let errorResponse = {
    code: 'PAYMENT_ERROR',
    message: 'An error occurred during payment processing'
  };
  
  // Specific error handling based on Razorpay error codes
  if (error.error && error.error.code) {
    switch (error.error.code) {
      case 'BAD_REQUEST_ERROR':
        errorResponse = {
          code: 'INVALID_REQUEST',
          message: 'Invalid request parameters'
        };
        break;
      case 'GATEWAY_ERROR':
        errorResponse = {
          code: 'GATEWAY_ERROR',
          message: 'Payment gateway is currently unavailable'
        };
        break;
      case 'SERVER_ERROR':
        errorResponse = {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        };
        break;
      default:
        errorResponse = {
          code: error.error.code,
          message: error.error.description || 'Payment processing error'
        };
    }
  }
  
  return errorResponse;
};

module.exports = {
  verifyPaymentSignature,
  formatAmountForRazorpay,
  handleRazorpayError
};
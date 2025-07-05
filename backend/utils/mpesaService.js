// Enhanced M-Pesa Daraja API Service for LegalPro v1.0.1
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

// Environment configuration
const environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
const baseUrls = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke'
};

const mpesaBaseUrl = baseUrls[environment];
const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const shortcode = process.env.MPESA_SHORTCODE || '174379';
const lipaNaMpesaOnlinePasskey = process.env.MPESA_PASSKEY;
const initiatorName = process.env.MPESA_INITIATOR_NAME || 'testapi';
const securityCredential = process.env.MPESA_SECURITY_CREDENTIAL;

// Callback URLs
const stkCallbackUrl = process.env.MPESA_STK_CALLBACK_URL;
const b2cCallbackUrl = process.env.MPESA_B2C_CALLBACK_URL;
const timeoutUrl = process.env.MPESA_TIMEOUT_URL;
const resultUrl = process.env.MPESA_RESULT_URL;

// Token management
let accessToken = null;
let tokenExpiry = null;

// Retry configuration
const retryConfig = {
  maxRetries: 3,
  retryDelay: [1000, 2000, 5000], // Exponential backoff in milliseconds
  retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'],
  nonRetryableErrors: ['400', '401', '403']
};

// Utility functions
function generateTimestamp() {
  return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
}

function generatePassword(shortcode, passkey, timestamp) {
  return Buffer.from(shortcode + passkey + timestamp).toString('base64');
}

function formatPhoneNumber(phoneNumber) {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Handle different formats
  if (cleaned.startsWith('254')) {
    return cleaned;
  } else if (cleaned.startsWith('0')) {
    return '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    return '254' + cleaned;
  }

  return cleaned;
}

// Enhanced error handling with retry logic
async function makeRequest(requestFn, retryCount = 0) {
  try {
    return await requestFn();
  } catch (error) {
    const errorCode = error.response?.status?.toString() || error.code;
    const isRetryable = retryConfig.retryableErrors.includes(errorCode) &&
                       !retryConfig.nonRetryableErrors.includes(errorCode);

    if (isRetryable && retryCount < retryConfig.maxRetries) {
      const delay = retryConfig.retryDelay[retryCount] || retryConfig.retryDelay[retryConfig.retryDelay.length - 1];
      console.log(`Retrying request in ${delay}ms (attempt ${retryCount + 1}/${retryConfig.maxRetries})`);

      await new Promise(resolve => setTimeout(resolve, delay));
      return makeRequest(requestFn, retryCount + 1);
    }

    throw error;
  }
}

// Enhanced OAuth access token management
async function getAccessToken() {
  // Check if token is still valid (with 5-minute buffer)
  if (accessToken && tokenExpiry && new Date() < new Date(tokenExpiry.getTime() - 5 * 60 * 1000)) {
    return accessToken;
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const requestFn = async () => {
    const response = await axios.get(`${mpesaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });
    return response;
  };

  try {
    const response = await makeRequest(requestFn);
    accessToken = response.data.access_token;
    tokenExpiry = new Date(new Date().getTime() + (response.data.expires_in * 1000));

    console.log(`M-Pesa access token obtained successfully. Expires at: ${tokenExpiry}`);
    return accessToken;
  } catch (error) {
    console.error('Error getting M-Pesa access token:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(`Failed to obtain M-Pesa access token: ${error.message}`);
  }
}

// Enhanced STK Push payment request
async function initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
  try {
    const token = await getAccessToken();
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const timestamp = generateTimestamp();
    const password = generatePassword(shortcode, lipaNaMpesaOnlinePasskey, timestamp);

    // Validate inputs
    if (!formattedPhone || formattedPhone.length < 12) {
      throw new Error('Invalid phone number format');
    }
    if (!amount || amount < 1) {
      throw new Error('Invalid amount');
    }
    if (!stkCallbackUrl) {
      throw new Error('STK callback URL not configured');
    }

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount), // Ensure integer amount
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: stkCallbackUrl,
      AccountReference: accountReference || 'LegalPro',
      TransactionDesc: transactionDesc || 'Legal Services Payment'
    };

    console.log('Initiating STK Push:', {
      phone: formattedPhone,
      amount: payload.Amount,
      reference: payload.AccountReference
    });

    const requestFn = async () => {
      return await axios.post(`${mpesaBaseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 seconds timeout for STK push
      });
    };

    const response = await makeRequest(requestFn);

    console.log('STK Push response:', {
      merchantRequestID: response.data.MerchantRequestID,
      checkoutRequestID: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode
    });

    return {
      success: true,
      merchantRequestID: response.data.MerchantRequestID,
      checkoutRequestID: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
      customerMessage: response.data.CustomerMessage
    };

  } catch (error) {
    console.error('STK Push error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    throw new Error(`STK Push failed: ${error.response?.data?.errorMessage || error.message}`);
  }
}

// Query STK Push transaction status
async function querySTKPushStatus(checkoutRequestID) {
  try {
    const token = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(shortcode, lipaNaMpesaOnlinePasskey, timestamp);

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID
    };

    console.log('Querying STK Push status for:', checkoutRequestID);

    const requestFn = async () => {
      return await axios.post(`${mpesaBaseUrl}/mpesa/stkpushquery/v1/query`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
    };

    const response = await makeRequest(requestFn);

    console.log('STK Push status response:', {
      resultCode: response.data.ResultCode,
      resultDesc: response.data.ResultDesc
    });

    return {
      success: true,
      resultCode: response.data.ResultCode,
      resultDesc: response.data.ResultDesc,
      merchantRequestID: response.data.MerchantRequestID,
      checkoutRequestID: response.data.CheckoutRequestID
    };

  } catch (error) {
    console.error('STK Push status query error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    throw new Error(`STK Push status query failed: ${error.response?.data?.errorMessage || error.message}`);
  }
}

// B2C Payment Request (Business to Customer)
async function initiateB2CPayment(phoneNumber, amount, remarks, occasion = 'Refund') {
  try {
    const token = await getAccessToken();
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Validate inputs
    if (!formattedPhone || formattedPhone.length < 12) {
      throw new Error('Invalid phone number format');
    }
    if (!amount || amount < 1) {
      throw new Error('Invalid amount');
    }
    if (!b2cCallbackUrl || !timeoutUrl) {
      throw new Error('B2C callback URLs not configured');
    }

    const payload = {
      InitiatorName: initiatorName,
      SecurityCredential: securityCredential,
      CommandID: 'BusinessPayment', // or 'SalaryPayment', 'PromotionPayment'
      Amount: Math.round(amount),
      PartyA: shortcode,
      PartyB: formattedPhone,
      Remarks: remarks || 'B2C Payment',
      QueueTimeOutURL: timeoutUrl,
      ResultURL: resultUrl,
      Occasion: occasion
    };

    console.log('Initiating B2C payment:', {
      phone: formattedPhone,
      amount: payload.Amount,
      remarks: payload.Remarks
    });

    const requestFn = async () => {
      return await axios.post(`${mpesaBaseUrl}/mpesa/b2c/v1/paymentrequest`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });
    };

    const response = await makeRequest(requestFn);

    console.log('B2C payment response:', {
      conversationID: response.data.ConversationID,
      originatorConversationID: response.data.OriginatorConversationID,
      responseCode: response.data.ResponseCode
    });

    return {
      success: true,
      conversationID: response.data.ConversationID,
      originatorConversationID: response.data.OriginatorConversationID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription
    };

  } catch (error) {
    console.error('B2C payment error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    throw new Error(`B2C payment failed: ${error.response?.data?.errorMessage || error.message}`);
  }
}

// Query Account Balance
async function queryAccountBalance() {
  try {
    const token = await getAccessToken();

    if (!resultUrl || !timeoutUrl) {
      throw new Error('Balance query callback URLs not configured');
    }

    const payload = {
      Initiator: initiatorName,
      SecurityCredential: securityCredential,
      CommandID: 'AccountBalance',
      PartyA: shortcode,
      IdentifierType: '4', // Organization shortcode
      Remarks: 'Account balance query',
      QueueTimeOutURL: timeoutUrl,
      ResultURL: resultUrl
    };

    console.log('Querying account balance for shortcode:', shortcode);

    const requestFn = async () => {
      return await axios.post(`${mpesaBaseUrl}/mpesa/accountbalance/v1/query`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
    };

    const response = await makeRequest(requestFn);

    console.log('Account balance query response:', {
      conversationID: response.data.ConversationID,
      originatorConversationID: response.data.OriginatorConversationID,
      responseCode: response.data.ResponseCode
    });

    return {
      success: true,
      conversationID: response.data.ConversationID,
      originatorConversationID: response.data.OriginatorConversationID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription
    };

  } catch (error) {
    console.error('Account balance query error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    throw new Error(`Account balance query failed: ${error.response?.data?.errorMessage || error.message}`);
  }
}

// Transaction Reversal
async function reverseTransaction(transactionID, amount, remarks) {
  try {
    const token = await getAccessToken();

    if (!resultUrl || !timeoutUrl) {
      throw new Error('Reversal callback URLs not configured');
    }

    const payload = {
      Initiator: initiatorName,
      SecurityCredential: securityCredential,
      CommandID: 'TransactionReversal',
      TransactionID: transactionID,
      Amount: Math.round(amount),
      ReceiverParty: shortcode,
      RecieverIdentifierType: '11', // Shortcode
      Remarks: remarks || 'Transaction reversal',
      QueueTimeOutURL: timeoutUrl,
      ResultURL: resultUrl,
      Occasion: 'Transaction reversal'
    };

    console.log('Reversing transaction:', {
      transactionID: transactionID,
      amount: payload.Amount,
      remarks: payload.Remarks
    });

    const requestFn = async () => {
      return await axios.post(`${mpesaBaseUrl}/mpesa/reversal/v1/request`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });
    };

    const response = await makeRequest(requestFn);

    console.log('Transaction reversal response:', {
      conversationID: response.data.ConversationID,
      originatorConversationID: response.data.OriginatorConversationID,
      responseCode: response.data.ResponseCode
    });

    return {
      success: true,
      conversationID: response.data.ConversationID,
      originatorConversationID: response.data.OriginatorConversationID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription
    };

  } catch (error) {
    console.error('Transaction reversal error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    throw new Error(`Transaction reversal failed: ${error.response?.data?.errorMessage || error.message}`);
  }
}

// Utility function to validate callback data
function validateCallbackData(callbackData) {
  try {
    if (!callbackData || typeof callbackData !== 'object') {
      throw new Error('Invalid callback data format');
    }

    // Validate STK Push callback
    if (callbackData.Body && callbackData.Body.stkCallback) {
      const { stkCallback } = callbackData.Body;
      return {
        type: 'STK_PUSH',
        merchantRequestID: stkCallback.MerchantRequestID,
        checkoutRequestID: stkCallback.CheckoutRequestID,
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc,
        callbackMetadata: stkCallback.CallbackMetadata
      };
    }

    // Validate B2C callback
    if (callbackData.Result) {
      const { Result } = callbackData;
      return {
        type: 'B2C',
        conversationID: Result.ConversationID,
        originatorConversationID: Result.OriginatorConversationID,
        resultCode: Result.ResultCode,
        resultDesc: Result.ResultDesc,
        resultParameters: Result.ResultParameters
      };
    }

    throw new Error('Unknown callback format');
  } catch (error) {
    console.error('Callback validation error:', error.message);
    throw error;
  }
}

// Module exports
module.exports = {
  // Main payment functions
  initiateSTKPush,
  querySTKPushStatus,
  initiateB2CPayment,
  queryAccountBalance,
  reverseTransaction,

  // Utility functions
  formatPhoneNumber,
  validateCallbackData,
  generateTimestamp,
  generatePassword,

  // Legacy support (deprecated)
  initiatePayment: initiateSTKPush,

  // Configuration
  getEnvironment: () => environment,
  getBaseUrl: () => mpesaBaseUrl
};

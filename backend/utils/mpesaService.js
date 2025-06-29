// M-Pesa payment service for LegalPro v1.0.1
const axios = require('axios');
require('dotenv').config();

const mpesaBaseUrl = 'https://sandbox.safaricom.co.ke';
const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const shortcode = process.env.MPESA_SHORTCODE;
const lipaNaMpesaOnlinePasskey = process.env.MPESA_PASSKEY;
const callbackUrl = process.env.MPESA_CALLBACK_URL;

let accessToken = null;
let tokenExpiry = null;

// Get OAuth access token
async function getAccessToken() {
  if (accessToken && tokenExpiry && new Date() < tokenExpiry) {
    return accessToken;
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  try {
    const response = await axios.get(`${mpesaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    accessToken = response.data.access_token;
    tokenExpiry = new Date(new Date().getTime() + (response.data.expires_in * 1000));
    return accessToken;
  } catch (error) {
    console.error('Error getting M-Pesa access token:', error.response?.data || error.message);
    throw error;
  }
}

// Initiate STK Push payment request
async function initiatePayment(phoneNumber, amount, accountReference, transactionDesc) {
  const token = await getAccessToken();

  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const password = Buffer.from(shortcode + lipaNaMpesaOnlinePasskey + timestamp).toString('base64');

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc
  };

  try {
    const response = await axios.post(`${mpesaBaseUrl}/mpesa/stkpush/v1/processrequest`, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error initiating M-Pesa payment:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  initiatePayment
};

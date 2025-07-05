// Email Verification Routes for LegalPro v1.0.1
const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  sendEmailVerification,
  verifyEmailWithToken,
  verifyEmailWithCode,
  resendVerificationEmail
} = require('../utils/emailVerification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for verification endpoints
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many verification attempts, please try again later.'
  }
});

const resendLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // limit each IP to 1 request per minute
  message: {
    success: false,
    message: 'Please wait before requesting another verification email.'
  }
});

// @desc    Verify email with token
// @route   GET /api/email-verification/verify/:token
// @access  Public
router.get('/verify/:token', verificationLimiter, async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const result = await verifyEmailWithToken(token);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        user: result.user
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
});

// @desc    Verify email with code
// @route   POST /api/email-verification/verify-code
// @access  Public
router.post('/verify-code', verificationLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    const result = await verifyEmailWithCode(email, code);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        user: result.user
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
});

// @desc    Resend verification email
// @route   POST /api/email-verification/resend
// @access  Public
router.post('/resend', resendLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await resendVerificationEmail(email);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        expiresAt: result.expiresAt
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
});

// @desc    Send verification email to authenticated user
// @route   POST /api/email-verification/send
// @access  Private
router.post('/send', protect, async (req, res) => {
  try {
    const user = req.user;

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const result = await sendEmailVerification(user, 'manual');

    res.status(200).json({
      success: true,
      message: result.message,
      expiresAt: result.expiresAt
    });

  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
});

// @desc    Check verification status
// @route   GET /api/email-verification/status
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        email: user.email,
        verificationRequired: !user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification status'
    });
  }
});

module.exports = router;

// Professional Email Verification Service for LegalPro v1.0.1
const crypto = require('crypto');
const User = require('../models/User');
const { sendNotification } = require('./notificationService');

// Generate secure verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate verification code (6-digit)
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email verification
const sendEmailVerification = async (user, type = 'registration') => {
  try {
    const verificationToken = generateVerificationToken();
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with verification data
    await User.findByIdAndUpdate(user._id, {
      emailVerificationToken: verificationToken,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: expiresAt,
      emailVerificationSentAt: new Date()
    });

    // Prepare verification data
    const verificationData = {
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      userRole: user.role,
      verificationCode,
      verificationToken,
      verificationUrl: `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`,
      expiresAt: expiresAt.toLocaleString(),
      supportEmail: process.env.NOTIFY_EMAIL || 'support@legalpro.com',
      type
    };

    // Send verification email
    const result = await sendNotification(user, 'email_verification', verificationData);
    
    console.log('Email verification sent:', {
      userId: user._id,
      email: user.email,
      type,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Verification email sent successfully',
      expiresAt
    };

  } catch (error) {
    console.error('Email verification error:', error);
    throw new Error('Failed to send verification email');
  }
};

// Verify email with token
const verifyEmailWithToken = async (token) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return {
        success: false,
        message: 'Invalid or expired verification token'
      };
    }

    // Update user as verified
    await User.findByIdAndUpdate(user._id, {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: undefined,
      emailVerificationCode: undefined,
      emailVerificationExpires: undefined
    });

    console.log('Email verified successfully:', {
      userId: user._id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };

  } catch (error) {
    console.error('Email verification error:', error);
    throw new Error('Email verification failed');
  }
};

// Verify email with code
const verifyEmailWithCode = async (email, code) => {
  try {
    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerificationCode: code,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return {
        success: false,
        message: 'Invalid or expired verification code'
      };
    }

    // Update user as verified
    await User.findByIdAndUpdate(user._id, {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: undefined,
      emailVerificationCode: undefined,
      emailVerificationExpires: undefined
    });

    console.log('Email verified with code:', {
      userId: user._id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };

  } catch (error) {
    console.error('Email verification error:', error);
    throw new Error('Email verification failed');
  }
};

// Resend verification email
const resendVerificationEmail = async (email) => {
  try {
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isEmailVerified: { $ne: true }
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found or already verified'
      };
    }

    // Check if last email was sent recently (prevent spam)
    const lastSent = user.emailVerificationSentAt;
    if (lastSent && (Date.now() - lastSent.getTime()) < 60000) { // 1 minute
      return {
        success: false,
        message: 'Please wait before requesting another verification email'
      };
    }

    return await sendEmailVerification(user, 'resend');

  } catch (error) {
    console.error('Resend verification error:', error);
    throw new Error('Failed to resend verification email');
  }
};

module.exports = {
  sendEmailVerification,
  verifyEmailWithToken,
  verifyEmailWithCode,
  resendVerificationEmail,
  generateVerificationToken,
  generateVerificationCode
};

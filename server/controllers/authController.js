const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendVerificationEmail } = require('../utils/email');

// Helper to sign JWT tokens
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * Standard User Registration
 */
const signup = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    // 1. Basic validation
    if (!name || !email || !password) {
      return sendError(res, 'Please provide name, email, and password', 400);
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return sendError(res, 'Email address is already in use', 400);
      }
      // If it exists but is not verified, delete it to allow a fresh registration attempt
      await User.deleteOne({ _id: existingUser._id });
    }

    // 3. Generate verification details
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      name,
      email,
      password,
      role: role || 'student'
    });

    user.isEmailVerified = false;
    user.emailVerificationToken = otpCode;
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // 4. Attempt to send verification email first to verify active address
    try {
      await sendVerificationEmail(email, name, otpCode);
    } catch (emailErr) {
      console.error('Email verification send failed:', emailErr);
      return sendError(res, 'Failed to send verification email. Please verify that your email address is active and valid.', 400);
    }

    // 5. Save user to DB only if verification email sends successfully
    await user.save();

    return sendSuccess(res, 'Verification code sent to email successfully', {
      verificationRequired: true,
      email: user.email
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Standard User Login
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Check if email and password are provided
    if (!email || !password) {
      return sendError(res, 'Please provide email and password', 400);
    }

    // 2. Fetch user and explicitly include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // 3. Check if email is verified
    if (!user.isEmailVerified) {
      return sendError(res, 'Please verify your email address before logging in.', 403);
    }

    // 4. Issue JWT token
    const token = signToken(user._id);

    return sendSuccess(res, 'Login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        avatar: user.avatar
      }
    }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Email Verification Code
 */
const verifyEmail = async (req, res, next) => {
  const { email, code } = req.body;
  try {
    if (!email || !code) {
      return sendError(res, 'Email and verification code are required', 400);
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: code,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return sendError(res, 'Invalid or expired verification code', 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const token = signToken(user._id);

    return sendSuccess(res, 'Email verified successfully', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        avatar: user.avatar
      }
    }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Resend Email Verification Code
 */
const resendVerification = async (req, res, next) => {
  const { email } = req.body;
  try {
    if (!email) {
      return sendError(res, 'Email is required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (user.isEmailVerified) {
      return sendError(res, 'Email is already verified', 400);
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationToken = otpCode;
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    try {
      await sendVerificationEmail(user.email, user.name, otpCode);
    } catch (emailErr) {
      console.error('Email verification send failed on resend:', emailErr);
      return sendError(res, 'Failed to send verification email. Make sure your email is active.', 500);
    }

    return sendSuccess(res, 'Verification code resent successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth Authentication
 */
const googleLogin = async (req, res, next) => {
  const { credential, role } = req.body;

  try {
    if (!credential) {
      return sendError(res, 'Google credential is required', 400);
    }

    // 1. Verify Google ID Token
    const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
    const response = await fetch(googleVerifyUrl);
    
    if (!response.ok) {
      return sendError(res, 'Failed to verify Google token', 400);
    }

    const payload = await response.json();
    
    // Check client ID matching
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && payload.aud !== clientId) {
      return sendError(res, 'Google client ID mismatch', 400);
    }

    const { email, name, picture, sub: googleId } = payload;

    // 2. Find or create user
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // If user exists but didn't have googleId linked yet, link it
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.avatar) user.avatar = picture;
      }
      // Google-authenticated accounts are verified by default
      user.isEmailVerified = true;
      await user.save();
    } else {
      // Create user if not registered
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture || '',
        role: role || 'student', // Fallback to student if role not provided
        isApproved: role === 'teacher' ? false : true,
        isEmailVerified: true // verified automatically via Google
      });
    }

    // 3. Issue JWT token
    const token = signToken(user._id);

    return sendSuccess(res, 'Google login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        avatar: user.avatar
      }
    }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Current User Profile (Me)
 */
const getMe = async (req, res, next) => {
  try {
    const user = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isApproved: req.user.isApproved,
      avatar: req.user.avatar
    };
    return sendSuccess(res, 'User profile retrieved', { user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  googleLogin,
  getMe,
  verifyEmail,
  resendVerification
};

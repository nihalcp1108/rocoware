const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const generateToken = (id, email, role) => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET || 'super_secret_complaint_portal_jwt_key_2026_secure_random',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const sendTokenResponse = (admin, statusCode, res) => {
  const token = generateToken(admin._id, admin.email, admin.role);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
};

// @desc    Login portal account
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const trimmedEmail = typeof email === 'string' ? email.trim() : '';

    if (!trimmedEmail && !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email and password',
      });
    }

    if (!trimmedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your password',
      });
    }

    const admin = await Admin.findOne({ email: trimmedEmail.toLowerCase() });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Email is incorrect',
      });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect',
      });
    }

    sendTokenResponse(admin, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout portal account / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Successfully logged out.',
  });
};

// @desc    Get currently logged-in account
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getMe,
  generateToken,
};

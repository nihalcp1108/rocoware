const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;

  // 1. Check HTTP-only cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Check Authorization header (Bearer token)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please log in to access this resource.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_complaint_portal_jwt_key_2026_secure_random');
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Authentication invalid.',
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.warn('[Auth Warning] Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication token is invalid or has expired.',
    });
  }
};

module.exports = { protect };

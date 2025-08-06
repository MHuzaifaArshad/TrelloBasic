const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in the Authorization header (standard practice)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header, removing the "Bearer " prefix
      token = req.headers.authorization.split(' ')[1];
    } catch (error) {
      console.error('Error parsing token from header:', error);
      return res.status(401).json({ message: 'Not authorized, token format invalid' });
    }
  } 
  
  // 2. If no token found in header, check cookies as a fallback
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Check if a token was found at all
  if (!token) {
    console.log('Auth Middleware: No token found.');
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  console.log('Auth Middleware: Token received. Attempting verification...');

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth Middleware: Token decoded successfully. Decoded ID:', decoded.id);

    // Attach user to the request object
    req.user = await User.findById(decoded.id).select('-password');

    // If user is not found (e.g., user deleted from DB), return unauthorized
    if (!req.user) {
      console.log('Auth Middleware: User not found for decoded ID:', decoded.id);
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    console.log('Auth Middleware: User attached to request. User ID:', req.user._id);

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Error in authentication middleware:', error);
    // This will catch 'jwt malformed', 'jwt expired', 'invalid signature', etc.
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };

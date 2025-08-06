const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
    } catch (error) {
      console.error('Error parsing token from header:', error);
      return res.status(401).json({ message: 'Not authorized, token format invalid' });
    }
  } 
  
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  
  if (!token) {
    console.log('Auth Middleware: No token found.');
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  console.log('Auth Middleware: Token received. Attempting verification...');

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth Middleware: Token decoded successfully. Decoded ID:', decoded.id);

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      console.log('Auth Middleware: User not found for decoded ID:', decoded.id);
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    console.log('Auth Middleware: User attached to request. User ID:', req.user._id);

    next(); 
  } catch (error) {
    console.error('Error in authentication middleware:', error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };

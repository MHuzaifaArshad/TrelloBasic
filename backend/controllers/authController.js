// backend/controllers/authController.js
const User = require('../models/User'); 


const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateAuthToken(); // Generate JWT token

  // Options for the cookie 
  const options = {
    expires: new Date(Date.now() + 60 * 60 * 1000), 
    httpOnly: true, 
    secure: false, 
    sameSite: 'Lax', 
  };

  
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    userId: user._id,
    username: user.username, 
    email: user.email,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with that email or username already exists' });
    }

    const user = await User.create({
      username,
      email,
      password, // Password will be hashed by pre-save hook in the User model
    });

    sendTokenResponse(user, 201, res); 
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const user = await User.findOne({ email }).select('+password'); 
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password); 
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res); 
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Logout user 
// @route   POST /api/auth/logout
// @access  Public

const logoutUser = (req, res) => {
  
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), 
    httpOnly: true,
    secure: false, 
    sameSite: 'Lax', // Or 'None' if 'Lax' causes issues in development, but requires secure: true
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser, 
};

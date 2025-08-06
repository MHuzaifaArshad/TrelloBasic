// backend/controllers/authController.js
const User = require('../models/User'); // Import the User model

// Helper function to generate and send JWT token in a cookie and JSON response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateAuthToken(); // Generate JWT token

  // Options for the cookie (e.g., httpOnly, expires)
  const options = {
    expires: new Date(Date.now() + 60 * 60 * 1000), // Expires in 1 hour
    httpOnly: true, // Makes the cookie inaccessible to client-side JavaScript (important for security)
    secure: false, // Set to true in production with HTTPS. For localhost, keep false.
    sameSite: 'Lax', // Or 'None' if 'Lax' causes issues in development, but requires secure: true for cross-site
  };

  // Send the token in a cookie and as part of the JSON response
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    userId: user._id,
    username: user.username, // Assuming username exists on User model
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

    sendTokenResponse(user, 201, res); // Send JWT token upon successful registration
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
    const user = await User.findOne({ email }).select('+password'); // Select password to compare
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password); // Compare provided password with hashed password
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res); // Send JWT token upon successful login
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Public (client-side clears cookie, but backend can also clear it)
const logoutUser = (req, res) => {
  // Clear the 'token' cookie by setting its expiration to a past date
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds (effectively immediately)
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: 'Lax', // Or 'None' if 'Lax' causes issues in development, but requires secure: true
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser, // Export the logoutUser function
};

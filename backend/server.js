const express = require('express');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { initSocket } = require('./utils/socket');

// Import routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotenv.config(); // Load .env for local development
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io and pass the HTTP server
const io = new Server(server, {
  cors: {
    origin: 'YOUR_VERCEL_FRONTEND_URL', // <-- REPLACE THIS AFTER VERCEL DEPLOY!
    credentials: true,
  }
});

// Pass the io instance to our utility function to set up listeners
initSocket(io);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'YOUR_VERCEL_FRONTEND_URL', // <-- REPLACE THIS AFTER VERCEL DEPLOY!
  credentials: true,
}));

// Basic route for testing the server
app.get('/', (req, res) => {
  res.send('Collaboration Tool API is running...');
});

// Mount authentication routes these routes are public
app.use('/api/auth', authRoutes);

// Mount all other routes these are protected by the authMiddleware within each router
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api', chatRoutes);
app.use('/api', notificationRoutes); // Corrected route path to match your API structure

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

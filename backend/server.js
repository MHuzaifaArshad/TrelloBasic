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

dotenv.config(); 
connectDB();

const app = express();
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: 'https://trello-basic-7cnz.vercel.app', 
    credentials: true,
  }
});

initSocket(io);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'https://trello-basic-7cnz.vercel.app', 
  credentials: true,
}));


app.get('/', (req, res) => {
  res.send('Collaboration Tool API is running...');
});


app.use('/api/auth', authRoutes);

app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);
app.use('/api', chatRoutes);
app.use('/api', notificationRoutes); 

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const Message = require('../models/ChatModel'); // Re-import if needed for sendMessage scope
let io;

// This function initializes the socket.io instance and sets up all event listeners
exports.initSocket = (ioInstance) => {
  io = ioInstance;
  console.log('Socket.io: initSocket called. IO instance set.');

  // Listen for new connections
  io.on('connection', (socket) => {
    console.log(`Socket.io: New client connected: ${socket.id}`);

    // Listen for clients to join a project room (for general UI updates)
    socket.on('joinProject', (projectId) => {
      socket.join(projectId);
      console.log(`Socket.io: Client ${socket.id} joined project room: ${projectId}`);
    });

    // Listen for clients to join their personal user room (for individual notifications)
    socket.on('joinUserRoom', (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(`Socket.io: Client ${socket.id} joined personal user room: ${userId}`);
      } else {
        console.warn(`Socket.io: joinUserRoom called with invalid userId from client ${socket.id}`);
      }
    });

    // Listen for chat messages from the client (if chat functionality exists)
    socket.on('sendMessage', async ({ projectId, sender, content }) => {
      console.log('Socket.io: sendMessage received', { projectId, sender, content });
      try {
        const newMessage = new Message({
          project: projectId,
          sender: sender,
          content: content,
        });
        const savedMessage = await newMessage.save();
        
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate('sender', 'username');
        
        io.to(projectId).emit('newMessage', populatedMessage);

      } catch (error) {
        console.error('Socket.io Error: Saving or broadcasting message:', error);
      }
    });

    // Listen for disconnects
    socket.on('disconnect', () => {
      console.log(`Socket.io: Client disconnected: ${socket.id}`);
    });
  });
};

// This function gets the initialized io instance
exports.getIo = () => {
  if (!io) {
    console.error('Socket.io: getIo called before initialization!');
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

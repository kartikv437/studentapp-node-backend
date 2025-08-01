const Message = require('./models/Message');
const User = require('./models/User');

const users = {}; // userId: socket.id

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (userId) => {
      users[userId] = socket.id;
      console.log(`User ${userId} joined with socket ${socket.id}`);
    });

    socket.on('send_message', async ({ sender, receiver, content }) => {
      const message = await Message.create({ sender, receiver, content });

      // Send real-time message to receiver if connected
      const receiverSocketId = users[receiver];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', message);
      }
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of Object.entries(users)) {
        if (socketId === socket.id) {
          delete users[userId];
          break;
        }
      }
      console.log('User disconnected:', socket.id);
    });
  });
};

const socketIO = require('socket.io');

let io = null;
const activeUsers = new Map(); // Map of userId -> Set of socketIds (to support multiple tabs)

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register user session
    socket.on('register', (userId) => {
      if (userId) {
        if (!activeUsers.has(userId)) {
          activeUsers.set(userId, new Set());
        }
        activeUsers.get(userId).add(socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
      }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      for (const [userId, sockets] of activeUsers.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          console.log(`User ${userId} disconnected socket ${socket.id}`);
          if (sockets.size === 0) {
            activeUsers.delete(userId);
          }
          break;
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const sendRealTimeNotification = (userId, notification) => {
  if (!io) return;
  const targetSockets = activeUsers.get(userId.toString());
  if (targetSockets && targetSockets.size > 0) {
    targetSockets.forEach(socketId => {
      io.to(socketId).emit('notification', notification);
    });
    return true;
  }
  return false;
};

module.exports = {
  initSocket,
  getIO,
  sendRealTimeNotification
};

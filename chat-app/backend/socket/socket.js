const { Server } = require('socket.io');
const Message = require('../models/Message');

let io;

// Track online users: Map<socketId, username>
const onlineUsers = new Map();

/**
 * Initialize Socket.io server with event handlers.
 * @param {http.Server} server - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user joining with a username
    socket.on('join', (username) => {
      onlineUsers.set(socket.id, username);
      console.log(`${username} joined the chat`);

      // Broadcast updated online users list to all clients
      io.emit('userList', Array.from(onlineUsers.values()));
    });

    // Handle incoming chat messages via socket (alternative to REST)
    socket.on('sendMessage', (data) => {
      // Messages are persisted via REST API, so socket is only for broadcast
      // This handler exists for direct socket-based sending if needed
      io.emit('receiveMessage', data);
    });

    // Handle typing indicator
    socket.on('typing', (username) => {
      socket.broadcast.emit('typing', username);
    });

    socket.on('stopTyping', (username) => {
      socket.broadcast.emit('stopTyping', username);
    });

    // Handle message delivered status
    socket.on('messageDelivered', async (messageId) => {
      try {
        const updated = await Message.findByIdAndUpdate(
          messageId,
          { status: 'delivered' },
          { new: true }
        );
        if (updated) {
          io.emit('messageStatusUpdate', {
            messageId: updated._id,
            status: 'delivered',
          });
        }
      } catch (error) {
        console.error('Error updating delivered status:', error.message);
      }
    });

    // Handle message read status
    socket.on('messageRead', async (messageIds) => {
      try {
        // Accept single ID or array of IDs
        const ids = Array.isArray(messageIds) ? messageIds : [messageIds];
        await Message.updateMany(
          { _id: { $in: ids }, status: { $ne: 'read' } },
          { status: 'read' }
        );
        // Broadcast status update for each message
        ids.forEach((id) => {
          io.emit('messageStatusUpdate', {
            messageId: id,
            status: 'read',
          });
        });
      } catch (error) {
        console.error('Error updating read status:', error.message);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const username = onlineUsers.get(socket.id);
      onlineUsers.delete(socket.id);
      console.log(`User disconnected: ${socket.id}${username ? ` (${username})` : ''}`);

      // Broadcast updated online users list
      io.emit('userList', Array.from(onlineUsers.values()));
    });

    // Handle socket errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error.message);
    });
  });

  return io;
};

/**
 * Get the current Socket.io server instance.
 * @returns {Server} Socket.io server instance
 * @throws {Error} If socket is not initialized
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocket first.');
  }
  return io;
};

module.exports = { initSocket, getIO };


import { useEffect, useState, useCallback, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

/**
 * Custom hook for Socket.io integration.
 * Manages socket lifecycle, incoming messages, typing indicators,
 * online users, and message read/delivered status.
 *
 * @param {string} username - Current user's display name
 * @returns {Object} Socket state and helper functions
 */
const useSocket = (username) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [newMessage, setNewMessage] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!username) return;

    const socket = connectSocket();

    // Connection events
    const handleConnect = () => {
      setIsConnected(true);
      // Tell the server who we are
      socket.emit('join', username);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // Incoming message
    const handleReceiveMessage = (message) => {
      setNewMessage(message);

      // If this message is from someone else, mark it as delivered
      if (message.name !== username && message._id) {
        socket.emit('messageDelivered', message._id);
      }
    };

    // Online users list
    const handleUserList = (users) => {
      setOnlineUsers(users);
    };

    // Typing indicators
    const handleTyping = (user) => {
      setTypingUsers((prev) => {
        if (prev.includes(user)) return prev;
        return [...prev, user];
      });
    };

    const handleStopTyping = (user) => {
      setTypingUsers((prev) => prev.filter((u) => u !== user));
    };

    // Message status updates (sent → delivered → read)
    const handleStatusUpdate = (data) => {
      setStatusUpdate(data);
    };

    // Register listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('userList', handleUserList);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('messageStatusUpdate', handleStatusUpdate);

    // If already connected (e.g., hot reload), fire join immediately
    if (socket.connected) {
      handleConnect();
    }

    // Cleanup on unmount
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('userList', handleUserList);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('messageStatusUpdate', handleStatusUpdate);
      disconnectSocket();
    };
  }, [username]);

  /**
   * Emit typing event with auto-stop after 2 seconds of inactivity.
   */
  const emitTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket || !username) return;

    socket.emit('typing', username);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', username);
    }, 2000);
  }, [username]);

  /**
   * Emit stop typing event immediately.
   */
  const emitStopTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket || !username) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('stopTyping', username);
  }, [username]);

  /**
   * Mark messages as read. Call this when messages from other users are visible.
   * @param {string[]} messageIds - Array of message IDs to mark as read
   */
  const markAsRead = useCallback((messageIds) => {
    const socket = getSocket();
    if (!socket || !messageIds || messageIds.length === 0) return;
    socket.emit('messageRead', messageIds);
  }, []);

  return {
    isConnected,
    onlineUsers,
    typingUsers,
    newMessage,
    statusUpdate,
    emitTyping,
    emitStopTyping,
    markAsRead,
  };
};

export default useSocket;

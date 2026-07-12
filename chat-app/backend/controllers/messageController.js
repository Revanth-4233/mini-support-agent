const Message = require('../models/Message');
const { getIO } = require('../socket/socket');

/**
 * @desc    Send a new message
 * @route   POST /api/messages
 * @access  Public
 */
const sendMessage = async (req, res, next) => {
  try {
    const { name, message } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Save message to database
    const newMessage = await Message.create({
      name: name.trim(),
      message: message.trim(),
    });

    // Broadcast the new message to all connected clients via Socket.io
    const io = getIO();
    io.emit('receiveMessage', newMessage);

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all messages (chat history)
 * @route   GET /api/messages
 * @access  Public
 */
const getMessages = async (req, res, next) => {
  try {
    // Fetch all messages sorted by oldest first
    const messages = await Message.find().sort({ createdAt: 1 }).lean();

    return res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getMessages };

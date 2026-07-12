const express = require('express');
const router = express.Router();
const { sendMessage, getMessages } = require('../controllers/messageController');

// POST /api/messages — Send a new message
router.post('/', sendMessage);

// GET /api/messages — Fetch chat history
router.get('/', getMessages);

module.exports = router;

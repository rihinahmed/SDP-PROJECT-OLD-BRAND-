// /backend/src/routes/messages.js

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateUser } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateUser);

// Send message (creates conversation if needed)
router.post('/', messageController.sendMessage);

// Get all conversations for current user
router.get('/conversations', messageController.getConversations);

// Get messages in a specific conversation
router.get('/conversation/:id', messageController.getConversationMessages);

module.exports = router;
// src/routes/messages.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateUser } = require('../middleware/auth');

router.get('/conversations', authenticateUser, messageController.getConversations);
router.get('/:conversationId', authenticateUser, messageController.getMessages);
router.post('/', authenticateUser, messageController.sendMessage);
router.put('/:conversationId/read', authenticateUser, messageController.markAsRead);

module.exports = router;
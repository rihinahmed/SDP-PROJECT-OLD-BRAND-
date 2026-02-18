// routes/support.js - Live Chat Support Routes (CORRECTED)

const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticateUser, requireAdmin } = require('../middleware/auth'); // FIXED: Use existing auth middleware

// ============================================
// USER ENDPOINTS
// ============================================

// Get or create support conversation
router.get('/conversation', authenticateUser, supportController.getOrCreateConversation);

// Get messages in conversation
router.get('/conversation/:conversationId/messages', authenticateUser, supportController.getMessages);

// Send message
router.post('/conversation/:conversationId/messages', authenticateUser, supportController.sendMessage);

// Get unread count
router.get('/unread-count', authenticateUser, supportController.getUnreadCount);

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Get all support conversations (Admin only)
router.get('/admin/conversations', authenticateUser, requireAdmin, supportController.getAllConversations);

// Get messages for any conversation (Admin only)
router.get('/admin/conversation/:conversationId/messages', authenticateUser, requireAdmin, supportController.getConversationMessages);

// Send admin reply
router.post('/admin/conversation/:conversationId/reply', authenticateUser, requireAdmin, supportController.sendAdminReply);

// Update conversation status (Admin only)
router.put('/admin/conversation/:conversationId/status', authenticateUser, requireAdmin, supportController.updateConversationStatus);

module.exports = router;
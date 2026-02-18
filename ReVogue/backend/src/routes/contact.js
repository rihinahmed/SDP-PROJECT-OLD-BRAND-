// /backend/src/routes/contact.js - FIXED VERSION

const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticateUser, requireAdmin } = require('../middleware/auth');  // ← Changed isAdmin to requireAdmin

// Public route - anyone can submit contact form
router.post('/', contactController.submitContactForm);

// Protected routes - require authentication
router.get('/my-messages', authenticateUser, contactController.getUserContactMessages);

// Admin-only routes - use requireAdmin instead of isAdmin
router.get('/admin/all', authenticateUser, requireAdmin, contactController.getAllContactMessages);
router.post('/admin/:id/reply', authenticateUser, requireAdmin, contactController.replyToMessage);
router.put('/admin/:id/read', authenticateUser, requireAdmin, contactController.markMessageAsRead);
router.put('/admin/mark-all-read', authenticateUser, requireAdmin, contactController.markAllMessagesAsRead);
router.delete('/admin/:id', authenticateUser, requireAdmin, contactController.deleteContactMessage);

module.exports = router;
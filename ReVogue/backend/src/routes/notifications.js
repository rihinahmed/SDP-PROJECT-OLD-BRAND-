// src/routes/notifications.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateUser } = require('../middleware/auth');

router.get('/', authenticateUser, notificationController.getNotifications);
router.get('/unread-count', authenticateUser, notificationController.getUnreadCount);
router.put('/:id/read', authenticateUser, notificationController.markAsRead);
router.put('/read-all', authenticateUser, notificationController.markAllAsRead);
router.delete('/:id', authenticateUser, notificationController.deleteNotification);

module.exports = router;
// src/routes/dashboard.js - SAFE VERSION - USE THIS
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateUser } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(authenticateUser);

// Dashboard Stats
router.get('/stats', dashboardController.getDashboardStats);

// Listings
router.get('/listings', dashboardController.getUserListings);

// Favorites
router.get('/favorites', dashboardController.getUserFavorites);
router.post('/favorites', dashboardController.addFavorite);
router.delete('/favorites/:id', dashboardController.removeFavorite);

// Purchases
router.get('/purchases', dashboardController.getUserPurchases);

// Notifications
router.get('/notifications', dashboardController.getNotifications);
router.put('/notifications/:id/read', dashboardController.markNotificationRead);
router.put('/notifications/read-all', dashboardController.markAllNotificationsRead);

// Messages
router.get('/messages', dashboardController.getMessages);
router.post('/messages', dashboardController.sendMessage);
router.put('/messages/:id/read', dashboardController.markMessageRead);

module.exports = router;
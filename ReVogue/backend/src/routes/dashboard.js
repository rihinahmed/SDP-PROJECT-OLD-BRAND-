// src/routes/dashboard.js - COMPLETE VERSION
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateUser } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All dashboard routes require authentication
router.use(authenticateUser);

// Dashboard Stats
router.get('/stats', dashboardController.getDashboardStats);

// Listings
router.get('/listings', dashboardController.getUserListings);
router.put('/listings/:id', dashboardController.updateListing);
router.delete('/listings/:id', dashboardController.deleteListing);

// Favorites
router.get('/favorites', dashboardController.getUserFavorites);
router.post('/favorites', dashboardController.addFavorite);
router.delete('/favorites/:id', dashboardController.removeFavorite);

// Purchases
router.get('/purchases', dashboardController.getUserPurchases);

// Profile
router.get('/profile', dashboardController.getUserProfile);
router.put('/profile', dashboardController.updateProfile);
router.post('/avatar', upload.single('avatar'), dashboardController.uploadAvatar);

// Settings
router.get('/settings', dashboardController.getUserSettings);
router.put('/settings', dashboardController.updateSettings);
router.post('/change-password', dashboardController.changePassword);

// Notifications
router.get('/notifications', dashboardController.getNotifications);
router.put('/notifications/:id/read', dashboardController.markNotificationRead);
router.put('/notifications/read-all', dashboardController.markAllNotificationsRead);

// Messages
router.get('/messages', dashboardController.getMessages);
router.post('/messages', dashboardController.sendMessage);
router.put('/messages/:id/read', dashboardController.markMessageRead);

module.exports = router;
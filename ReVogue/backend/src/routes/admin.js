// src/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticateUser);
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', adminController.getStats);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/status', adminController.updateUserStatus);

// Product management
router.get('/products', adminController.getAllProducts);
router.put('/products/:productId/status', adminController.updateProductStatus);
router.delete('/products/:productId', adminController.deleteProduct);

// Order management
router.get('/orders', adminController.getAllOrders);

// Activity log
router.get('/activity', adminController.getActivityLog);

module.exports = router;
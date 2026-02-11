// src/routes/admin.js - COMPLETE WORKING VERSION
const router = require('router')();
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Apply authentication middleware to all admin routes
router.use(authenticateUser);
router.use(requireAdmin);

// Admin dashboard stats
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
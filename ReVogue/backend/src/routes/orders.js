// src/routes/orders.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateUser } = require('../middleware/auth');

// All order routes require authentication
router.use(authenticateUser);

// Create new order
router.post('/', orderController.createOrder);

// Get user's orders
router.get('/', orderController.getUserOrders);

// Get single order
router.get('/:id', orderController.getOrder);

// Update order status (admin only - add admin middleware if needed)
router.put('/:id/status', orderController.updateOrderStatus);

module.exports = router;
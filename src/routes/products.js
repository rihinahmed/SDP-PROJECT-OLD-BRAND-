// src/routes/products.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateUser } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes (no auth required)
// IMPORTANT: Keep this route FIRST before /:id
router.get('/', productController.getAllProducts);

// Protected routes (auth required) - Put these BEFORE /:id
router.post('/', authenticateUser, upload.single('image'), productController.createProduct);

// Specific ID route MUST come last to avoid conflicts
router.get('/:id', productController.getProductById);
router.put('/:id', authenticateUser, upload.single('image'), productController.updateProduct);
router.delete('/:id', authenticateUser, productController.deleteProduct);

module.exports = router;
// src/routes/products.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateUser } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', productController.getAllProducts);
router.get('/my-products', authenticateUser, productController.getUserProducts);
router.get('/favorites', authenticateUser, productController.getFavorites);
router.get('/:id', productController.getProduct);

router.post('/', authenticateUser, upload.single('image'), productController.createProduct);
router.put('/:id', authenticateUser, upload.single('image'), productController.updateProduct);
router.delete('/:id', authenticateUser, productController.deleteProduct);

router.post('/:id/favorite', authenticateUser, productController.addToFavorites);
router.delete('/:id/favorite', authenticateUser, productController.removeFromFavorites);

module.exports = router;
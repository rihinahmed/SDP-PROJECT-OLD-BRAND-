// src/server.js - UPDATED WITH ADMIN ROUTES
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin'); // ADD THIS LINE

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://yourdomain.com' 
        : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5501'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes); // ADD THIS LINE

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'ReVogue API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    // Handle multer errors
    if (err.name === 'MulterError') {
        return res.status(400).json({
            error: 'File upload error',
            message: err.message
        });
    }
    
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ReVogue Backend running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Ready to accept requests!`);
    console.log(`🔐 Admin routes available at /api/admin`);
});

module.exports = app;
// src/middleware/auth.js - COMPLETE VERSION WITH requireAdmin

const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

// Authenticate user middleware
exports.authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', decoded.userId)
            .single();
        
        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
        
        // Attach user to request
        req.user = user;
        next();
        
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
};

// Require admin role middleware
exports.requireAdmin = (req, res, next) => {
    // Check if user has admin role
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Access denied: Admin privileges required'
        });
    }
    
    console.log('✅ Admin access granted:', req.user.email);
    next();
};
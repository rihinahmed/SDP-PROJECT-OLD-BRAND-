// src/controllers/authController.js - COMPLETE VERIFICATION SYSTEM
const { supabase, supabaseAdmin } = require('../config/supabase');
const jwt = require('jsonwebtoken');

// Register new user - STARTS AS PENDING, CAN'T SELL
const register = async (req, res) => {
    try {
        const { email, password, username, fullName } = req.body;

        console.log('=== REGISTRATION ATTEMPT ===');
        console.log('Email:', email);
        console.log('Username:', username);

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        console.log('Creating user in Supabase Auth...');
        
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                username: username || email.split('@')[0],
                full_name: fullName || email.split('@')[0]
            }
        });

        if (error) {
            console.error('Supabase Auth error:', error);
            
            if (error.message.includes('already registered')) {
                return res.status(400).json({
                    success: false,
                    error: 'This email is already registered'
                });
            }
            
            return res.status(400).json({
                success: false,
                error: error.message || 'Registration failed'
            });
        }

        console.log('✅ User created in Auth:', data.user.id);

        // Create profile with PENDING status and can_sell = false
        console.log('Creating profile with PENDING status and selling DISABLED...');
        
        try {
            const { data: profileData, error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: data.user.id,
                    email: email,
                    username: username || email.split('@')[0],
                    full_name: fullName || email.split('@')[0],
                    role: 'user',
                    status: 'pending',  // ← PENDING by default
                    can_sell: false,     // ← CANNOT sell until verified
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (profileError) {
                console.error('Profile creation error:', profileError);
            } else {
                console.log('✅ Profile created:', profileData);
                console.log('Status:', profileData.status);
                console.log('Can sell:', profileData.can_sell);
            }
        } catch (profileException) {
            console.error('Exception during profile creation:', profileException);
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please submit verification documents to start selling.',
            user: {
                id: data.user.id,
                email: data.user.email,
                username: username || email.split('@')[0],
                status: 'pending',
                can_sell: false
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Registration failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
    }
};

// Login user - CHECK STATUS AND CAN_SELL
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('=== LOGIN ATTEMPT ===');
        console.log('Email:', email);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error('Login error:', authError);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        console.log('Login successful for user:', authData.user.id);

        // Get user profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            console.log('Creating missing profile...');
            
            const { data: newProfile } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    email: email,
                    username: authData.user.email.split('@')[0],
                    full_name: authData.user.email.split('@')[0],
                    role: 'user',
                    status: 'pending',
                    can_sell: false
                })
                .select()
                .single();
            
            if (newProfile) {
                console.log('✅ Profile created during login');
            }
        }

        console.log('User status:', profile?.status || 'pending');
        console.log('Can sell:', profile?.can_sell || false);

        // ✅ ALL USERS CAN LOGIN (pending, verified, suspended)
        // Selling restrictions are enforced in frontend only
        
        // CREATE JWT TOKEN
        const jwtToken = jwt.sign(
            { 
                userId: authData.user.id,
                email: authData.user.email,
                role: profile?.role || 'user',
                status: profile?.status || 'pending',
                can_sell: profile?.can_sell || false
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ Created JWT token');

        res.json({
            success: true,
            message: 'Login successful',
            token: jwtToken,
            session: {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token
            },
            user: {
                id: authData.user.id,
                email: authData.user.email,
                user_metadata: authData.user.user_metadata
            },
            profile: profile || {
                id: authData.user.id,
                email: authData.user.email,
                role: 'user',
                status: 'pending',
                can_sell: false
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Login failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
    }
};

// Submit verification documents
const submitVerification = async (req, res) => {
    try {
        const { documents } = req.body;  // Array of document URLs
        const userId = req.user.id;

        console.log('=== SUBMIT VERIFICATION ===');
        console.log('User ID:', userId);
        console.log('Documents:', documents);

        if (!documents || documents.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one document is required'
            });
        }

        // Update profile with verification documents
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({
                verification_documents: documents,
                verification_submitted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Verification documents submitted successfully. Please wait for admin approval.',
            data
        });

    } catch (error) {
        console.error('Submit verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit verification documents'
        });
    }
};

// Get user profile
const getProfile = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) {
            console.error('Get profile error:', error);
            return res.status(404).json({ 
                success: false,
                error: 'Profile not found' 
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch profile' 
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { username, fullName, bio, location } = req.body;

        const { data, error } = await supabase
            .from('profiles')
            .update({
                username,
                full_name: fullName,
                bio,
                location,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) {
            console.error('Update profile error:', error);
            return res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update profile' 
        });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Logout error:', error);
            return res.status(400).json({ 
                success: false,
                error: error.message 
            });
        }

        res.json({ 
            success: true,
            message: 'Logout successful' 
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Logout failed' 
        });
    }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false,
                error: 'Email is required' 
            });
        }

        console.log('Password reset requested for:', email);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5500'}/forgot-password.html`,
        });

        if (error) {
            console.error('Reset password email error:', error);
        }

        res.json({
            success: true,
            message: 'If an account exists with this email, you will receive a password reset link.'
        });
    } catch (error) {
        console.error('Request password reset error:', error);
        res.json({
            success: true,
            message: 'If an account exists with this email, you will receive a password reset link.'
        });
    }
};

// Reset password with token
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Token and password are required' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                error: 'Password must be at least 6 characters long' 
            });
        }

        console.log('Resetting password with token');

        const { data, error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            console.error('Reset password error:', error);
            return res.status(400).json({ 
                success: false,
                error: error.message || 'Failed to reset password' 
            });
        }

        res.json({
            success: true,
            message: 'Password reset successful',
            user: data.user
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to reset password' 
        });
    }
};

module.exports = {
    register,
    login,
    submitVerification,
    getProfile,
    updateProfile,
    logout,
    requestPasswordReset,
    resetPassword
};
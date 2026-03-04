// src/controllers/authController.js
const { supabase, supabaseAdmin } = require('../config/supabase');

// Register new user
const register = async (req, res) => {
    try {
        const { email, password, username, fullName } = req.body;

        console.log('Registering user:', email);

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            console.error('Auth error:', authError);
            return res.status(400).json({ error: authError.message });
        }

        if (!authData.user) {
            return res.status(400).json({ error: 'User creation failed' });
        }

        // Create profile
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    username,
                    full_name: fullName,
                }
            ])
            .select()
            .single();

        if (profileError) {
            console.error('Profile error:', profileError);
            return res.status(400).json({ error: profileError.message });
        }

        res.status(201).json({
            message: 'User registered successfully',
            user: authData.user,
            profile: profileData
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed: ' + error.message });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt:', email);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Login error:', error);
            return res.status(400).json({ error: error.message });
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
        }

        res.json({
            message: 'Login successful',
            session: data.session,
            user: data.user,
            profile: profile || null
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed: ' + error.message });
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
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
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
            return res.status(400).json({ error: error.message });
        }

        res.json({
            message: 'Profile updated successfully',
            profile: data
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Logout error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};

// Add these functions to your existing src/controllers/authController.js

// Request password reset
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        console.log('Password reset requested for:', email);

        // Send password reset email using Supabase
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5500'}/forgot-password.html`,
        });

        if (error) {
            console.error('Reset password email error:', error);
            // Don't reveal if email exists for security
            return res.json({
                message: 'If an account exists with this email, you will receive a password reset link.'
            });
        }

        res.json({
            message: 'Password reset email sent successfully'
        });
    } catch (error) {
        console.error('Request password reset error:', error);
        // Don't reveal if email exists for security
        res.json({
            message: 'If an account exists with this email, you will receive a password reset link.'
        });
    }
};

// Reset password with token
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        console.log('Resetting password with token');

        // Update password using Supabase
        const { data, error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            console.error('Reset password error:', error);
            return res.status(400).json({ error: error.message || 'Failed to reset password' });
        }

        res.json({
            message: 'Password reset successful',
            user: data.user
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

// Update the exports at the bottom of authController.js to include these new functions:
// module.exports = {
//     register,
//     login,
//     getProfile,
//     updateProfile,
//     logout,
//     requestPasswordReset,  // ADD THIS
//     resetPassword          // ADD THIS
// };

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    logout
};
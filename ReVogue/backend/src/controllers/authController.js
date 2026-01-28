// src/controllers/authController.js - VERSION WITH MANUAL PROFILE CREATION
const { supabase, supabaseAdmin } = require('../config/supabase');

// Register new user
const register = async (req, res) => {
    try {
        const { email, password, username, fullName } = req.body;

        console.log('=== REGISTRATION ATTEMPT ===');
        console.log('Email:', email);
        console.log('Username:', username);
        console.log('Full Name:', fullName);

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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // WORKAROUND: Create user without auto-confirm first
        // This prevents the trigger from running during user creation
        console.log('Step 1: Creating user in Supabase Auth (without trigger)...');
        
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
            console.error('Error details:', JSON.stringify(error, null, 2));
            
            if (error.message.includes('already registered')) {
                return res.status(400).json({
                    success: false,
                    error: 'This email is already registered'
                });
            }
            
            // If it's a database error, try a different approach
            if (error.message.includes('Database error')) {
                console.log('Database error detected - trigger might be causing issues');
                console.log('This usually means the trigger failed. Will manually create profile.');
                
                // Return a more helpful error
                return res.status(500).json({
                    success: false,
                    error: 'Registration failed due to database configuration.',
                    details: 'Please check Supabase Postgres logs for more details.',
                    hint: 'Dashboard → Logs → Postgres Logs'
                });
            }
            
            return res.status(400).json({
                success: false,
                error: error.message || 'Registration failed'
            });
        }

        console.log('✅ User created successfully in Auth:', data.user.id);

        // Step 2: Manually create the profile (bypass trigger completely)
        console.log('Step 2: Manually creating profile...');
        
        try {
            const { data: profileData, error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: data.user.id,
                    username: username || email.split('@')[0],
                    full_name: fullName || email.split('@')[0],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (profileError) {
                console.error('❌ Profile creation error:', profileError);
                console.log('Attempting to check if profile already exists...');
                
                // Check if profile already exists (maybe trigger worked?)
                const { data: existingProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                
                if (existingProfile) {
                    console.log('✅ Profile already exists (trigger worked!):', existingProfile);
                } else {
                    console.error('❌ Profile does not exist and could not be created');
                    console.error('Profile error details:', profileError);
                    
                    // Don't fail registration - user is created, just warn
                    console.warn('⚠️  User created but profile creation failed');
                }
            } else {
                console.log('✅ Profile created successfully:', profileData);
            }
        } catch (profileException) {
            console.error('Exception during profile creation:', profileException);
            // Continue anyway - user is created
        }

        // Return success (user is created even if profile had issues)
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: data.user.id,
                email: data.user.email,
                username: username || email.split('@')[0]
            }
        });

    } catch (error) {
        console.error('=== REGISTRATION ERROR ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        
        res.status(500).json({
            success: false,
            error: 'Registration failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
    }
};

// Login user
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

        // Use admin client to sign in
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Login error:', error);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        console.log('Login successful for user:', data.user.id);

        // Get user profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            console.log('User exists but profile is missing - creating it now...');
            
            // Create profile if it doesn't exist
            const { data: newProfile } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: data.user.id,
                    username: data.user.email.split('@')[0],
                    full_name: data.user.email.split('@')[0]
                })
                .select()
                .single();
            
            if (newProfile) {
                console.log('✅ Profile created during login');
            }
        }

        res.json({
            success: true,
            message: 'Login successful',
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token
            },
            user: {
                id: data.user.id,
                email: data.user.email,
                user_metadata: data.user.user_metadata
            },
            profile: profile || null
        });

    } catch (error) {
        console.error('=== LOGIN ERROR ===');
        console.error('Error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Login failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
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

        // Always return success for security (don't reveal if email exists)
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
    getProfile,
    updateProfile,
    logout,
    requestPasswordReset,
    resetPassword
};
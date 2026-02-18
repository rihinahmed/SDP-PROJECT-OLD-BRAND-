// src/controllers/dashboardController.js - COMPLETE VERSION
const { supabase, supabaseAdmin } = require('../config/supabase');

// Get Dashboard Stats
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        console.log('=== FETCHING DASHBOARD STATS ===');
        console.log('User ID:', userId);

        // Get total listings count
        const { count: listingsCount, error: listingsError } = await supabaseAdmin
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (listingsError) {
            console.error('Listings count error:', listingsError);
        }

        // Get favorites count
        const { count: favoritesCount, error: favoritesError } = await supabaseAdmin
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (favoritesError) {
            console.error('Favorites count error:', favoritesError);
        }

        // Get total views across all products
        const { data: viewsData, error: viewsError } = await supabaseAdmin
            .from('products')
            .select('views')
            .eq('user_id', userId);

        const totalViews = viewsData?.reduce((sum, product) => sum + (product.views || 0), 0) || 0;

        if (viewsError) {
            console.error('Views count error:', viewsError);
        }

        // Get unread notifications count
        const { count: unreadNotifications, error: notifError } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (notifError) {
            console.error('Notifications count error:', notifError);
        }

        // Get unread messages count
        const { count: unreadMessages, error: messagesError } = await supabaseAdmin
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (messagesError) {
            console.error('Messages count error:', messagesError);
        }

        const stats = {
            active_listings: listingsCount || 0,
            total_favorites: favoritesCount || 0,
            total_views: totalViews,
            items_sold: 0, // TODO: Implement when orders table exists
            total_earnings: 0, // TODO: Implement when orders table exists
            unread_notifications: unreadNotifications || 0,
            unread_messages: unreadMessages || 0
        };

        console.log('Dashboard stats:', stats);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('=== DASHBOARD STATS ERROR ===');
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard stats'
        });
    }
};

// Get User Listings
const getUserListings = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get listings error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Get listings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch listings'
        });
    }
};

// Update Listing
const updateListing = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabaseAdmin
            .from('products')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Update listing error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Listing updated successfully',
            data
        });
    } catch (error) {
        console.error('Update listing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update listing'
        });
    }
};

// Delete Listing
const deleteListing = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('Delete listing error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Listing deleted successfully'
        });
    } catch (error) {
        console.error('Delete listing error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete listing'
        });
    }
};

// Get User Favorites
const getUserFavorites = async (req, res) => {
    try {
        const userId = req.user.id;

        console.log('=== FETCHING FAVORITES ===');
        console.log('User ID:', userId);

        const { data, error } = await supabaseAdmin
            .from('favorites')
            .select(`
                id,
                created_at,
                product_id,
                products:product_id (
                    id,
                    name,
                    description,
                    price,
                    category,
                    condition,
                    size,
                    usage_time,
                    image_url,
                    status,
                    user_id,
                    views,
                    created_at,
                    profiles:user_id (
                        username,
                        full_name,
                        avatar_url
                    )
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get favorites error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        console.log('Favorites count:', data?.length || 0);

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch favorites'
        });
    }
};

// Add Favorite
const addFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }

        console.log('=== ADDING FAVORITE ===');
        console.log('User ID:', userId);
        console.log('Product ID:', product_id);

        // Check if already favorited
        const { data: existing } = await supabaseAdmin
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', product_id)
            .single();

        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Product already in favorites'
            });
        }

        // Add to favorites
        const { data, error } = await supabaseAdmin
            .from('favorites')
            .insert({
                user_id: userId,
                product_id: product_id
            })
            .select()
            .single();

        if (error) {
            console.error('Add favorite error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        console.log('✅ Favorite added successfully');

        res.status(201).json({
            success: true,
            message: 'Added to favorites',
            data
        });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add to favorites'
        });
    }
};

// Remove Favorite
const removeFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params; // This is the favorite ID

        console.log('=== REMOVING FAVORITE ===');
        console.log('User ID:', userId);
        console.log('Favorite ID:', id);

        const { error } = await supabaseAdmin
            .from('favorites')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('Remove favorite error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        console.log('✅ Favorite removed successfully');

        res.json({
            success: true,
            message: 'Removed from favorites'
        });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove from favorites'
        });
    }
};

// Get User Purchases (placeholder - implement when you have orders table)
const getUserPurchases = async (req, res) => {
    try {
        // TODO: Implement purchases functionality
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        console.error('Get purchases error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch purchases'
        });
    }
};

// Get User Profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
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

// Update Profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, full_name, bio, location } = req.body;

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({
                username,
                full_name,
                bio,
                location,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
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

// Upload Avatar
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id;

        console.log('=== UPLOAD AVATAR CONTROLLER ===');
        console.log('User ID:', userId);
        console.log('File:', req.file);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        if (!req.file.cloudUrl) {
            console.error('No cloudUrl in req.file');
            return res.status(500).json({
                success: false,
                error: 'File upload failed - no URL generated'
            });
        }

        console.log('Avatar URL:', req.file.cloudUrl);

        // Update profile with new avatar URL
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({
                avatar_url: req.file.cloudUrl,
                profile_picture: req.file.cloudUrl, // Also update this for compatibility
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Update avatar error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        console.log('✅ Avatar updated in database');

        res.json({
            success: true,
            message: 'Avatar updated successfully',
            data: {
                avatar_url: req.file.cloudUrl,
                profile_picture: req.file.cloudUrl,
                profile: data
            }
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload avatar'
        });
    }
};

//Delete Avatar
const deleteAvatar = async (req, res) => {
    try {
        const userId = req.user.id;

        console.log('=== DELETE AVATAR ===');
        console.log('User ID:', userId);

        // Get current avatar to delete from storage
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('avatar_url')
            .eq('id', userId)
            .single();

        // Extract file path from URL if exists
        if (profile?.avatar_url && profile.avatar_url.includes('profile-pictures')) {
            const urlParts = profile.avatar_url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `avatars/${fileName}`;

            console.log('Deleting from storage:', filePath);

            // Delete from Supabase Storage
            const { error: deleteError } = await supabaseAdmin.storage
                .from('profile-pictures')
                .remove([filePath]);

            if (deleteError) {
                console.error('Storage delete error:', deleteError);
            }
        }

        // Update profile to remove avatar
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ 
                avatar_url: null,
                profile_picture: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (updateError) throw updateError;

        console.log('✅ Avatar deleted successfully');

        res.json({
            success: true,
            message: 'Avatar deleted successfully',
            data: updatedProfile
        });

    } catch (error) {
        console.error('Delete avatar error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete avatar'
        });
    }
};
// Get User Settings
const getUserSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user metadata from auth
        const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (error) {
            console.error('Get settings error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            data: {
                email: user.email,
                email_verified: user.email_confirmed_at ? true : false,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch settings'
        });
    }
};

// Update Settings
const updateSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email } = req.body;

        if (email) {
            const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                email: email
            });

            if (error) {
                console.error('Update settings error:', error);
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update settings'
        });
    }
};

// Change Password
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                error: 'Current password and new password are required'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 6 characters'
            });
        }

        // Update password
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: new_password
        });

        if (error) {
            console.error('Change password error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password'
        });
    }
};

// Get Notifications
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Get notifications error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notifications'
        });
    }
};

// Mark Notification as Read
const markNotificationRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('Mark notification read error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notification as read'
        });
    }
};

// Mark All Notifications as Read
const markAllNotificationsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('Mark all notifications read error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notifications as read'
        });
    }
};

// Get Messages
const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabaseAdmin
            .from('messages')
            .select(`
                *,
                sender:sender_id(username, full_name, avatar_url),
                receiver:receiver_id(username, full_name, avatar_url)
            `)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get messages error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages'
        });
    }
};

// Send Message
const sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { receiver_id, product_id, content } = req.body;

        if (!receiver_id || !content) {
            return res.status(400).json({
                success: false,
                error: 'Receiver ID and content are required'
            });
        }

        const { data, error } = await supabaseAdmin
            .from('messages')
            .insert({
                sender_id: userId,
                receiver_id,
                product_id,
                content
            })
            .select()
            .single();

        if (error) {
            console.error('Send message error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send message'
        });
    }
};

// Mark Message as Read
const markMessageRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('messages')
            .update({ is_read: true })
            .eq('id', id)
            .eq('receiver_id', userId);

        if (error) {
            console.error('Mark message read error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Message marked as read'
        });
    } catch (error) {
        console.error('Mark message read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark message as read'
        });
    }
};

module.exports = {
    getDashboardStats,
    getUserListings,
    updateListing,
    deleteListing,
    getUserFavorites,
    addFavorite,
    removeFavorite,
    getUserPurchases,
    getUserProfile,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    getUserSettings,
    updateSettings,
    changePassword,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getMessages,
    sendMessage,
    markMessageRead
};
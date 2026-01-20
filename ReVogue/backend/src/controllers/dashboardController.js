// src/controllers/dashboardController.js - COMPLETE VERSION
const { supabase, supabaseAdmin } = require('../config/supabase');

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const { count: activeProducts } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'active');

        const { count: favoritesCount } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        const { data: soldProducts } = await supabase
            .from('products')
            .select('price')
            .eq('user_id', userId)
            .eq('status', 'sold');

        const totalEarnings = soldProducts?.reduce((sum, product) => 
            sum + parseFloat(product.price || 0), 0) || 0;

        res.json({
            success: true,
            data: {
                active_listings: activeProducts || 0,
                total_favorites: favoritesCount || 0,
                items_sold: soldProducts?.length || 0,
                total_earnings: totalEarnings
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard statistics'
        });
    }
};

// Get User's Products/Listings
exports.getUserListings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let query = supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

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
exports.updateListing = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;

        // Verify ownership
        const { data: product } = await supabase
            .from('products')
            .select('user_id')
            .eq('id', id)
            .single();

        if (!product || product.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

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
exports.deleteListing = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Verify ownership
        const { data: product } = await supabase
            .from('products')
            .select('user_id, image_url')
            .eq('id', id)
            .single();

        if (!product || product.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        // Delete image from storage if exists
        if (product.image_url) {
            const imagePath = product.image_url.split('/').pop();
            await supabase.storage
                .from('products')
                .remove([`${userId}/${imagePath}`]);
        }

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

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

// Get User's Favorites
exports.getUserFavorites = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('favorites')
            .select(`
                id,
                created_at,
                product_id,
                products (
                    id,
                    name,
                    price,
                    image_url,
                    condition,
                    status,
                    user_id,
                    profiles (
                        full_name,
                        username
                    )
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

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

// Add to Favorites
exports.addFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }

        // Check if already favorited
        const { data: existing } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', product_id)
            .single();

        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Item already in favorites'
            });
        }

        const { data, error } = await supabase
            .from('favorites')
            .insert([{
                user_id: userId,
                product_id
            }])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Added to favorites',
            data
        });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add favorite'
        });
    }
};

// Remove from Favorites
exports.removeFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Removed from favorites'
        });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove favorite'
        });
    }
};

// Get User's Purchases
exports.getUserPurchases = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                price,
                image_url,
                condition,
                status,
                created_at,
                user_id,
                profiles!products_user_id_fkey (
                    full_name,
                    username
                )
            `)
            .eq('status', 'sold')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedData = data?.map(item => ({
            id: item.id,
            product: {
                id: item.id,
                name: item.name,
                image_url: item.image_url
            },
            price: item.price,
            status: 'Delivered',
            created_at: item.created_at,
            seller: {
                full_name: item.profiles?.full_name,
                username: item.profiles?.username
            }
        })) || [];

        res.json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('Get purchases error:', error);
        res.json({
            success: true,
            data: []
        });
    }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data || {}
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile'
        });
    }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, location, phone, bio } = req.body;

        const updates = {};
        if (full_name !== undefined) updates.full_name = full_name;
        if (location !== undefined) updates.location = location;
        if (phone !== undefined) updates.phone = phone;
        if (bio !== undefined) updates.bio = bio;

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

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
exports.uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const fileExt = file.originalname.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        const { data, error } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                avatar_url: publicUrl
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

// Get User Settings
exports.getUserSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        // Create settings if not exists
        if (!data) {
            const { data: newSettings } = await supabase
                .from('user_settings')
                .insert([{ user_id: userId }])
                .select()
                .single();

            return res.json({
                success: true,
                data: newSettings
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch settings'
        });
    }
};

// Update User Settings
exports.updateSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email_notifications, message_notifications, price_drop_alerts } = req.body;

        const updates = {};
        if (email_notifications !== undefined) updates.email_notifications = email_notifications;
        if (message_notifications !== undefined) updates.message_notifications = message_notifications;
        if (price_drop_alerts !== undefined) updates.price_drop_alerts = price_drop_alerts;

        const { data, error } = await supabase
            .from('user_settings')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data
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
exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                error: 'Current and new password are required'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters'
            });
        }

        // Use admin client to update password
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
            req.user.id,
            { password: new_password }
        );

        if (error) throw error;

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
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.json({
            success: true,
            data: []
        });
    }
};

// Mark Notification as Read
exports.markNotificationRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notification'
        });
    }
};

// Mark All Notifications as Read
exports.markAllNotificationsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw error;

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all notifications error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notifications'
        });
    }
};

// Get Messages
exports.getMessages = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey(id, full_name, username, avatar_url),
                receiver:profiles!messages_receiver_id_fkey(id, full_name, username, avatar_url),
                product:products(id, name, image_url)
            `)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.json({
            success: true,
            data: []
        });
    }
};

// Send Message
exports.sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { receiver_id, product_id, content, conversation_id } = req.body;

        if (!receiver_id || !content) {
            return res.status(400).json({
                success: false,
                error: 'Receiver and content are required'
            });
        }

        const messageData = {
            sender_id: userId,
            receiver_id,
            content,
            conversation_id: conversation_id || `${userId}-${receiver_id}`,
            product_id: product_id || null
        };

        const { data, error } = await supabase
            .from('messages')
            .insert([messageData])
            .select()
            .single();

        if (error) throw error;

        res.json({
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
exports.markMessageRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', id)
            .eq('receiver_id', userId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Message marked as read'
        });
    } catch (error) {
        console.error('Mark message error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark message'
        });
    }
};
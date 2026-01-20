// src/controllers/notificationController.js
const { supabase } = require('../config/supabase');

// Get all notifications for user
const getNotifications = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Get notifications error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) {
            console.error('Mark as read error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json({
            message: 'Notification marked as read',
            data
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', req.user.id)
            .eq('is_read', false);

        if (error) {
            console.error('Mark all as read error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) {
            console.error('Delete notification error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};

// Get unread count
const getUnreadCount = async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', req.user.id)
            .eq('is_read', false);

        if (error) {
            console.error('Get unread count error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json({ count: count || 0 });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
};
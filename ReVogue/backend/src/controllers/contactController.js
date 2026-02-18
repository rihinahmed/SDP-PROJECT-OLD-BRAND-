// /backend/src/controllers/contactController.js - COMPLETE VERSION

const { supabaseAdmin } = require('../config/supabase');

// Submit Contact Form
const submitContactForm = async (req, res) => {
    try {
        const { name, email, subject, message, userId } = req.body;

        console.log('=== CONTACT FORM SUBMISSION ===');
        console.log('Name:', name);
        console.log('Email:', email);
        console.log('Subject:', subject);
        console.log('User ID:', userId || 'Guest');

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address'
            });
        }

        // Insert into contact_messages table
        const { data, error } = await supabaseAdmin
            .from('contact_messages')
            .insert({
                user_id: userId || null,
                sender_name: name,
                sender_email: email,
                subject: subject,
                message: message,
                type: 'contact',
                status: 'unread',
                is_read: false
            })
            .select()
            .single();

        if (error) {
            console.error('Contact form insert error:', error);
            throw error;
        }

        console.log('✅ Contact message saved:', data.id);

        // If user is logged in, create a notification for them confirming receipt
        if (userId) {
            await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: userId,
                    type: 'system',
                    title: 'Message Received',
                    message: `We've received your message: "${subject}". Our team will respond soon!`,
                    is_read: false
                });
        }

        res.status(201).json({
            success: true,
            message: 'Message sent successfully! We will get back to you soon.',
            data
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send message. Please try again.'
        });
    }
};

// Get All Contact Messages (Admin Only)
const getAllContactMessages = async (req, res) => {
    try {
        console.log('=== FETCHING ALL CONTACT MESSAGES (ADMIN) ===');

        const { data, error } = await supabaseAdmin
            .from('contact_messages')
            .select(`
                *,
                user:user_id (
                    id,
                    username,
                    full_name,
                    email,
                    avatar_url
                ),
                replied_by_user:replied_by (
                    id,
                    username,
                    full_name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get contact messages error:', error);
            throw error;
        }

        console.log('✅ Loaded contact messages:', data.length);

        res.json({
            success: true,
            data: data || []
        });

    } catch (error) {
        console.error('Get contact messages error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages'
        });
    }
};

// Reply to Contact Message (Admin Only)
const replyToMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply, recipient_email } = req.body;
        const adminId = req.user.id;

        console.log('=== ADMIN REPLYING TO MESSAGE ===');
        console.log('Message ID:', id);
        console.log('Admin ID:', adminId);

        if (!reply) {
            return res.status(400).json({
                success: false,
                error: 'Reply message is required'
            });
        }

        // Get the original message first
        const { data: originalMessage, error: fetchError } = await supabaseAdmin
            .from('contact_messages')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('Fetch message error:', fetchError);
            throw fetchError;
        }

        // Update the contact message with admin reply
        const { data: messageData, error: updateError } = await supabaseAdmin
            .from('contact_messages')
            .update({
                admin_reply: reply,
                replied_at: new Date().toISOString(),
                replied_by: adminId,
                status: 'replied',
                is_read: true
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Update message error:', updateError);
            throw updateError;
        }

        console.log('✅ Message updated with reply');

        // If the message was from a logged-in user, create a notification
        if (messageData.user_id) {
            console.log('Creating notification for user:', messageData.user_id);

            // Create notification with full reply in metadata
            await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: messageData.user_id,
                    type: 'admin_reply',
                    title: 'Admin Reply: ' + originalMessage.subject,
                    message: `Admin replied to your message about "${originalMessage.subject}"`,
                    is_read: false,
                    metadata: {
                        contact_message_id: id,
                        subject: originalMessage.subject,
                        original_message: originalMessage.message,
                        admin_reply: reply,
                        replied_at: new Date().toISOString()
                    }
                });

            console.log('✅ Notification created with full reply');
        }

        // TODO: Send email notification here
        console.log('📧 Email would be sent to:', recipient_email);

        res.json({
            success: true,
            message: 'Reply sent successfully',
            data: messageData
        });

    } catch (error) {
        console.error('Reply to message error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send reply'
        });
    }
};

// Mark Message as Read (Admin Only)
const markMessageAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('contact_messages')
            .update({ 
                is_read: true,
                status: 'read'
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Message marked as read',
            data
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark as read'
        });
    }
};

// Mark All Messages as Read (Admin Only)
const markAllMessagesAsRead = async (req, res) => {
    try {
        const { error } = await supabaseAdmin
            .from('contact_messages')
            .update({ is_read: true })
            .eq('is_read', false);

        if (error) throw error;

        res.json({
            success: true,
            message: 'All messages marked as read'
        });

    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark all as read'
        });
    }
};

// Delete Contact Message (Admin Only)
const deleteContactMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('contact_messages')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Message deleted successfully'
        });

    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete message'
        });
    }
};

// Get User's Own Contact Messages
const getUserContactMessages = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabaseAdmin
            .from('contact_messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: data || []
        });

    } catch (error) {
        console.error('Get user messages error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages'
        });
    }
};

module.exports = {
    submitContactForm,
    getAllContactMessages,
    replyToMessage,
    markMessageAsRead,
    markAllMessagesAsRead,
    deleteContactMessage,
    getUserContactMessages
};
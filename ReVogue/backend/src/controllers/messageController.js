// src/controllers/messageController.js
const { supabase } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Get conversations
const getConversations = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id (id, username, avatar_url),
                receiver:receiver_id (id, username, avatar_url),
                product:product_id (id, name, image_url)
            `)
            .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Group by conversation_id and get latest message per conversation
        const conversationsMap = new Map();
        
        data.forEach(message => {
            if (!conversationsMap.has(message.conversation_id)) {
                conversationsMap.set(message.conversation_id, {
                    conversation_id: message.conversation_id,
                    lastMessage: message,
                    otherUser: message.sender_id === req.user.id ? message.receiver : message.sender,
                    product: message.product,
                    unreadCount: 0
                });
            }
            
            // Count unread messages
            if (message.receiver_id === req.user.id && !message.is_read) {
                const conv = conversationsMap.get(message.conversation_id);
                conv.unreadCount++;
            }
        });

        const conversations = Array.from(conversationsMap.values());
        
        res.json(conversations);
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
};

// Get messages in a conversation
const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id (id, username, avatar_url),
                receiver:receiver_id (id, username, avatar_url)
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Mark messages as read
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .eq('receiver_id', req.user.id);

        res.json(data);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

// Send message
const sendMessage = async (req, res) => {
    try {
        const { receiverId, productId, content, conversationId } = req.body;

        const newConversationId = conversationId || uuidv4();

        const { data, error } = await supabase
            .from('messages')
            .insert([
                {
                    conversation_id: newConversationId,
                    sender_id: req.user.id,
                    receiver_id: receiverId,
                    product_id: productId || null,
                    content
                }
            ])
            .select(`
                *,
                sender:sender_id (id, username, avatar_url),
                receiver:receiver_id (id, username, avatar_url)
            `)
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Create notification for receiver
        await supabase
            .from('notifications')
            .insert([
                {
                    user_id: receiverId,
                    type: 'message',
                    title: 'New Message',
                    message: `You have a new message`,
                    link: `/messages/${newConversationId}`
                }
            ]);

        res.status(201).json({
            message: 'Message sent successfully',
            data
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// Mark conversation as read
const markAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .eq('receiver_id', req.user.id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
};

module.exports = {
    getConversations,
    getMessages,
    sendMessage,
    markAsRead
};
// /backend/src/controllers/messageController.js - FIXED VERSION

const { supabaseAdmin } = require('../config/supabase');

// Send Message
const sendMessage = async (req, res) => {
    try {
        const { receiver_id, message, product_id, conversation_id } = req.body;
        const sender_id = req.user.id;

        console.log('=== SENDING MESSAGE ===');
        console.log('Sender:', sender_id);
        console.log('Receiver:', receiver_id);
        console.log('Product:', product_id);
        console.log('Conversation:', conversation_id);
        console.log('Message:', message);

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Message cannot be empty'
            });
        }

        let finalConversationId = conversation_id;

        // If no conversation_id, find or create
        if (!finalConversationId) {
            if (!receiver_id) {
                return res.status(400).json({
                    success: false,
                    error: 'receiver_id is required for new conversations'
                });
            }

            // Prevent messaging yourself
            if (sender_id === receiver_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot message yourself'
                });
            }

            // Check if conversation exists
            const { data: existingConv } = await supabaseAdmin
                .from('conversations')
                .select('id')
                .or(`and(user1_id.eq.${sender_id},user2_id.eq.${receiver_id}),and(user1_id.eq.${receiver_id},user2_id.eq.${sender_id})`)
                .maybeSingle();

            if (existingConv) {
                finalConversationId = existingConv.id;
                console.log('✅ Found existing conversation:', finalConversationId);
            } else {
                // Create new conversation
                const { data: newConv, error: convError } = await supabaseAdmin
                    .from('conversations')
                    .insert({
                        user1_id: sender_id,
                        user2_id: receiver_id,
                        product_id: product_id || null
                    })
                    .select()
                    .single();

                if (convError) {
                    console.error('Conversation creation error:', convError);
                    throw convError;
                }

                finalConversationId = newConv.id;
                console.log('✅ Created new conversation:', finalConversationId);
            }
        }

        // Get receiver_id if not provided
        let finalReceiverId = receiver_id;
        if (!finalReceiverId) {
            const { data: conv } = await supabaseAdmin
                .from('conversations')
                .select('user1_id, user2_id')
                .eq('id', finalConversationId)
                .single();
            
            finalReceiverId = conv.user1_id === sender_id ? conv.user2_id : conv.user1_id;
        }

        // Insert message (FIXED: use 'content' instead of 'message')
        const { data: messageData, error: messageError } = await supabaseAdmin
            .from('messages')
            .insert({
                conversation_id: finalConversationId,
                sender_id: sender_id,
                receiver_id: finalReceiverId,
                content: message.trim()  // ← CHANGED from 'message' to 'content'
            })
            .select()
            .single();

        if (messageError) {
            console.error('Message creation error:', messageError);
            throw messageError;
        }

        console.log('✅ Message sent successfully:', messageData.id);

        res.json({
            success: true,
            message: 'Message sent successfully',
            data: {
                ...messageData,
                conversation_id: finalConversationId
            }
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send message'
        });
    }
};

// Get Conversations
const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabaseAdmin
            .from('conversations')
            .select(`
                id,
                user1_id,
                user2_id,
                product_id,
                last_message_at,
                created_at,
                products (
                    id,
                    name,
                    image_url,
                    price
                ),
                user1:profiles!conversations_user1_id_fkey (
                    id,
                    username,
                    full_name,
                    avatar_url
                ),
                user2:profiles!conversations_user2_id_fkey (
                    id,
                    username,
                    full_name,
                    avatar_url
                )
            `)
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .order('last_message_at', { ascending: false });

        if (error) {
            console.error('Get conversations error:', error);
            throw error;
        }

        // Get last message and unread count for each
        const conversationsWithMessages = await Promise.all(
            (data || []).map(async (conv) => {
                // Get last message (FIXED: use 'content' not 'message')
                const { data: lastMsg } = await supabaseAdmin
                    .from('messages')
                    .select('content, created_at, sender_id')
                    .eq('conversation_id', conv.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                // Count unread
                const { count: unreadCount } = await supabaseAdmin
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', conv.id)
                    .eq('receiver_id', userId)
                    .eq('is_read', false);

                // Determine other user
                const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;

                return {
                    id: conv.id,
                    product: conv.products,
                    other_user: otherUser,
                    last_message: lastMsg?.content || 'No messages yet',
                    last_message_at: lastMsg?.created_at || conv.created_at,
                    last_message_sender: lastMsg?.sender_id,
                    unread_count: unreadCount || 0,
                    created_at: conv.created_at
                };
            })
        );

        res.json({
            success: true,
            data: conversationsWithMessages
        });

    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch conversations'
        });
    }
};

// Get Conversation Messages
const getConversationMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify user is part of conversation
        const { data: conversation, error: convError } = await supabaseAdmin
            .from('conversations')
            .select('*, products(*)')
            .eq('id', id)
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .single();

        if (convError || !conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        // Get messages (FIXED: select 'content' not 'message')
        const { data: messages, error: msgError } = await supabaseAdmin
            .from('messages')
            .select(`
                id,
                conversation_id,
                sender_id,
                receiver_id,
                content,
                is_read,
                created_at,
                sender:profiles!messages_sender_id_fkey (
                    id,
                    username,
                    full_name,
                    avatar_url
                )
            `)
            .eq('conversation_id', id)
            .order('created_at', { ascending: true });

        if (msgError) {
            console.error('Get messages error:', msgError);
            throw msgError;
        }

        // Mark as read
        await supabaseAdmin
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', id)
            .eq('receiver_id', userId)
            .eq('is_read', false);

        res.json({
            success: true,
            data: {
                conversation: conversation,
                messages: messages || []
            }
        });

    } catch (error) {
        console.error('Get conversation messages error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch messages'
        });
    }
};

module.exports = {
    sendMessage,
    getConversations,
    getConversationMessages
};
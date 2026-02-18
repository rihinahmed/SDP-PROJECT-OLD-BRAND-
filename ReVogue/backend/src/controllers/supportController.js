// controllers/supportController.js - FIXED VERSION
// Fix: correct supabase import

const { createClient } = require('@supabase/supabase-js');

// Use the same supabase setup as rest of your project
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// ============================================
// USER ENDPOINTS
// ============================================

// Get or create support conversation for user
exports.getOrCreateConversation = async (req, res) => {
    try {
        const userId = req.user.id;

        console.log('=== GET OR CREATE SUPPORT CONVERSATION ===');
        console.log('User ID:', userId);

        // Check if user has an open conversation
        const { data: existingConv, error: searchError } = await supabase
            .from('support_conversations')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (searchError) {
            console.error('Search error:', searchError);
            throw searchError;
        }

        if (existingConv) {
            console.log('✅ Found existing conversation:', existingConv.id);
            return res.json({ success: true, data: existingConv });
        }

        // Create new conversation
        const { data: newConv, error: createError } = await supabase
            .from('support_conversations')
            .insert({
                user_id: userId,
                subject: 'Support Chat',
                status: 'open'
            })
            .select()
            .single();

        if (createError) throw createError;

        console.log('✅ Created new conversation:', newConv.id);

        // Send auto-reply welcome message
        await supabase
            .from('support_messages')
            .insert({
                conversation_id: newConv.id,
                sender_id: userId,
                sender_type: 'system',
                message: 'Hello! 👋 Welcome to ReVogue Support. An admin will be with you shortly. How can we help you today?',
                is_read: true
            });

        res.json({ success: true, data: newConv });

    } catch (error) {
        console.error('Get/Create conversation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get messages in support conversation
exports.getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;

        console.log('=== GET SUPPORT MESSAGES ===');

        // Verify user owns this conversation
        const { data: conversation, error: convError } = await supabase
            .from('support_conversations')
            .select('*')
            .eq('id', conversationId)
            .eq('user_id', userId)
            .single();

        if (convError) {
            return res.status(404).json({ success: false, error: 'Conversation not found' });
        }

        // Get messages
        const { data: messages, error: messagesError } = await supabase
            .from('support_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        console.log('✅ Found messages:', messages.length);

        // Mark admin messages as read
        await supabase
            .from('support_messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .in('sender_type', ['admin', 'system'])
            .eq('is_read', false);

        res.json({ success: true, data: { conversation, messages } });

    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Send message in support conversation
exports.sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { message } = req.body;

        console.log('=== SEND SUPPORT MESSAGE ===');

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        // Verify user owns this conversation
        const { data: conversation, error: convError } = await supabase
            .from('support_conversations')
            .select('*')
            .eq('id', conversationId)
            .eq('user_id', userId)
            .single();

        if (convError) {
            return res.status(404).json({ success: false, error: 'Conversation not found' });
        }

        // Insert message
        const { data: newMessage, error: messageError } = await supabase
            .from('support_messages')
            .insert({
                conversation_id: conversationId,
                sender_id: userId,
                sender_type: 'user',
                message: message.trim()
            })
            .select()
            .single();

        if (messageError) throw messageError;

        console.log('✅ Message sent:', newMessage.id);

        // Notify admins
        const { data: admins } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'admin');

        if (admins && admins.length > 0) {
            await supabase.from('notifications').insert(
                admins.map(admin => ({
                    user_id: admin.id,
                    title: 'New Support Message',
                    message: `${message.substring(0, 60)}${message.length > 60 ? '...' : ''}`,
                    type: 'support',
                    is_read: false
                }))
            );
        }

        res.json({ success: true, data: newMessage });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get unread count for user
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: conversations } = await supabase
            .from('support_conversations')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'open');

        if (!conversations || conversations.length === 0) {
            return res.json({ success: true, data: { unread_count: 0 } });
        }

        const ids = conversations.map(c => c.id);

        const { data: unread } = await supabase
            .from('support_messages')
            .select('id')
            .in('conversation_id', ids)
            .eq('sender_type', 'admin')
            .eq('is_read', false);

        res.json({ success: true, data: { unread_count: unread ? unread.length : 0 } });

    } catch (error) {
        console.error('Unread count error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Get all support conversations (Admin only)
exports.getAllConversations = async (req, res) => {
    try {
        console.log('=== GET ALL SUPPORT CONVERSATIONS (ADMIN) ===');

        // Step 1: Get all conversations
        const { data: conversations, error } = await supabase
            .from('support_conversations')
            .select('*')
            .order('last_message_at', { ascending: false });

        if (error) throw error;

        if (!conversations || conversations.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Step 2: Get all unique user IDs
        const userIds = [...new Set(conversations.map(c => c.user_id))];

        // Step 3: Fetch profiles separately
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, email, avatar_url, profile_picture')
            .in('id', userIds);

        const profileMap = {};
        (profiles || []).forEach(p => { profileMap[p.id] = p; });

        // Step 4: Get unread counts and merge
        const withData = await Promise.all(
            conversations.map(async (conv) => {
                const { data: unread } = await supabase
                    .from('support_messages')
                    .select('id')
                    .eq('conversation_id', conv.id)
                    .eq('sender_type', 'user')
                    .eq('is_read', false);

                return {
                    ...conv,
                    profiles: profileMap[conv.user_id] || null,
                    unread_count: unread ? unread.length : 0
                };
            })
        );

        console.log('✅ Found conversations:', withData.length);
        res.json({ success: true, data: withData });

    } catch (error) {
        console.error('Get all conversations error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
// Get messages for any conversation (Admin only)
exports.getConversationMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        console.log('=== GET CONVERSATION MESSAGES (ADMIN) ===', conversationId);

        // Step 1: Get conversation
        const { data: conversation, error: convError } = await supabase
            .from('support_conversations')
            .select('*')
            .eq('id', conversationId)
            .single();

        if (convError) throw convError;

        // Step 2: Get user profile separately
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, email, avatar_url, profile_picture')
            .eq('id', conversation.user_id)
            .single();

        // Step 3: Get messages
        const { data: messages, error: messagesError } = await supabase
            .from('support_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // Step 4: Mark user messages as read
        await supabase
            .from('support_messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .eq('sender_type', 'user')
            .eq('is_read', false);

        res.json({
            success: true,
            data: {
                conversation: { ...conversation, profiles: profile || null },
                messages
            }
        });

    } catch (error) {
        console.error('Get conversation messages error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Send admin reply
exports.sendAdminReply = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { conversationId } = req.params;
        const { message } = req.body;

        console.log('=== SEND ADMIN REPLY ===');

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        // Get conversation user_id for notification
        const { data: conversation, error: convError } = await supabase
            .from('support_conversations')
            .select('user_id')
            .eq('id', conversationId)
            .single();

        if (convError) throw convError;

        // Insert admin message
        const { data: newMessage, error: messageError } = await supabase
            .from('support_messages')
            .insert({
                conversation_id: conversationId,
                sender_id: adminId,
                sender_type: 'admin',
                message: message.trim()
            })
            .select()
            .single();

        if (messageError) throw messageError;

        console.log('✅ Admin reply sent:', newMessage.id);

        // Notify user
        await supabase.from('notifications').insert({
            user_id: conversation.user_id,
            title: 'Support Reply',
            message: `Support: ${message.substring(0, 60)}${message.length > 60 ? '...' : ''}`,
            type: 'support',
            is_read: false
        });

        res.json({ success: true, data: newMessage });

    } catch (error) {
        console.error('Send admin reply error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update conversation status
exports.updateConversationStatus = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { status } = req.body;

        if (!['open', 'closed', 'resolved'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        const { data, error } = await supabase
            .from('support_conversations')
            .update({ status })
            .eq('id', conversationId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
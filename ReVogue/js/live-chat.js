// /ReVogue/js/live-chat.js - FIXED VERSION

(function() {
    'use strict';
    
    const API_URL = 'http://localhost:3000/api';

    // State
    let state = {
        conversationId: null,
        isOpen: false,
        messages: [],
        refreshInterval: null
    };

    // Get auth headers
    function getHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        console.log('=== LIVE CHAT INITIALIZING ===');

        const token = localStorage.getItem('authToken');

        // Bind all buttons
        const toggleBtn = document.getElementById('liveChatToggle');
        const closeBtn  = document.getElementById('liveChatClose');
        const sendBtn   = document.getElementById('liveChatSend');
        const input     = document.getElementById('liveChatInput');

        if (!toggleBtn) {
            console.error('❌ liveChatToggle button not found');
            return;
        }

        toggleBtn.addEventListener('click', toggleChat);
        if (closeBtn) closeBtn.addEventListener('click', closeChat);
        if (sendBtn)  sendBtn.addEventListener('click', sendMessage);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') sendMessage();
            });
        }

        console.log('✅ Live chat event listeners attached');

        // Load unread count if logged in
        if (token) {
            loadUnreadCount();
            // Auto-refresh unread count every 10s
            state.refreshInterval = setInterval(function() {
                if (state.isOpen && state.conversationId) {
                    pollNewMessages();
                } else {
                    loadUnreadCount();
                }
            }, 10000);
        }
    }

    // ============================================
    // TOGGLE / OPEN / CLOSE
    // ============================================

    async function toggleChat() {
        const box = document.getElementById('liveChatBox');
        if (!box) return;

        if (state.isOpen) {
            closeChat();
        } else {
            openChat();
        }
    }

    async function openChat() {
        const box = document.getElementById('liveChatBox');
        if (!box) return;

        state.isOpen = true;
        box.classList.add('active');

        const token = localStorage.getItem('authToken');

        if (!token) {
            // Not logged in - show login prompt
            renderMessages([{
                sender_type: 'system',
                message: 'Please log in to chat with support.',
                created_at: new Date().toISOString()
            }]);
            return;
        }

        // Get or create conversation
        await getOrCreateConversation();
    }

    function closeChat() {
        const box = document.getElementById('liveChatBox');
        if (box) box.classList.remove('active');
        state.isOpen = false;
    }

    // ============================================
    // CONVERSATION
    // ============================================

    async function getOrCreateConversation() {
        try {
            console.log('=== GETTING CONVERSATION ===');
            showLoading();

            const res = await fetch(`${API_URL}/support/conversation`, {
                headers: getHeaders()
            });

            const data = await res.json();

            if (data.success && data.data) {
                state.conversationId = data.data.id;
                console.log('✅ Conversation ID:', state.conversationId);
                await loadMessages();
            } else {
                console.error('Failed to get conversation:', data);
                showError('Could not connect to support. Please try again.');
            }

        } catch (err) {
            console.error('getOrCreateConversation error:', err);
            showError('Connection failed. Please check your internet.');
        }
    }

    // ============================================
    // MESSAGES
    // ============================================

    async function loadMessages() {
        if (!state.conversationId) return;

        try {
            const res = await fetch(
                `${API_URL}/support/conversation/${state.conversationId}/messages`,
                { headers: getHeaders() }
            );

            const data = await res.json();

            if (data.success && data.data) {
                state.messages = data.data.messages || [];
                renderMessages(state.messages);
                updateBadge(0);
            }

        } catch (err) {
            console.error('loadMessages error:', err);
        }
    }

    async function pollNewMessages() {
        // Just reload messages silently
        if (!state.conversationId) return;

        try {
            const res = await fetch(
                `${API_URL}/support/conversation/${state.conversationId}/messages`,
                { headers: getHeaders() }
            );

            const data = await res.json();

            if (data.success && data.data) {
                const newMessages = data.data.messages || [];

                // Only re-render if there are new messages
                if (newMessages.length !== state.messages.length) {
                    state.messages = newMessages;
                    renderMessages(state.messages);
                }
            }

        } catch (err) {
            // Silently fail
        }
    }

    async function sendMessage() {
        const input = document.getElementById('liveChatInput');
        if (!input) return;

        const text = input.value.trim();
        if (!text) return;

        if (!state.conversationId) {
            await getOrCreateConversation();
            if (!state.conversationId) return;
        }

        try {
            // Optimistic UI
            state.messages.push({
                sender_type: 'user',
                message: text,
                created_at: new Date().toISOString()
            });
            renderMessages(state.messages);
            input.value = '';

            // Send to backend
            const res = await fetch(
                `${API_URL}/support/conversation/${state.conversationId}/messages`,
                {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ message: text })
                }
            );

            const data = await res.json();

            if (!data.success) {
                console.error('Send failed:', data);
                showToast('Failed to send message', 'error');
                // Remove optimistic message
                state.messages.pop();
                renderMessages(state.messages);
                input.value = text;
            }

        } catch (err) {
            console.error('sendMessage error:', err);
            showToast('Failed to send message', 'error');
        }
    }

    // ============================================
    // RENDER
    // ============================================

    function renderMessages(messages) {
        const container = document.getElementById('liveChatMessages');
        if (!container) return;

        if (!messages || messages.length === 0) {
            container.innerHTML = `
                <div class="live-chat-message support">
                    <div class="message-content">
                        <p>Hello! 👋 Welcome to ReVogue Support. How can we help you today?</p>
                        <span class="message-time">Just now</span>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(function(msg) {
            const isSupport = msg.sender_type === 'admin' || msg.sender_type === 'system';
            const time = new Date(msg.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="live-chat-message ${isSupport ? 'support' : 'user'}">
                    <div class="message-content">
                        <p>${escapeHtml(msg.message)}</p>
                        <span class="message-time">${time}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.scrollTop = container.scrollHeight;
    }

    function showLoading() {
        const container = document.getElementById('liveChatMessages');
        if (!container) return;
        container.innerHTML = `
            <div style="text-align:center; padding:2rem; color:#9ca3af; font-size:0.875rem;">
                Connecting to support...
            </div>
        `;
    }

    function showError(msg) {
        const container = document.getElementById('liveChatMessages');
        if (!container) return;
        container.innerHTML = `
            <div style="text-align:center; padding:2rem; color:#ef4444; font-size:0.875rem;">
                ⚠️ ${msg}
            </div>
        `;
    }

    // ============================================
    // UNREAD BADGE
    // ============================================

    async function loadUnreadCount() {
        try {
            const res = await fetch(`${API_URL}/support/unread-count`, {
                headers: getHeaders()
            });
            const data = await res.json();

            if (data.success && data.data) {
                updateBadge(data.data.unread_count || 0);
            }
        } catch (err) {
            // Silently fail
        }
    }

    function updateBadge(count) {
        const badge = document.querySelector('#liveChatToggle .live-chat-badge');
        if (!badge) return;

        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // ============================================
    // UTILS
    // ============================================

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showToast(message, type) {
        const el = document.createElement('div');
        el.textContent = message;
        el.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            padding: 10px 16px;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            border-radius: 8px;
            font-size: 0.875rem;
            z-index: 99999;
        `;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    // ============================================
    // START - Run after DOM is ready
    // ============================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose globally for debugging
    window.liveChatAPI = { open: openChat, close: closeChat, reload: loadMessages };
    window.initLiveChat = init; // Fix "initLiveChat not defined" error

})();
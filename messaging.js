// Mock Data for Notifications
let notifications = [
    {
        id: 1,
        type: 'purchase',
        text: '<strong>Sarah M.</strong> purchased your Vintage Denim Jacket',
        time: '5 min ago',
        unread: true
    },
    {
        id: 2,
        type: 'message',
        text: '<strong>Michael R.</strong> sent you a message',
        time: '1 hour ago',
        unread: true
    },
    {
        id: 3,
        type: 'offer',
        text: '<strong>Emma T.</strong> made an offer on your Designer Handbag',
        time: '3 hours ago',
        unread: true
    },
    {
        id: 4,
        type: 'purchase',
        text: 'Your item "Floral Summer Dress" was delivered',
        time: '1 day ago',
        unread: false
    }
];

// Mock Data for Messages
let conversations = [
    {
        id: 1,
        user: 'Sarah M.',
        avatar: 'SM',
        lastMessage: 'Is this item still available?',
        time: '2m',
        unread: true,
        messages: [
            { sender: 'received', text: 'Hi! Is this item still available?', time: '10:30 AM' },
            { sender: 'sent', text: 'Yes, it is! Would you like more photos?', time: '10:32 AM' },
            { sender: 'received', text: 'Is this item still available?', time: '10:35 AM' }
        ]
    },
    {
        id: 2,
        user: 'Michael R.',
        avatar: 'MR',
        lastMessage: 'Thank you for the quick delivery!',
        time: '1h',
        unread: true,
        messages: [
            { sender: 'received', text: 'I received the item. Thank you!', time: '9:15 AM' },
            { sender: 'sent', text: 'Great! Hope you love it!', time: '9:20 AM' },
            { sender: 'received', text: 'Thank you for the quick delivery!', time: '9:25 AM' }
        ]
    },
    {
        id: 3,
        user: 'Emma T.',
        avatar: 'ET',
        lastMessage: 'Can we negotiate the price?',
        time: '3h',
        unread: false,
        messages: [
            { sender: 'received', text: 'Can we negotiate the price?', time: 'Yesterday' },
            { sender: 'sent', text: 'Sure, what\'s your offer?', time: 'Yesterday' }
        ]
    }
];

// Current open chat
let currentChat = null;

// Render Notifications
function renderNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    
    if (notifications.length === 0) {
        list.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--gray-500);">No notifications</div>';
        return;
    }
    
    list.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.unread ? 'unread' : ''}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type}">
                ${getNotificationIcon(notif.type)}
            </div>
            <div class="notification-content">
                <div class="notification-text">${notif.text}</div>
                <div class="notification-time">${notif.time}</div>
            </div>
        </div>
    `).join('');
    
    updateNotificationBadge();
}

function getNotificationIcon(type) {
    const icons = {
        purchase: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',
        message: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
        offer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>'
    };
    return icons[type] || icons.message;
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    const unreadCount = notifications.filter(n => n.unread).length;
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Render Messages
function renderMessages() {
    const list = document.getElementById('messagesList');
    if (!list) return;
    
    if (conversations.length === 0) {
        list.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--gray-500);">No messages</div>';
        return;
    }
    
    list.innerHTML = conversations.map(conv => `
        <div class="message-item ${conv.unread ? 'unread' : ''}" data-id="${conv.id}">
            <div class="message-avatar">${conv.avatar}</div>
            <div class="message-info">
                <div class="message-header">
                    <span class="message-user">${conv.user}</span>
                    <span class="notification-time">${conv.time}</span>
                </div>
                <div class="message-preview">${conv.lastMessage}</div>
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.message-item').forEach(item => {
        item.addEventListener('click', () => {
            const convId = parseInt(item.dataset.id);
            openChat(convId);
        });
    });
    
    updateMessagesBadge();
}

function updateMessagesBadge() {
    const badge = document.getElementById('messagesBadge');
    const unreadCount = conversations.filter(c => c.unread).length;
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Open Chat
function openChat(conversationId) {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    currentChat = conversation;
    
    // Mark as read
    conversation.unread = false;
    updateMessagesBadge();
    renderMessages();
    
    // Close messages panel
    document.getElementById('messagesPanel').classList.remove('active');
    
    // Show chat modal
    const modal = document.getElementById('chatModal');
    const chatAvatar = document.getElementById('chatAvatar');
    const chatUsername = document.getElementById('chatUsername');
    const chatMessages = document.getElementById('chatMessages');
    
    chatAvatar.textContent = conversation.avatar;
    chatUsername.textContent = conversation.user;
    
    // Render messages
    chatMessages.innerHTML = conversation.messages.map(msg => `
        <div class="chat-message ${msg.sender}">
            <div class="chat-message-content">
                <div class="chat-bubble">${msg.text}</div>
                <span class="chat-time">${msg.time}</span>
            </div>
        </div>
    `).join('');
    
    modal.classList.add('active');
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Focus input
    document.getElementById('chatInput').focus();
}

// Send Message in Chat
function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || !currentChat) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    // Add message to conversation
    currentChat.messages.push({
        sender: 'sent',
        text: message,
        time: timeStr
    });
    
    // Update last message
    currentChat.lastMessage = message;
    currentChat.time = 'Just now';
    
    // Re-render chat
    const chatMessages = document.getElementById('chatMessages');
    const newMessageHTML = `
        <div class="chat-message sent">
            <div class="chat-message-content">
                <div class="chat-bubble">${message}</div>
                <span class="chat-time">${timeStr}</span>
            </div>
        </div>
    `;
    chatMessages.insertAdjacentHTML('beforeend', newMessageHTML);
    
    // Clear input
    input.value = '';
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Simulate response after 2 seconds
    setTimeout(() => {
        const responseTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        currentChat.messages.push({
            sender: 'received',
            text: 'Thanks for your message! I\'ll get back to you soon.',
            time: responseTime
        });
        
        const responseHTML = `
            <div class="chat-message received">
                <div class="chat-message-content">
                    <div class="chat-bubble">Thanks for your message! I'll get back to you soon.</div>
                    <span class="chat-time">${responseTime}</span>
                </div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', responseHTML);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 2000);
}

// Toggle Panels
function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    const allPanels = document.querySelectorAll('.dropdown-panel');
    
    allPanels.forEach(p => {
        if (p.id !== panelId) {
            p.classList.remove('active');
        }
    });
    
    panel.classList.toggle('active');
}

// Live Chat Functions
let liveChatOpen = false;

function toggleLiveChat() {
    liveChatOpen = !liveChatOpen;
    const chatBox = document.getElementById('liveChatBox');
    const toggle = document.getElementById('liveChatToggle');
    const badge = document.querySelector('.live-chat-badge');
    
    if (liveChatOpen) {
        chatBox.classList.add('active');
        toggle.classList.add('active');
        if (badge) badge.style.display = 'none';
    } else {
        chatBox.classList.remove('active');
        toggle.classList.remove('active');
    }
}

function sendLiveChatMessage() {
    const input = document.getElementById('liveChatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const messagesContainer = document.getElementById('liveChatMessages');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    // Add user message
    const userMessageHTML = `
        <div class="live-chat-message user">
            <div class="message-content">
                <p>${message}</p>
                <span class="message-time">${timeStr}</span>
            </div>
        </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', userMessageHTML);
    
    // Clear input
    input.value = '';
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Simulate support response
    setTimeout(() => {
        const responses = [
            'Thank you for reaching out! How can I assist you today?',
            'I\'m here to help! Could you provide more details?',
            'Let me look into that for you right away.',
            'That\'s a great question! Let me find the answer for you.'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const responseTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        
        const supportMessageHTML = `
            <div class="live-chat-message support">
                <div class="message-content">
                    <p>${randomResponse}</p>
                    <span class="message-time">${responseTime}</span>
                </div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', supportMessageHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 1500);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Render initial data
    renderNotifications();
    renderMessages();
    
    // Notification button
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanel('notificationsPanel');
        });
    }
    
    // Messages button
    const messagesBtn = document.getElementById('messagesBtn');
    if (messagesBtn) {
        messagesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanel('messagesPanel');
        });
    }
    
    // Mark all read
    const markAllRead = document.getElementById('markAllRead');
    if (markAllRead) {
        markAllRead.addEventListener('click', () => {
            notifications.forEach(n => n.unread = false);
            renderNotifications();
        });
    }
    
    // Chat modal close
    const closeChatModal = document.getElementById('closeChatModal');
    if (closeChatModal) {
        closeChatModal.addEventListener('click', () => {
            document.getElementById('chatModal').classList.remove('active');
            currentChat = null;
        });
    }
    
    // Send message button
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendChatMessage);
    }
    
    // Chat input enter key
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // Live chat toggle
    const liveChatToggle = document.getElementById('liveChatToggle');
    if (liveChatToggle) {
        liveChatToggle.addEventListener('click', toggleLiveChat);
    }
    
    // Live chat close
    const liveChatClose = document.getElementById('liveChatClose');
    if (liveChatClose) {
        liveChatClose.addEventListener('click', toggleLiveChat);
    }
    
    // Live chat send
    const liveChatSend = document.getElementById('liveChatSend');
    if (liveChatSend) {
        liveChatSend.addEventListener('click', sendLiveChatMessage);
    }
    
    // Live chat input enter key
    const liveChatInput = document.getElementById('liveChatInput');
    if (liveChatInput) {
        liveChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendLiveChatMessage();
            }
        });
    }
    
    // Close panels when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-panel') && !e.target.closest('.icon-btn')) {
            document.querySelectorAll('.dropdown-panel').forEach(panel => {
                panel.classList.remove('active');
            });
        }
    });
    
    // Close modals on outside click
    const chatModal = document.getElementById('chatModal');
    if (chatModal) {
        chatModal.addEventListener('click', (e) => {
            if (e.target === chatModal) {
                chatModal.classList.remove('active');
                currentChat = null;
            }
        });
    }
});
// /ReVogue/js/about.js - COMPLETELY REDESIGNED WITH MODERN MESSAGING
const API_URL = 'http://localhost:3000/api';

// Auth Service
const AuthService = {
    getToken() {
        return localStorage.getItem('authToken');
    },
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    isAuthenticated() {
        return !!this.getToken();
    },
    getHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }
};

// Global State for Messaging
let activeChat = {
    conversationId: null,
    receiverId: null,
    receiverName: null,
    productId: null,
    productName: null,
    productImage: null,
    productPrice: null
};
let notifications = [];
let conversations = [];

// API Service
const API = {
    async getNotifications() {
        const response = await fetch(`${API_URL}/dashboard/notifications`, {
            headers: AuthService.getHeaders()
        });
        if (!response.ok) throw new Error('Failed to load notifications');
        const data = await response.json();
        return data.data || [];
    },

    async getConversations() {
        const response = await fetch(`${API_URL}/messages/conversations`, {
            headers: AuthService.getHeaders()
        });
        if (!response.ok) throw new Error('Failed to load conversations');
        const data = await response.json();
        return data.data || [];
    },

    async getConversationMessages(id) {
        const response = await fetch(`${API_URL}/messages/conversation/${id}`, {
            headers: AuthService.getHeaders()
        });
        if (!response.ok) throw new Error('Failed to load messages');
        const data = await response.json();
        return data.data || data;
    },

    async sendMessage(payload) {
        const response = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: AuthService.getHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to send');
        return await response.json();
    }
};

// ============================================
// MESSAGING & NOTIFICATIONS FUNCTIONS
// ============================================

async function loadUserData() {
    if (!AuthService.isAuthenticated()) return;

    try {
        notifications = await API.getNotifications();
        updateNotificationBadge();
        renderNotificationsList();

        conversations = await API.getConversations();
        updateMessageBadge();
        renderConversationsList();
    } catch (e) {
        console.error('Error loading user data:', e);
    }
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    const count = notifications.filter(n => !n.is_read).length;

    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function updateMessageBadge() {
    const badge = document.getElementById('messagesBadge');
    if (!badge) return;

    const count = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function renderNotificationsList() {
    const list = document.getElementById('notificationsList');
    if (!list) return;

    if (notifications.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 3rem 2rem; color: #9ca3af;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 1rem; opacity: 0.3;">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <h4 style="margin: 0 0 0.5rem 0; color: #6b7280; font-size: 1rem;">No notifications</h4>
                <p style="margin: 0; font-size: 0.875rem;">You're all caught up!</p>
            </div>
        `;
        return;
    }

    list.innerHTML = notifications.map(n => {
        const isUnread = !n.is_read;
        return `
            <div class="notification-item-modern ${isUnread ? 'unread' : ''}">
                <div class="notification-icon-modern">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                </div>
                <div class="notification-content-modern">
                    <div class="notification-title">${n.title}</div>
                    <div class="notification-message">${n.message}</div>
                    <div class="notification-time-modern">${new Date(n.created_at).toLocaleDateString()}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderConversationsList() {
    const list = document.getElementById('messagesList');
    if (!list) return;

    if (conversations.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 3rem 2rem; color: #9ca3af;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 1rem; opacity: 0.3;">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <h4 style="margin: 0 0 0.5rem 0; color: #6b7280; font-size: 1rem;">No messages yet</h4>
                <p style="margin: 0; font-size: 0.875rem;">Start a conversation!</p>
            </div>
        `;
        return;
    }

    list.innerHTML = conversations.map(conv => {
        const other = conv.other_user;
        const name = other?.full_name || other?.username || 'User';
        const initials = name.charAt(0).toUpperCase();
        const unreadClass = conv.unread_count > 0 ? 'unread' : '';

        const safeName = name.replace(/'/g, "\\'");
        const productData = conv.product ? JSON.stringify(conv.product).replace(/"/g, '&quot;') : 'null';

        return `
            <div class="message-item-modern ${unreadClass}" onclick="openChat('${conv.id}', '${safeName}', ${productData})">
                <div class="message-avatar-modern">
                    ${initials}
                    ${conv.unread_count > 0 ? '<div class="message-unread-dot-modern"></div>' : ''}
                </div>
                <div class="message-info-modern">
                    <div class="message-header-modern">
                        <div class="message-user-modern">${name}</div>
                        <div class="message-time-modern">${new Date(conv.last_message_at).toLocaleDateString()}</div>
                    </div>
                    <div class="message-preview-wrapper">
                        ${conv.product ? `<img src="${conv.product.image_url}" class="message-product-thumb">` : ''}
                        <div class="message-preview-modern">${conv.last_message}</div>
                        ${conv.unread_count > 0 ? `<div class="message-badge-modern">${conv.unread_count}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function openChat(conversationId, username, productData) {
    let product = productData;
    if (typeof productData === 'string' && productData !== 'null') {
        try {
            product = JSON.parse(productData.replace(/&quot;/g, '"'));
        } catch (e) {
            product = null;
        }
    }

    activeChat = {
        conversationId: conversationId,
        receiverId: null,
        receiverName: username,
        productId: product?.id || null,
        productName: product?.name || null,
        productImage: product?.image_url || null,
        productPrice: product?.price || null
    };

    document.getElementById('chatUsername').textContent = username;
    document.getElementById('chatAvatar').textContent = username.charAt(0).toUpperCase();
    document.getElementById('chatMessages').innerHTML = '<div style="text-align:center; padding:2rem; color:#9ca3af;">Loading...</div>';

    document.getElementById('chatModal').classList.add('active');
    document.getElementById('messagesPanel')?.classList.remove('active');

    try {
        const data = await API.getConversationMessages(conversationId);
        const msgs = data.messages || [];

        renderChatMessages(msgs, product);
        loadUserData();
    } catch (e) {
        console.error(e);
        document.getElementById('chatMessages').innerHTML = '<div style="text-align:center; color:#ef4444; padding:2rem;">Failed to load messages</div>';
    }
}

function renderChatMessages(msgs, productData = null) {
    const container = document.getElementById('chatMessages');
    const user = AuthService.getUser();

    let html = '';

    // Product card at top
    if (productData && productData.id) {
        html += `
            <div style="text-align: center; margin: 1rem auto 2rem auto; max-width: 350px;">
                <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; border: 2px solid #e5e7eb;">
                    <img src="${productData.image_url}" alt="${productData.name}" style="width: 100%; height: 180px; object-fit: cover;">
                    <div style="padding: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            </svg>
                            <span style="color: #6b7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Product</span>
                        </div>
                        <h4 style="margin: 0 0 0.5rem 0; color: #1f2937; font-size: 0.9375rem; font-weight: 600;">${productData.name}</h4>
                        <p style="margin: 0; color: #a855f7; font-weight: 700; font-size: 1.125rem;">BDT ${parseFloat(productData.price).toFixed(2)}</p>
                    </div>
                </div>
            </div>
        `;
    } else if (activeChat.productId && activeChat.productName) {
        html += `
            <div style="text-align: center; margin: 1rem auto 2rem auto; max-width: 350px;">
                <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; border: 2px solid #e5e7eb;">
                    <img src="${activeChat.productImage}" alt="${activeChat.productName}" style="width: 100%; height: 180px; object-fit: cover;">
                    <div style="padding: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            </svg>
                            <span style="color: #6b7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Product</span>
                        </div>
                        <h4 style="margin: 0 0 0.5rem 0; color: #1f2937; font-size: 0.9375rem; font-weight: 600;">${activeChat.productName}</h4>
                        <p style="margin: 0; color: #a855f7; font-weight: 700; font-size: 1.125rem;">BDT ${parseFloat(activeChat.productPrice).toFixed(2)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (msgs.length === 0) {
        html += `
            <div style="text-align: center; color: #9ca3af; margin-top: 2rem; font-size: 0.875rem;">
                No messages yet. Start the conversation!
            </div>
        `;
    } else {
        html += msgs.map(msg => {
            const isMe = msg.sender_id === user.id;
            const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const messageText = msg.content || msg.message || '';

            return `
                <div class="chat-message-modern ${isMe ? 'sent' : 'received'}">
                    <div class="chat-message-content-modern">
                        <div class="chat-bubble-modern">${escapeHtml(messageText)}</div>
                        <div class="chat-time-modern">${time}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    const container = document.getElementById('chatMessages');

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageHTML = `
        <div class="chat-message-modern sent">
            <div class="chat-message-content-modern">
                <div class="chat-bubble-modern">${escapeHtml(text)}</div>
                <div class="chat-time-modern">${time}</div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', messageHTML);
    container.scrollTop = container.scrollHeight;
    input.value = '';

    try {
        const payload = { message: text };

        if (activeChat.conversationId) {
            payload.conversation_id = activeChat.conversationId;
        } else if (activeChat.receiverId) {
            payload.receiver_id = activeChat.receiverId;
            if (activeChat.productId) payload.product_id = activeChat.productId;
        }

        const res = await API.sendMessage(payload);

        if (res.data && res.data.conversation_id) {
            activeChat.conversationId = res.data.conversation_id;
            loadUserData();
        }
    } catch (e) {
        console.error(e);
        showNotification('Failed to send', 'error');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(msg, type = 'info') {
    const d = document.createElement('div');
    d.className = `notification notification-${type}`;
    d.textContent = msg;
    d.style.cssText = `position:fixed; top:20px; right:20px; padding:15px; background:${type === 'error' ? '#ef4444' : '#10b981'}; color:white; border-radius:8px; z-index:9999; animation: slideIn 0.3s;`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 3000);
}

// ============================================
// ✅ SELL ITEM MODAL HANDLER (NEW)
// ============================================

function openSellModal() {
    // Check if user is authenticated
    if (!AuthService.isAuthenticated()) {
        showNotification('Please login to sell items', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    
    // Redirect to index.html where the sell modal exists
    window.location.href = 'index.html?action=sell';
}

// ============================================
// EVENT LISTENERS
// ============================================

document.getElementById('notificationBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const p = document.getElementById('notificationsPanel');
    p.classList.toggle('active');
    document.getElementById('messagesPanel')?.classList.remove('active');
});

document.getElementById('messagesBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const p = document.getElementById('messagesPanel');
    p.classList.toggle('active');
    document.getElementById('notificationsPanel')?.classList.remove('active');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-panel-modern') && !e.target.closest('.icon-btn')) {
        document.querySelectorAll('.dropdown-panel-modern').forEach(p => p.classList.remove('active'));
    }
});

document.getElementById('sendMessageBtn')?.addEventListener('click', sendChatMessage);
document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});
document.getElementById('closeChatModal')?.addEventListener('click', () => {
    document.getElementById('chatModal').classList.remove('active');
});

// ✅ SELL ITEM BUTTON HANDLER (NEW)
document.getElementById('sellBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    openSellModal();
});

// ============================================
// ORIGINAL ABOUT PAGE CODE
// ============================================

class ScrollReveal {
    constructor() {
        this.init();
    }

    init() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        document.querySelectorAll('.scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-bottom, .scroll-reveal-popup, .scroll-reveal-zoom').forEach(el => {
            observer.observe(el);
        });
    }
}

const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
const particleCount = 60;

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1.5 - 0.75;
        this.speedY = Math.random() * 1.5 - 0.75;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = Math.random() > 0.5 ? '168, 85, 247' : '236, 72, 153';
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
    }

    draw() {
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

initParticles();
animateParticles();

const defaultStats = [
    {
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        value: '150K+',
        label: 'Community Members'
    },
    {
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
        value: '85K+',
        label: 'Treasures Rehomed'
    },
    {
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        value: '450K',
        label: 'kg CO2 Prevented'
    },
    {
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
        value: '4.9/5',
        label: 'Trust Score'
    }
];

const values = [
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        title: 'Radical Sustainability',
        description: "We don't just minimize harm; we actively regenerate. Every sale funds local green initiatives.",
        gradient: 'linear-gradient(135deg, #4ade80 0%, #059669 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
        title: 'Community First',
        description: 'We are powered by you. A collective of rebels, stylists, and changemakers.',
        gradient: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>',
        title: 'Authenticity',
        description: 'No fakes. No fast fashion. Just genuine, high-quality pieces with a story to tell.',
        gradient: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
        title: 'Inclusivity',
        description: 'Style knows no boundaries. We champion fashion for every body, identity, and budget.',
        gradient: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)'
    }
];

const team = [
    { name: 'Sultan Bin Alam', role: 'FrontEnd Engineer and Concept', avatar: '👨' },
    { name: 'Md. Mahfuz Ahmed Rihin', role: 'Full Stack Developer', avatar: '🧙‍♂️' },
    { name: 'Ajmain Taki', role: 'Business Planner and Database', avatar: '🎨' },
    { name: 'Sadequr Rahman', role: 'Backend Developer', avatar: '🌱' }
];

function renderStats() {
    const grid = document.getElementById('statsGrid');
    grid.innerHTML = defaultStats.map((stat, index) => `
        <div class="stat-card">
            <div class="stat-icon">${stat.icon}</div>
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
        </div>
    `).join('');
}

function renderValues() {
    const grid = document.getElementById('valuesGrid');
    grid.innerHTML = values.map((value, index) => `
        <div class="value-card scroll-reveal-bottom">
            <div class="value-icon" style="background: ${value.gradient}">
                ${value.icon}
            </div>
            <h4 class="value-title">${value.title}</h4>
            <p class="value-description">${value.description}</p>
        </div>
    `).join('');
}

function renderTeam() {
    const grid = document.getElementById('teamGrid');
    grid.innerHTML = team.map((member, index) => `
        <div class="team-card scroll-reveal-bottom">
            <div class="team-avatar">${member.avatar}</div>
            <h4 class="team-name">${member.name}</h4>
            <p class="team-role">${member.role}</p>
            <div class="team-social">
                <button class="social-btn">LinkedIn</button>
                <button class="social-btn">GitHub</button>
            </div>
        </div>
    `).join('');
}

function animateStatNumbers() {
    const statCards = document.querySelectorAll('.stat-card');

    statCards.forEach((card, index) => {
        const valueElement = card.querySelector('.stat-value');
        const finalValueStr = valueElement.textContent;
        const numMatch = finalValueStr.match(/(\d+(\.\d+)?)/);

        if (numMatch) {
            const finalValue = parseFloat(numMatch[0]);
            const suffix = finalValueStr.replace(numMatch[0], '');
            let startValue = 0;
            const duration = 2000;
            const startTime = performance.now();

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                const ease = 1 - Math.pow(1 - progress, 4);

                const current = startValue + (finalValue - startValue) * ease;

                const formatted = finalValue % 1 === 0 ? Math.floor(current) : current.toFixed(1);

                valueElement.textContent = formatted + suffix;

                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            }

            requestAnimationFrame(update);
        }
    });
}

function observeStatsNumbers() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStatNumbers();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) observer.observe(statsGrid);
}

document.querySelector('.cta-button')?.addEventListener('click', () => {
    window.location.href = AuthService.isAuthenticated() ? 'shop.html' : 'login.html';
});

// ✅ REMOVED DUPLICATE - Now handled above in event listeners section
// document.getElementById('sellBtn')?.addEventListener('click', () => {
//     window.location.href = AuthService.isAuthenticated() ? 'index.html' : 'login.html';
// });

window.openChat = openChat;

document.addEventListener('DOMContentLoaded', () => {
    renderStats();
    renderValues();
    renderTeam();

    setTimeout(() => {
        new ScrollReveal();
        observeStatsNumbers();
    }, 100);

    if (AuthService.isAuthenticated()) {
        loadUserData();
        setInterval(loadUserData, 15000);
    }
});
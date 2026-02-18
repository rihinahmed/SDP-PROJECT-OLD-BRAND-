// /ReVogue/js/contact.js - COMPLETE VERSION
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
    },
    
    getMultipartHeaders() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
};

// Global State
let notifications = [];
let messages = [];

// Helper: Show notification toast
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 6rem;
        right: 1rem;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : type === 'warning' ? '#eab308' : 'linear-gradient(to right, var(--purple-500), var(--pink-500))'};
        color: white;
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Helper: Show loading spinner
function showLoading(show) {
    if (show) {
        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.innerHTML = `
            <div style="
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f4f6;
                    border-top-color: #a855f7;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
            </div>
        `;
        document.body.appendChild(loader);
    } else {
        document.getElementById('loader')?.remove();
    }
}

// Helper: Format Time
function formatTimeAgo(dateString) {
    if (!dateString) return 'Just now';
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(dateString).toLocaleDateString();
}

// Particle Animation
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 60;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 4 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.color = Math.random() > 0.5 ? '168, 85, 247' : '236, 72, 153';
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
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
}

// Static Data: Contact Methods & FAQs
const contactMethods = [
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
        title: 'Email Us',
        details: 'support@therenewedstudio.com',
        subtext: 'We reply within 24 hours',
        gradient: 'linear-gradient(135deg, #a78bfa 0%, #db2777 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
        title: 'Call Us',
        details: '+880 1332390393',
        subtext: 'Mon-Fri 9AM-6PM',
        gradient: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
        title: 'Visit Us',
        details: 'Pallabi, Mirpur, Dhaka-1216',
        subtext: 'Sustainable Fashion Hub',
        gradient: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
        title: 'Live Chat',
        details: 'Chat with our team',
        subtext: 'Available 24/7',
        gradient: 'linear-gradient(135deg, #4ade80 0%, #059669 100%)'
    }
];

const faqs = [
    { question: 'How do I sell on ReVogue?', answer: 'Click the "Sell Item" button, fill out the listing form with details and photos, and your item will be live!' },
    { question: 'What payment methods do you accept?', answer: 'We accept bKash, Nagad, Rocket, and all major credit cards for secure transactions.' },
    { question: 'How long does shipping take?', answer: 'Delivery within Dhaka takes 1-2 days. Outside Dhaka takes 3-5 business days.' },
    { question: 'What is your return policy?', answer: "We offer a 7-day return policy for items that don't match the description." },
    { question: 'How can I track my order?', answer: 'You will receive a tracking number via email once your order is shipped.' },
    { question: 'Is there a minimum order value?', answer: 'No minimum order value. Buy as little or as much as you like!' }
];

function renderContactMethods() {
    const grid = document.getElementById('contactMethodsGrid');
    if (!grid) return;
    grid.innerHTML = contactMethods.map((method, index) => `
        <div class="contact-method-card" data-index="${index}">
            <div class="contact-method-icon" style="background: ${method.gradient}">${method.icon}</div>
            <h4 class="contact-method-title">${method.title}</h4>
            <p class="contact-method-details">${method.details}</p>
            <p class="contact-method-subtext">${method.subtext}</p>
        </div>
    `).join('');
}

function renderFAQs() {
    const grid = document.getElementById('faqGrid');
    if (!grid) return;
    grid.innerHTML = faqs.map(faq => `
        <div class="faq-card">
            <h4 class="faq-question">${faq.question}</h4>
            <p class="faq-answer">${faq.answer}</p>
        </div>
    `).join('');
}

// User Profile Data Population
async function populateUserData() {
    if (AuthService.isAuthenticated()) {
        try {
            const nameInput = document.querySelector('input[name="name"]');
            const emailInput = document.querySelector('input[name="email"]');
            
            if (nameInput) nameInput.value = 'Loading...';
            if (emailInput) emailInput.value = 'Loading...';
            
            const response = await fetch(`${API_URL}/dashboard/profile`, {
                headers: AuthService.getHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                const profile = data.data || data;
                
                if (nameInput) {
                    nameInput.value = profile.full_name || profile.username || '';
                    nameInput.readOnly = true;
                    nameInput.style.backgroundColor = '#f3f4f6';
                }
                if (emailInput) {
                    emailInput.value = profile.email || '';
                    emailInput.readOnly = true;
                    emailInput.style.backgroundColor = '#f3f4f6';
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }
}

// Forms: Contact & Newsletter
const contactForm = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            name: contactForm.name.value,
            email: contactForm.email.value,
            subject: contactForm.subject.value,
            message: contactForm.message.value,
            userId: AuthService.isAuthenticated() ? AuthService.getUser()?.id : null
        };
        
        try {
            showLoading(true);
            const response = await fetch(`${API_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                contactForm.style.display = 'none';
                successMessage.style.display = 'block';
                showNotification('Message sent successfully!', 'success');
                
                setTimeout(() => {
                    successMessage.style.display = 'none';
                    contactForm.style.display = 'block';
                    contactForm.reset();
                    populateUserData();
                }, 3000);
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            showNotification('Failed to send message.', 'error');
        } finally {
            showLoading(false);
        }
    });
}

const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.querySelector('.newsletter-button').addEventListener('click', async (e) => {
        e.preventDefault();
        const input = newsletterForm.querySelector('.newsletter-input');
        if (input.value && input.value.includes('@')) {
            try {
                showLoading(true);
                await fetch(`${API_URL}/newsletter/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: input.value })
                });
                showNotification('Subscribed successfully!', 'success');
                input.value = '';
            } catch (error) {
                showNotification('Subscription failed.', 'error');
            } finally {
                showLoading(false);
            }
        }
    });
}

// ============================================
// MESSAGING & NOTIFICATIONS (UPDATED LOGIC)
// ============================================

// Load Notifications
async function loadNotifications() {
    try {
        if (!AuthService.isAuthenticated()) return;
        
        const response = await fetch(`${API_URL}/dashboard/notifications`, {
            headers: AuthService.getHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            notifications = data.data || [];
            updateNotificationBadge();
            renderNotifications();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Load Messages
async function loadMessages() {
    try {
        if (!AuthService.isAuthenticated()) return;
        
        const response = await fetch(`${API_URL}/dashboard/messages`, {
            headers: AuthService.getHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            messages = data.data || [];
            updateMessagesBadge();
            renderMessages();
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Badges
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        const unreadCount = notifications.filter(n => !n.is_read).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function updateMessagesBadge() {
    const badge = document.getElementById('messagesBadge');
    const user = AuthService.getUser();
    if (badge && user) {
        const unreadCount = messages.filter(m => !m.is_read && m.receiver_id === user.id).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

// Render Notifications
function renderNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    
    if (notifications.length === 0) {
        list.innerHTML = `<div style="text-align: center; padding: 2rem; color: #9ca3af;">No notifications yet</div>`;
        return;
    }
    
    list.innerHTML = notifications.map(notif => {
        let iconPath = '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>';
        if (notif.type === 'admin_reply') {
            iconPath = '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>';
        } else if (notif.type === 'order_update') {
            iconPath = '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>';
        }

        return `
            <div class="notification-item ${notif.is_read ? '' : 'unread'}" onclick="handleNotificationClick('${notif.id}')">
                <div class="notification-icon ${notif.type}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconPath}</svg>
                </div>
                <div class="notification-content">
                    <div class="notification-text">
                        <strong>${notif.title}</strong><br>
                        ${notif.message.substring(0, 50)}${notif.message.length > 50 ? '...' : ''}
                    </div>
                    <div class="notification-time">${formatTimeAgo(notif.created_at)}</div>
                </div>
                ${!notif.is_read ? '<div style="width: 8px; height: 8px; background: var(--purple-500); border-radius: 50%;"></div>' : ''}
            </div>
        `;
    }).join('');
}

// Render Messages
function renderMessages() {
    const list = document.getElementById('messagesList');
    if (!list) return;
    const user = AuthService.getUser();
    
    if (messages.length === 0) {
        list.innerHTML = `<div style="text-align: center; padding: 2rem; color: #9ca3af;">No messages yet</div>`;
        return;
    }
    
    list.innerHTML = messages.map(msg => {
        const isUnread = !msg.is_read && msg.receiver_id === user?.id;
        const otherUser = msg.sender_id === user?.id ? msg.receiver_name : msg.sender_name;
        const initials = otherUser ? otherUser.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
        
        return `
            <div class="message-item ${isUnread ? 'unread' : ''}" onclick="openChat('${msg.conversation_id}', '${otherUser}')">
                <div class="message-avatar">${initials}</div>
                <div class="message-info">
                    <div class="message-header">
                        <div class="message-user">${otherUser}</div>
                        <div class="notification-time">${formatTimeAgo(msg.created_at)}</div>
                    </div>
                    <div class="message-preview">${msg.message}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ** MAIN LOGIC: Notification Click Handler **
async function handleNotificationClick(notifId) {
    const notif = notifications.find(n => n.id === notifId);
    if (!notif) return;

    // 1. Mark as read immediately (Frontend update)
    if (!notif.is_read) {
        notif.is_read = true;
        updateNotificationBadge();
        renderNotifications();
        
        // Background API call to persist read status
        fetch(`${API_URL}/dashboard/notifications/${notifId}/read`, {
            method: 'PUT',
            headers: AuthService.getHeaders()
        }).catch(err => console.error('Failed to mark read', err));
    }

    // 2. Prepare Popup Content
    let modalTitle = notif.title;
    let modalBody = '';
    
    // Safely parse metadata
    let meta = {};
    if (typeof notif.metadata === 'string') {
        try { meta = JSON.parse(notif.metadata); } catch(e) {}
    } else if (notif.metadata) {
        meta = notif.metadata;
    }

    // Case A: Admin Reply
    if (notif.type === 'admin_reply' && meta.admin_reply) {
        modalTitle = 'Admin Response';
        modalBody = `
            <div class="notif-section">
                <div class="notif-label">Subject</div>
                <div class="notif-value">${meta.subject || 'Inquiry'}</div>
            </div>
            <div class="notif-section">
                <div class="notif-label">Your Message</div>
                <div class="notif-message-box">"${meta.original_message || '...'}"</div>
            </div>
            <div class="admin-reply-box">
                <div class="reply-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    ReVogue Support Team
                </div>
                <div class="reply-content">${meta.admin_reply}</div>
                <div class="reply-footer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Replied ${formatTimeAgo(notif.created_at)}
                </div>
            </div>
        `;
    } 
    // Case B: Order Update
    else if (notif.type === 'order_update') {
        modalTitle = 'Order Update';
        modalBody = `
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="width: 60px; height: 60px; background: var(--green-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: var(--green-700);">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">${notif.title}</h3>
                <p style="color: var(--gray-600);">${notif.message}</p>
            </div>
            ${meta.order_id ? `<div style="background: var(--gray-50); padding: 1rem; border-radius: 0.5rem; display: flex; justify-content: space-between;"><span style="font-weight: 600;">Order ID:</span><span>#${meta.order_id}</span></div>` : ''}
        `;
    } 
    // Case C: Generic / System
    else {
        modalBody = `
            <div class="notif-message-box" style="background: white; border: none; padding: 0;">
                <p style="font-size: 1.1rem; line-height: 1.6; color: var(--gray-800);">${notif.message}</p>
                <div style="margin-top: 1rem; color: var(--gray-500); font-size: 0.85rem;">Received: ${new Date(notif.created_at).toLocaleString()}</div>
            </div>
        `;
    }

    // 3. Open Modal
    openPopupModal(modalTitle, modalBody, notif.type === 'admin_reply');
}

function openPopupModal(title, bodyContent, showCopyBtn = false) {
    const existingModal = document.getElementById('dynamicNotificationModal');
    if (existingModal) existingModal.remove();

    const modalHTML = `
        <div id="dynamicNotificationModal" class="modal active" style="z-index: 9999;">
            <div class="modal-content modal-notification">
                <div class="notif-modal-header">
                    <h3 class="notif-modal-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        ${title}
                    </h3>
                    <button class="notif-close-btn" onclick="document.getElementById('dynamicNotificationModal').remove()">×</button>
                </div>
                <div class="notif-modal-body">${bodyContent}</div>
                <div class="notif-modal-footer">
                    <button class="btn-secondary" onclick="document.getElementById('dynamicNotificationModal').remove()">Close</button>
                    ${showCopyBtn ? `<button class="submit-button" style="width: auto; padding: 0.6rem 1.2rem;" onclick="copyReplyText(this)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy Text</button>` : ''}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('dynamicNotificationModal').addEventListener('click', (e) => {
        if (e.target.id === 'dynamicNotificationModal') e.target.remove();
    });
}

function copyReplyText(btn) {
    const content = document.querySelector('.reply-content')?.innerText;
    if (content) {
        navigator.clipboard.writeText(content).then(() => {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>Copied!</span>';
            setTimeout(() => btn.innerHTML = originalText, 2000);
        });
    }
}

// Mark All Read
document.getElementById('markAllRead')?.addEventListener('click', async () => {
    try {
        await fetch(`${API_URL}/dashboard/notifications/read-all`, {
            method: 'PUT',
            headers: AuthService.getHeaders()
        });
        notifications.forEach(n => n.is_read = true);
        updateNotificationBadge();
        renderNotifications();
        showNotification('All marked as read', 'success');
    } catch (error) {
        console.error(error);
    }
});

// Chat Modal Logic
function openChat(conversationId, username) {
    document.getElementById('chatUsername').textContent = username;
    document.getElementById('chatAvatar').textContent = username.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('chatModal').classList.add('active');
    document.getElementById('messagesPanel').classList.remove('active');
    loadConversation(conversationId);
}

async function loadConversation(conversationId) {
    try {
        const response = await fetch(`${API_URL}/messages/conversation/${conversationId}`, {
            headers: AuthService.getHeaders()
        });
        if (response.ok) {
            const data = await response.json();
            renderChatMessages(data.data || []);
        }
    } catch (error) { console.error(error); }
}

function renderChatMessages(msgs) {
    const container = document.getElementById('chatMessages');
    const user = AuthService.getUser();
    container.innerHTML = msgs.map(msg => `
        <div class="chat-message ${msg.sender_id === user?.id ? 'sent' : 'received'}">
            <div class="chat-message-content">
                <div class="chat-bubble">${msg.message}</div>
                <div class="chat-time">${formatTimeAgo(msg.created_at)}</div>
            </div>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

document.getElementById('sendMessageBtn')?.addEventListener('click', sendChatMessage);
document.getElementById('chatInput')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;
    
    const container = document.getElementById('chatMessages');
    container.innerHTML += `<div class="chat-message sent"><div class="chat-message-content"><div class="chat-bubble">${message}</div><div class="chat-time">Just now</div></div></div>`;
    input.value = '';
    container.scrollTop = container.scrollHeight;
    
    try {
        await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: AuthService.getHeaders(),
            body: JSON.stringify({ message })
        });
    } catch (error) { console.error(error); }
}

document.getElementById('closeChatModal')?.addEventListener('click', () => {
    document.getElementById('chatModal').classList.remove('active');
});

// Panel Toggles
document.getElementById('notificationBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('notificationsPanel').classList.toggle('active');
    document.getElementById('messagesPanel').classList.remove('active');
});

document.getElementById('messagesBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('messagesPanel').classList.toggle('active');
    document.getElementById('notificationsPanel').classList.remove('active');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-panel') && !e.target.closest('.icon-btn')) {
        document.querySelectorAll('.dropdown-panel').forEach(p => p.classList.remove('active'));
    }
});

// Sell Modal Logic
const sellModal = document.getElementById('sellModal');
document.getElementById('sellBtn')?.addEventListener('click', () => {
    if (!AuthService.isAuthenticated()) {
        showNotification('Please login to sell', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    const user = AuthService.getUser();
    if (user && !user.can_sell) {
        showNotification('You are not authorized to sell products', 'error');
        return;
    }
    sellModal.classList.add('active');
});

document.getElementById('closeSellModal')?.addEventListener('click', () => sellModal.classList.remove('active'));
document.getElementById('cancelSell')?.addEventListener('click', () => sellModal.classList.remove('active'));

// Sell Form Submit
document.getElementById('sellForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        showLoading(true);
        const formData = new FormData();
        formData.append('name', document.getElementById('productName').value);
        formData.append('description', document.getElementById('productDescription').value);
        formData.append('price', document.getElementById('productPrice').value);
        formData.append('category', document.getElementById('productCategory').value);
        formData.append('condition', document.getElementById('productCondition').value);
        formData.append('size', document.getElementById('productSize').value);
        formData.append('usageTime', document.getElementById('productUsageTime').value);
        const img = document.getElementById('imageInput').files[0];
        if (img) formData.append('image', img);

        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: AuthService.getMultipartHeaders(),
            body: formData
        });

        if (response.ok) {
            showNotification('Product listed!', 'success');
            sellModal.classList.remove('active');
            e.target.reset();
        } else throw new Error('Failed to create');
    } catch (err) {
        showNotification(err.message, 'error');
    } finally {
        showLoading(false);
    }
});

// Init
document.addEventListener('DOMContentLoaded', () => {
    renderContactMethods();
    renderFAQs();
    populateUserData();
    if (AuthService.isAuthenticated()) {
        loadNotifications();
        loadMessages();
        setInterval(() => { loadNotifications(); loadMessages(); }, 30000);
    }
});

// Make helper functions available globally
window.handleNotificationClick = handleNotificationClick;
window.copyReplyText = copyReplyText;
// js/dashboard.js - COMPLETE FINAL VERSION WITH FIXES
const API_URL = 'http://localhost:3000/api';

let ordersData = [];
let salesOrdersData = [];
let activeChat = {
    conversationId: null,
    receiverId: null,
    receiverName: null,
    productId: null,
    productName: null,
    productImage: null,
    productPrice: null
};
let conversations = [];

// Auth Service
const AuthService = {
    getToken() {
        return localStorage.getItem('authToken');
    },
    
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    // ✅ ADD THIS METHOD - was missing!
    isAuthenticated() {
        return !!this.getToken();
    },
    
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('revogueUser');
        sessionStorage.removeItem('revogueUser');
        window.location.href = 'login.html';
    }
};

// Global state
let currentUser = null;
let myListingsData = [];
let favoritesData = [];
let purchasesData = [];
let notificationsData = [];
let messagesData = [];
let userSettings = null;

// API Helper
async function apiRequest(endpoint, options = {}) {
    const token = AuthService.getToken();
    
    const headers = {
        ...options.headers
    };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        
        if (error.message.includes('token') || error.message.includes('auth')) {
            showNotification('Session expired. Please login again.', 'error');
            setTimeout(() => AuthService.logout(), 2000);
        }
        
        throw error;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function loadNotifications() {
    try {
        console.log('=== LOADING NOTIFICATIONS ===');
        
        const response = await apiRequest('/dashboard/notifications');
        notificationsData = response.data || [];
        
        console.log('Loaded notifications:', notificationsData.length);
        
        updateNotificationBadge();
        renderNotificationsList();
    } catch (error) {
        console.error('Error loading notifications:', error);
        notificationsData = [];
    }
}
async function loadMessages() {
    try {
        console.log('=== LOADING MESSAGES (CONVERSATIONS) ===');
        
        const response = await apiRequest('/messages/conversations');
        conversations = response.data || [];
        messagesData = conversations; // Keep for compatibility
        
        console.log('Loaded conversations:', conversations.length);
        
        updateMessagesBadge();
        renderConversationsList();
    } catch (error) {
        console.error('Error loading messages:', error);
        conversations = [];
        messagesData = [];
    }
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    const unreadCount = notificationsData.filter(n => !n.is_read).length;
    
    console.log('📬 Notification badge:', unreadCount);
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function updateMessagesBadge() {
    const badge = document.getElementById('messagesBadge');
    if (!badge) return;
    
    // Sum up unread counts from all conversations
    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    
    console.log('💬 Messages badge:', totalUnread);
    
    if (totalUnread > 0) {
        badge.textContent = totalUnread;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function renderNotificationsList() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    
    if (!notificationsData || notificationsData.length === 0) {
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
    
    list.innerHTML = notificationsData.map(n => {
        const isUnread = !n.is_read;
        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" onclick="markNotificationRead('${n.id}')">
                <div class="notification-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                </div>
                <div class="notification-content">
                    <div class="notification-text">
                        <strong>${n.title}</strong><br>
                        ${n.message}
                    </div>
                    <div class="notification-time">${formatRelativeTime(n.created_at)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderConversationsList() {
    const list = document.getElementById('messagesList');
    if (!list) return;
    
    if (!conversations || conversations.length === 0) {
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
        
        // Escape for onclick
        const safeName = name.replace(/'/g, "\\'");
        // Handle product context safely
        const productData = conv.product ? JSON.stringify(conv.product).replace(/"/g, '&quot;') : 'null';
        
        return `
            <div class="message-item ${unreadClass}" onclick="openChat('${conv.id}', '${safeName}', ${productData})">
                <div class="message-avatar">${initials}</div>
                <div class="message-info">
                    <div class="message-header">
                        <div class="message-user">${name}</div>
                        <div class="notification-time">${formatRelativeTime(conv.last_message_at)}</div>
                    </div>
                    <div class="message-preview" style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${conv.product ? '📦 ' : ''}${conv.last_message}
                        </span>
                        ${conv.unread_count > 0 ? `<span class="message-badge">${conv.unread_count}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatRelativeTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return time.toLocaleDateString();
}

async function markNotificationRead(notificationId) {
    try {
        await apiRequest(`/dashboard/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
        
        // Update local state
        const notif = notificationsData.find(n => n.id === notificationId);
        if (notif) {
            notif.is_read = true;
            updateNotificationBadge();
            renderNotificationsList();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
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
    
    // Set Active Context
    activeChat = {
        conversationId: conversationId,
        receiverId: null,
        receiverName: username,
        productId: product?.id || null,
        productName: product?.name || null,
        productImage: product?.image_url || null,
        productPrice: product?.price || null
    };
    
    // Setup UI
    document.getElementById('chatUsername').textContent = username;
    document.getElementById('chatAvatar').textContent = username.charAt(0).toUpperCase();
    document.getElementById('chatMessages').innerHTML = '<div style="text-align:center; padding:2rem; color:#9ca3af;">Loading...</div>';
    
    // Show Modal, Hide Dropdown
    document.getElementById('chatModal').classList.add('active');
    document.getElementById('messagesPanel')?.classList.remove('active');
    
    // Load Messages
    try {
        const response = await apiRequest(`/messages/conversation/${conversationId}`);
        const data = response.data || response;
        const msgs = data.messages || [];
        
        // Render with product card at top if product exists
        renderChatMessages(msgs, product);
        
        // Refresh to update unread counts
        await loadMessages();
    } catch (e) {
        console.error(e);
        document.getElementById('chatMessages').innerHTML = '<div style="text-align:center; color:#ef4444; padding:2rem;">Failed to load messages</div>';
    }
}

function renderChatMessages(msgs, productData = null) {
    const container = document.getElementById('chatMessages');
    const user = currentUser;
    
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
    
    // Messages
    if (msgs.length === 0) {
        html += `
            <div style="text-align: center; color: #9ca3af; margin-top: 2rem; font-size: 0.875rem;">
                No messages yet. Start the conversation!
            </div>
        `;
    } else {
        html += msgs.map(msg => {
            const isMe = msg.sender_id === user.id || msg.sender_id === user.profile?.id;
            const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const messageText = msg.content || msg.message || '';
            
            return `
                <div class="chat-message ${isMe ? 'sent' : 'received'}">
                    <div class="chat-message-content">
                        <div class="chat-bubble">${escapeHtml(messageText)}</div>
                        <div class="chat-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

// Send Chat Message - NEW
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    
    const container = document.getElementById('chatMessages');
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageHTML = `
        <div class="chat-message sent">
            <div class="chat-message-content">
                <div class="chat-bubble">${escapeHtml(text)}</div>
                <div class="chat-time">${time}</div>
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
        
        const res = await apiRequest('/messages', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        if (res.data && res.data.conversation_id) {
            activeChat.conversationId = res.data.conversation_id;
            await loadMessages();
        }
    } catch (e) {
        console.error(e);
        showNotification('Failed to send', 'error');
    }
}

// Helper: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize Dashboard
async function initDashboard() {
    try {
        showLoading(true);
        
        if (!AuthService.getToken()) {
            showNotification('Please login to access dashboard', 'error');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        const storedUser = localStorage.getItem('revogueUser') || sessionStorage.getItem('revogueUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            updateProfileUI();
        }

        await Promise.all([
            loadProfile(),
            loadStats(),
            loadListings(),
            loadFavorites(),
            loadPurchases(),
            loadOrders(),
            loadNotifications(),
            loadMessages(),
            loadSettings(),
            loadSalesOrders()
        ]);
        
        renderMyListings();
        renderFavorites();
        renderPurchases();
        renderSettings();
        renderSalesOrders();
        renderOrders(); 
        
        setTimeout(() => {
            initializeSettingsListeners();
            updateNotificationBadge();
            updateMessagesBadge();
        }, 100);
        
        showLoading(false);
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showError('Failed to load dashboard data');
        showLoading(false);
    }
}

function renderSalesOrders(filterStatus = 'all') {
    const list = document.getElementById('salesOrdersList');
    if (!list) {
        console.error('❌ salesOrdersList element not found');
        return;
    }
    
    console.log('=== RENDERING SALES ORDERS ===');
    console.log('Total orders:', salesOrdersData.length);
    console.log('Filter status:', filterStatus);
    
    // Filter orders based on status
    let filteredOrders = salesOrdersData;
    if (filterStatus !== 'all') {
        filteredOrders = salesOrdersData.filter(order => order.status === filterStatus);
        console.log('Filtered orders:', filteredOrders.length);
    }
    
    if (!filteredOrders || filteredOrders.length === 0) {
        console.log('⚠️ No orders to display');
        list.innerHTML = `
            <div class="sales-empty-state">
                <div class="sales-empty-icon">📦</div>
                <h3 class="empty-title">No sales orders ${filterStatus !== 'all' ? 'with status "' + filterStatus + '"' : 'yet'}</h3>
                <p class="empty-description">${filterStatus !== 'all' ? 'Try changing the filter above' : 'Orders for your products will appear here'}</p>
                ${salesOrdersData.length > 0 ? '<p style="color: #6b7280; margin-top: 1rem;">💡 Try selecting "All Orders" from the filter</p>' : ''}
            </div>
        `;
        return;
    }
    
    console.log('✅ Rendering', filteredOrders.length, 'orders');
    
    // ... rest of rendering code
}

async function updateSalesOrderStatus(orderId, newStatus) {
    const order = salesOrdersData.find(o => o.id === orderId);
    if (!order) return;
    
    const confirmMessage = `Change order status to "${newStatus.toUpperCase()}"?\n\nOrder: #${order.order_number}\nCustomer: ${order.customer_first_name} ${order.customer_last_name}`;
    
    if (!confirm(confirmMessage)) {
        // Reset select to original value
        const select = document.querySelector(`[data-order-id="${orderId}"] .sales-order-status-select`);
        if (select) select.value = order.status;
        return;
    }
    
    try {
        showLoading(true);
        
        console.log('=== UPDATING ORDER STATUS ===');
        console.log('Order ID:', orderId);
        console.log('New Status:', newStatus);
        
        const response = await apiRequest(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ 
                status: newStatus,
                // If delivered, mark payment as completed
                ...(newStatus === 'delivered' && { payment_status: 'paid' })
            })
        });
        
        if (response.success) {
            showNotification(`Order status updated to ${newStatus}`, 'success');
            
            // Update local data
            const orderIndex = salesOrdersData.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                salesOrdersData[orderIndex].status = newStatus;
                if (newStatus === 'delivered') {
                    salesOrdersData[orderIndex].payment_status = 'paid';
                }
            }
            
            // Re-render with current filter
            const filterSelect = document.getElementById('salesStatusFilter');
            const currentFilter = filterSelect ? filterSelect.value : 'all';
            renderSalesOrders(currentFilter);
        }
    } catch (error) {
        console.error('Update status error:', error);
        showNotification(error.message || 'Failed to update status', 'error');
        
        // Reset select to original value
        const select = document.querySelector(`[data-order-id="${orderId}"] .sales-order-status-select`);
        if (select) select.value = order.status;
    } finally {
        showLoading(false);
    }
}

// Cancel Sales Order
async function cancelSalesOrder(orderId) {
    const order = salesOrdersData.find(o => o.id === orderId);
    if (!order) return;
    
    const confirmed = confirm(
        `⚠️ CANCEL ORDER ⚠️\n\n` +
        `Order: #${order.order_number}\n` +
        `Customer: ${order.customer_first_name} ${order.customer_last_name}\n` +
        `Product: ${order.product_name}\n` +
        `Amount: BDT ${parseFloat(order.total_amount).toFixed(2)}\n\n` +
        `This will refund the customer. Are you sure?`
    );
    
    if (!confirmed) return;
    
    try {
        showLoading(true);
        
        const response = await apiRequest(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({
                status: 'cancelled',
                payment_status: 'refunded'
            })
        });
        
        if (response.success) {
            showNotification('Order cancelled and refund initiated', 'success');
            
            // Update local data
            const orderIndex = salesOrdersData.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                salesOrdersData[orderIndex].status = 'cancelled';
                salesOrdersData[orderIndex].payment_status = 'refunded';
            }
            
            // Re-render with current filter
            const filterSelect = document.getElementById('salesStatusFilter');
            const currentFilter = filterSelect ? filterSelect.value : 'all';
            renderSalesOrders(currentFilter);
        }
    } catch (error) {
        console.error('Cancel order error:', error);
        showNotification(error.message || 'Failed to cancel order', 'error');
    } finally {
        showLoading(false);
    }
}

// View Sales Order Details (Full Modal)
function viewSalesOrderDetails(orderId) {
    const order = salesOrdersData.find(o => o.id === orderId);
    if (!order) return;
    
    const statusColors = {
        'pending': 'background: #fef3c7; color: #92400e;',
        'confirmed': 'background: #dbeafe; color: #1e40af;',
        'processing': 'background: #e0e7ff; color: #3730a3;',
        'shipped': 'background: #ddd6fe; color: #5b21b6;',
        'delivered': 'background: #d1fae5; color: #065f46;',
        'cancelled': 'background: #fee2e2; color: #991b1b;'
    };
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <div>
                    <h2 class="modal-title">Order Details - #${order.order_number}</h2>
                    <span class="badge" style="${statusColors[order.status]}; margin-top: 0.5rem;">
                        ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                </div>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div style="padding: 1.5rem; max-height: 70vh; overflow-y: auto;">
                <!-- Product -->
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 0.75rem; text-transform: uppercase;">Product</h3>
                    <div style="display: flex; gap: 1rem; align-items: center; background: #f9fafb; padding: 1rem; border-radius: 0.75rem;">
                        <img src="${order.product_image}" alt="${order.product_name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.5rem;">
                        <div style="flex: 1;">
                            <h4 style="font-weight: 600; margin-bottom: 0.25rem;">${order.product_name}</h4>
                            <p style="color: #6b7280; font-size: 0.875rem;">BDT ${parseFloat(order.product_price).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Customer Info -->
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 0.75rem; text-transform: uppercase;">Customer Information</h3>
                    <div style="background: #f9fafb; padding: 1rem; border-radius: 0.75rem;">
                        <p style="margin: 0 0 0.5rem 0;"><strong>Name:</strong> ${order.customer_first_name} ${order.customer_last_name}</p>
                        <p style="margin: 0 0 0.5rem 0;"><strong>Email:</strong> ${order.customer_email || 'N/A'}</p>
                        <p style="margin: 0;"><strong>Phone:</strong> ${order.shipping_phone}</p>
                    </div>
                </div>
                
                <!-- Shipping Address -->
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 0.75rem; text-transform: uppercase;">Shipping Address</h3>
                    <div style="background: #f9fafb; padding: 1rem; border-radius: 0.75rem;">
                        <p style="margin: 0 0 0.25rem 0;">${order.shipping_address}</p>
                        ${order.shipping_apartment ? `<p style="margin: 0 0 0.25rem 0;">${order.shipping_apartment}</p>` : ''}
                        <p style="margin: 0 0 0.25rem 0;">${order.shipping_city}, ${order.shipping_postal_code}</p>
                    </div>
                </div>
                
                <!-- Payment Details -->
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 0.75rem; text-transform: uppercase;">Payment Details</h3>
                    <div style="background: #f9fafb; padding: 1rem; border-radius: 0.75rem;">
                        <p style="margin: 0 0 0.5rem 0;"><strong>Method:</strong> ${order.payment_method.toUpperCase()}</p>
                        <p style="margin: 0 0 0.5rem 0;"><strong>Status:</strong> <span style="color: ${order.payment_status === 'paid' ? '#10b981' : '#f59e0b'}; font-weight: 600;">${order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}</span></p>
                        ${order.payment_method === 'bkash' && order.bkash_number ? `<p style="margin: 0;"><strong>bKash Number:</strong> ${order.bkash_number}</p>` : ''}
                        ${order.payment_method === 'nagad' && order.nagad_number ? `<p style="margin: 0;"><strong>Nagad Number:</strong> ${order.nagad_number}</p>` : ''}
                    </div>
                </div>
                
                <!-- Order Timeline -->
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 0.75rem; text-transform: uppercase;">Order Timeline</h3>
                    <div style="background: #f9fafb; padding: 1rem; border-radius: 0.75rem;">
                        <p style="margin: 0 0 0.5rem 0;"><strong>Placed:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                        ${order.updated_at !== order.created_at ? `<p style="margin: 0;"><strong>Last Updated:</strong> ${new Date(order.updated_at).toLocaleString()}</p>` : ''}
                    </div>
                </div>
                
                <!-- Price Breakdown -->
                <div style="border-top: 2px solid #e5e7eb; padding-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Product Price:</span>
                        <span>BDT ${parseFloat(order.product_price).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Shipping Cost:</span>
                        <span>BDT ${parseFloat(order.shipping_cost).toFixed(2)}</span>
                    </div>
                    ${order.discount_amount > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #10b981;">
                        <span>Discount${order.discount_code ? ` (${order.discount_code})` : ''}:</span>
                        <span>- BDT ${parseFloat(order.discount_amount).toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.25rem; padding-top: 0.75rem; margin-top: 0.75rem; border-top: 2px solid #e5e7eb;">
                        <span>Total Amount:</span>
                        <span style="background: linear-gradient(to right, var(--purple-600), var(--pink-600)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">BDT ${parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Load Profile from API
async function loadProfile() {
    try {
        console.log('=== LOADING PROFILE FROM BACKEND ===');
        
        const response = await apiRequest('/dashboard/profile');
        
        if (response.success && response.data) {
            const profile = response.data;
            console.log('Profile loaded:', profile);
            
            if (!currentUser) currentUser = {};
            currentUser.profile = profile;
            currentUser.email = profile.email || currentUser.email;
            
            // Store in localStorage/sessionStorage
            const storage = localStorage.getItem('revogueUser') ? localStorage : sessionStorage;
            storage.setItem('revogueUser', JSON.stringify(currentUser));
            
            // Also update auth user
            const authUser = AuthService.getUser();
            if (authUser) {
                authUser.status = profile.status;
                authUser.can_sell = profile.can_sell;
                authUser.avatar_url = profile.avatar_url || profile.profile_picture;
                authUser.full_name = profile.full_name;
                AuthService.setUser(authUser);
            }
            
            // Update UI (this will also update badges)
            updateProfileUI();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Update Profile UI - WITH DYNAMIC BADGES
function updateProfileUI() {
    if (!currentUser) return;
    
    const profile = currentUser.profile || currentUser;
    
    console.log('=== UPDATING PROFILE UI ===');
    console.log('Profile data:', profile);
    
    const displayName = profile.full_name || profile.username || currentUser.email?.split('@')[0] || 'User';
    
    // Update name and email
    if (document.getElementById('userName')) document.getElementById('userName').textContent = displayName;
    if (document.getElementById('userEmail')) document.getElementById('userEmail').textContent = currentUser.email || profile.email || '';
    
    // Update settings fields
    if (document.getElementById('settingsName')) document.getElementById('settingsName').value = profile.full_name || '';
    if (document.getElementById('settingsEmail')) document.getElementById('settingsEmail').value = currentUser.email || profile.email || '';
    if (document.getElementById('settingsLocation')) document.getElementById('settingsLocation').value = profile.location || '';
    if (document.getElementById('settingsPhone')) document.getElementById('settingsPhone').value = profile.phone || '';
    
    // Update avatar images WITH ERROR HANDLING
    const avatarUrl = profile.avatar_url || profile.profile_picture || '/ReVogue/assets/images/profile.jpg';
    console.log('Avatar URL:', avatarUrl);
    
    if (document.getElementById('userAvatarImg')) {
        document.getElementById('userAvatarImg').src = avatarUrl;
        document.getElementById('userAvatarImg').onerror = function() {
            this.src = '/ReVogue/assets/images/profile.jpg';
        };
    }
    
    if (document.getElementById('settingsAvatarPreview')) {
        document.getElementById('settingsAvatarPreview').src = avatarUrl;
        document.getElementById('settingsAvatarPreview').onerror = function() {
            this.src = '/ReVogue/assets/images/profile.jpg';
        };
    }
    
    // ✅ UPDATE BADGES DYNAMICALLY
    updateUserBadges(profile);
}

// NEW FUNCTION: Update User Badges Dynamically
function updateUserBadges(profile) {
    const badgesContainer = document.querySelector('.user-badges');
    if (!badgesContainer) return;
    
    console.log('=== UPDATING BADGES ===');
    console.log('Status:', profile.status);
    console.log('Can sell:', profile.can_sell);
    console.log('Created at:', profile.created_at);
    
    // Clear existing badges
    badgesContainer.innerHTML = '';
    
    // Status badge configurations
    const statusBadgeConfig = {
        'verified': {
            icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            text: 'Verified Seller',
            style: 'background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7;'
        },
        'pending': {
            icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>',
            text: 'Pending Verification',
            style: 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;'
        },
        'suspended': {
            icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            text: 'Account Suspended',
            style: 'background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;'
        }
    };
    
    // Add status badge
    const status = profile.status || 'pending';
    const badgeConfig = statusBadgeConfig[status] || statusBadgeConfig['pending'];
    
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge badge-verified';
    statusBadge.style.cssText = badgeConfig.style;
    statusBadge.innerHTML = `${badgeConfig.icon} ${badgeConfig.text}`;
    badgesContainer.appendChild(statusBadge);
    
    // Member since badge
    if (profile.created_at) {
        const memberDate = new Date(profile.created_at);
        const memberSince = memberDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        const memberBadge = document.createElement('span');
        memberBadge.className = 'badge badge-member';
        memberBadge.textContent = `Member since ${memberSince}`;
        badgesContainer.appendChild(memberBadge);
    }
    
    console.log('✅ Badges updated');
}

// Load Orders
async function loadOrders() {
    try {
        console.log('=== LOADING ORDERS ===');
        
        const response = await apiRequest('/orders');
        ordersData = response.data || [];
        
        console.log('Loaded orders:', ordersData.length);
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersData = [];
    }
}

// Render Orders
function renderOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;
    
    if (!ordersData || ordersData.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3 class="empty-title">No orders yet</h3>
                <p class="empty-description">Your orders will appear here</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = ordersData.map(order => {
        const statusColors = {
            'pending': 'background: #fef3c7; color: #92400e;',
            'confirmed': 'background: #dbeafe; color: #1e40af;',
            'processing': 'background: #e0e7ff; color: #3730a3;',
            'shipped': 'background: #ddd6fe; color: #5b21b6;',
            'delivered': 'background: #d1fae5; color: #065f46;',
            'cancelled': 'background: #fee2e2; color: #991b1b;'
        };
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h4 class="order-number">#${order.order_number}</h4>
                        <span class="order-date">
                            ${new Date(order.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            })}
                        </span>
                    </div>
                    <span class="order-status-badge" style="${statusColors[order.status] || statusColors['pending']}">
                        ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                </div>
                
                <div class="order-body">
                    <div class="order-product">
                        <img src="${order.product_image || 'https://via.placeholder.com/80'}" 
                             alt="${order.product_name}" 
                             class="order-product-image">
                        <div class="order-product-info">
                            <h5 class="order-product-name">${order.product_name}</h5>
                            <p class="order-product-price">BDT ${parseFloat(order.product_price).toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <div class="order-details">
                        <div class="order-detail-row">
                            <span class="order-detail-label">Subtotal:</span>
                            <span>BDT ${parseFloat(order.subtotal).toFixed(2)}</span>
                        </div>
                        <div class="order-detail-row">
                            <span class="order-detail-label">Shipping:</span>
                            <span>BDT ${parseFloat(order.shipping_cost).toFixed(2)}</span>
                        </div>
                        ${order.discount_amount > 0 ? `
                        <div class="order-detail-row">
                            <span class="order-detail-label">Discount:</span>
                            <span style="color: #10b981;">- BDT ${parseFloat(order.discount_amount).toFixed(2)}</span>
                        </div>
                        ` : ''}
                        <div class="order-detail-row order-total">
                            <span class="order-detail-label">Total:</span>
                            <span>BDT ${parseFloat(order.total_amount).toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="order-actions">
                        <button class="btn-icon btn-view" onclick="viewOrderDetails('${order.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            View Details
                        </button>
                        ${order.status === 'delivered' ? `
                        <button class="btn-icon btn-review" onclick="reviewOrder('${order.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            Review
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// View Order Details
function viewOrderDetails(orderId) {
    const order = ordersData.find(o => o.id === orderId);
    if (!order) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Order Details - #${order.order_number}</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div style="padding: 1.5rem;">
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem;">PRODUCT</h3>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <img src="${order.product_image}" alt="${order.product_name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.5rem;">
                        <div>
                            <h4 style="font-weight: 600; margin-bottom: 0.25rem;">${order.product_name}</h4>
                            <p style="color: #6b7280;">BDT ${parseFloat(order.product_price).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem;">SHIPPING ADDRESS</h3>
                    <p>${order.customer_first_name} ${order.customer_last_name}</p>
                    <p>${order.shipping_address}${order.shipping_apartment ? ', ' + order.shipping_apartment : ''}</p>
                    <p>${order.shipping_city}, ${order.shipping_postal_code}</p>
                    <p>${order.shipping_phone}</p>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem;">PAYMENT</h3>
                    <p>Method: ${order.payment_method.toUpperCase()}</p>
                    <p>Status: ${order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}</p>
                </div>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Subtotal:</span>
                        <span>BDT ${parseFloat(order.subtotal).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Shipping:</span>
                        <span>BDT ${parseFloat(order.shipping_cost).toFixed(2)}</span>
                    </div>
                    ${order.discount_amount > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #10b981;">
                        <span>Discount${order.discount_code ? ` (${order.discount_code})` : ''}:</span>
                        <span>- BDT ${parseFloat(order.discount_amount).toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 1.125rem; padding-top: 0.5rem; border-top: 1px solid #e5e7eb;">
                        <span>Total:</span>
                        <span>BDT ${parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Review Order
function reviewOrder(orderId) {
    showNotification('Review feature coming soon!', 'info');
}

// Load Stats
async function loadStats() {
    try {
        const response = await apiRequest('/dashboard/stats');
        const stats = response.data;
        
        if (document.getElementById('totalListings')) document.getElementById('totalListings').textContent = stats.active_listings || 0;
        if (document.getElementById('totalFavorites')) document.getElementById('totalFavorites').textContent = stats.total_favorites || 0;
        if (document.getElementById('totalSold')) document.getElementById('totalSold').textContent = stats.items_sold || 0;
        if (document.getElementById('totalEarnings')) document.getElementById('totalEarnings').textContent = `BDT ${parseFloat(stats.total_earnings || 0).toFixed(2)}`;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load Listings
async function loadListings() {
    try {
        const response = await apiRequest('/dashboard/listings');
        myListingsData = response.data || [];
    } catch (error) {
        console.error('Error loading listings:', error);
        myListingsData = [];
    }
}

// Load Favorites
async function loadFavorites() {
    try {
        const response = await apiRequest('/dashboard/favorites');
        const favorites = response.data || [];
        
        favoritesData = favorites.map(fav => ({
            favoriteId: fav.id,
            id: fav.products?.id,
            name: fav.products?.name,
            price: fav.products?.price,
            image_url: fav.products?.image_url,
            condition: fav.products?.condition,
            seller: fav.products?.profiles?.full_name || fav.products?.profiles?.username
        })).filter(item => item.id);
    } catch (error) {
        console.error('Error loading favorites:', error);
        favoritesData = [];
    }
}

// Load Purchases
async function loadPurchases() {
    try {
        console.log('=== LOADING PURCHASES (ORDERS) ===');
        
        const response = await apiRequest('/orders');
        const orders = response.data || [];
        
        console.log('Loaded orders/purchases:', orders.length);
        
        purchasesData = orders.map(order => ({
            id: order.id,
            order_number: order.order_number,
            product: {
                id: order.product_id,
                name: order.product_name,
                image_url: order.product_image
            },
            price: order.total_amount,
            created_at: order.created_at,
            status: order.status,
            order_details: order
        }));
        
        console.log('Transformed purchases data:', purchasesData.length);
    } catch (error) {
        console.error('Error loading purchases:', error);
        purchasesData = [];
    }
}



// Load Settings
async function loadSettings() {
    try {
        const response = await apiRequest('/dashboard/settings');
        userSettings = response.data || {};
    } catch (error) {
        console.error('Error loading settings:', error);
        userSettings = {};
    }
}

// Render My Listings
function renderMyListings() {
    const grid = document.getElementById('myListingsGrid');
    if (!grid) return;
    
    if (!myListingsData || myListingsData.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3 class="empty-title">No listings yet</h3>
                <p class="empty-description">Start selling by adding your first item</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = myListingsData.map(item => `
        <div class="listing-card" data-id="${item.id}">
            <div class="listing-image-container">
                <img src="${item.image_url || 'https://via.placeholder.com/400'}" alt="${item.name}" class="listing-image">
                <span class="listing-status status-${item.status}">${item.status === 'active' ? 'Active' : item.status === 'sold' ? 'Sold' : item.status}</span>
            </div>
            <div class="listing-info">
                <div class="listing-name">${item.name}</div>
                <div class="listing-price">BDT ${parseFloat(item.price).toFixed(2)}</div>
                <div class="listing-meta">
                    <span>${item.condition || 'N/A'}</span>
                    <span>Views: ${item.views || 0}</span>
                </div>
                <div class="listing-actions">
                    <button class="btn-icon btn-edit" onclick="editListing('${item.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteListing('${item.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Render Favorites
function renderFavorites() {
    const grid = document.getElementById('favoritesGrid');
    if (!grid) return;
    
    if (!favoritesData || favoritesData.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❤️</div>
                <h3 class="empty-title">No favorites yet</h3>
                <p class="empty-description">Start exploring and save items you love</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = favoritesData.map(item => `
        <div class="listing-card">
            <div class="listing-image-container">
                <img src="${item.image_url || 'https://via.placeholder.com/400'}" alt="${item.name}" class="listing-image">
                <button class="favorite-btn active" onclick="removeFavorite('${item.favoriteId}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>
            <div class="listing-info">
                <div class="listing-name">${item.name}</div>
                <div class="listing-price">BDT ${parseFloat(item.price).toFixed(2)}</div>
                ${item.seller ? `<div style="font-size: 0.875rem; color: var(--gray-600); margin-top: 0.5rem;">by ${item.seller}</div>` : ''}
            </div>
        </div>
    `).join('');
}

// View Purchase Details
function viewPurchaseDetails(purchaseId) {
    const purchase = purchasesData.find(p => p.id === purchaseId);
    if (!purchase || !purchase.order_details) return;
    
    const order = purchase.order_details;
    const canCancel = ['pending', 'confirmed'].includes(order.status);
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Order Details - #${order.order_number}</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div style="padding: 1.5rem;">
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem;">PRODUCT</h3>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <img src="${order.product_image}" alt="${order.product_name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.5rem;">
                        <div>
                            <h4 style="font-weight: 600; margin-bottom: 0.25rem;">${order.product_name}</h4>
                            <p style="color: #6b7280;">BDT ${parseFloat(order.product_price).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem;">SHIPPING ADDRESS</h3>
                    <p>${order.customer_first_name} ${order.customer_last_name}</p>
                    <p>${order.shipping_address}${order.shipping_apartment ? ', ' + order.shipping_apartment : ''}</p>
                    <p>${order.shipping_city}, ${order.shipping_postal_code}</p>
                    <p>${order.shipping_phone}</p>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem;">PAYMENT</h3>
                    <p>Method: ${order.payment_method.toUpperCase()}</p>
                    <p>Status: ${order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}</p>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem;">ORDER STATUS</h3>
                    <p style="text-transform: capitalize; font-weight: 600; color: ${order.status === 'cancelled' ? '#991b1b' : '#10b981'};">
                        ${order.status}
                    </p>
                    ${order.status === 'cancelled' ? `
                        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
                            This order has been cancelled. Refund will be processed within 3-5 business days.
                        </p>
                    ` : ''}
                </div>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Subtotal:</span>
                        <span>BDT ${parseFloat(order.subtotal).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Shipping:</span>
                        <span>BDT ${parseFloat(order.shipping_cost).toFixed(2)}</span>
                    </div>
                    ${order.discount_amount > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #10b981;">
                        <span>Discount${order.discount_code ? ` (${order.discount_code})` : ''}:</span>
                        <span>- BDT ${parseFloat(order.discount_amount).toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 1.125rem; padding-top: 0.5rem; border-top: 1px solid #e5e7eb;">
                        <span>Total:</span>
                        <span>BDT ${parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                </div>
                
                ${canCancel ? `
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
                    <button class="btn-secondary" onclick="cancelOrderFromModal('${order.id}')" style="
                        width: 100%;
                        background: #fee2e2;
                        color: #991b1b;
                        border: 1px solid #fecaca;
                    ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Cancel This Order
                    </button>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Render Purchases
function renderPurchases() {
    const list = document.getElementById('purchasesList');
    if (!list) return;
    
    if (!purchasesData || purchasesData.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛍️</div>
                <h3 class="empty-title">No purchases yet</h3>
                <p class="empty-description">Start shopping for unique finds</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = purchasesData.map(item => {
        const statusColors = {
            'pending': 'background: #fef3c7; color: #92400e;',
            'confirmed': 'background: #dbeafe; color: #1e40af;',
            'processing': 'background: #e0e7ff; color: #3730a3;',
            'shipped': 'background: #ddd6fe; color: #5b21b6;',
            'delivered': 'background: #d1fae5; color: #065f46;',
            'cancelled': 'background: #fee2e2; color: #991b1b;'
        };
        
        const canCancel = ['pending', 'confirmed'].includes(item.status);
        
        return `
            <div class="purchase-card" data-order-id="${item.id}">
                <img src="${item.product?.image_url || 'https://via.placeholder.com/400'}" 
                     alt="${item.product?.name}" 
                     class="purchase-image">
                <div class="purchase-info">
                    <div class="purchase-header">
                        <div>
                            <div class="purchase-name">${item.product?.name || 'Item'}</div>
                            <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">
                                Order #${item.order_number}
                            </div>
                        </div>
                        <div class="purchase-price">BDT ${parseFloat(item.price).toFixed(2)}</div>
                    </div>
                    <div class="purchase-details">
                        <div class="purchase-date">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${new Date(item.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </div>
                        <div class="purchase-date">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 11l3 3L22 4"></path>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                            </svg>
                            Payment: ${item.order_details?.payment_method?.toUpperCase() || 'N/A'}
                        </div>
                    </div>
                    <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem; align-items: center;">
                        <span class="badge badge-verified" style="${statusColors[item.status] || statusColors['pending']}">
                            ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                        <div style="margin-left: auto; display: flex; gap: 0.5rem;">
                            <button class="btn-icon btn-view" onclick="viewPurchaseDetails('${item.id}')">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                View
                            </button>
                            ${canCancel ? `
                            <button class="btn-icon btn-cancel" onclick="cancelOrder('${item.id}')" style="
                                background: #fee2e2;
                                color: #991b1b;
                                border: 1px solid #fecaca;
                            ">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Cancel
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Settings
function renderSettings() {
    if (!userSettings) return;
    
    const emailNotifToggle = document.querySelector('.setting-option:nth-child(1) input[type="checkbox"]');
    const messageNotifToggle = document.querySelector('.setting-option:nth-child(2) input[type="checkbox"]');
    const priceDropToggle = document.querySelector('.setting-option:nth-child(3) input[type="checkbox"]');
    
    if (emailNotifToggle) emailNotifToggle.checked = userSettings.email_notifications !== false;
    if (messageNotifToggle) messageNotifToggle.checked = userSettings.message_notifications !== false;
    if (priceDropToggle) priceDropToggle.checked = userSettings.price_drop_alerts === true;
}

// Cancel Order
async function cancelOrder(orderId) {
    const order = purchasesData.find(p => p.id === orderId);
    if (!order) return;
    
    const confirmed = confirm(
        `Are you sure you want to cancel this order?\n\n` +
        `Order: #${order.order_number}\n` +
        `Product: ${order.product?.name}\n` +
        `Amount: BDT ${parseFloat(order.price).toFixed(2)}\n\n` +
        `This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
        showLoading(true);
        
        console.log('=== CANCELLING ORDER ===');
        console.log('Order ID:', orderId);
        
        const response = await apiRequest(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({
                status: 'cancelled',
                payment_status: 'refunded'
            })
        });
        
        if (response.success) {
            showNotification('Order cancelled successfully', 'success');
            
            const orderIndex = purchasesData.findIndex(p => p.id === orderId);
            if (orderIndex !== -1) {
                purchasesData[orderIndex].status = 'cancelled';
                purchasesData[orderIndex].order_details.status = 'cancelled';
                purchasesData[orderIndex].order_details.payment_status = 'refunded';
            }
            
            renderPurchases();
        }
    } catch (error) {
        console.error('Cancel order error:', error);
        showNotification(error.message || 'Failed to cancel order', 'error');
    } finally {
        showLoading(false);
    }
}

// Cancel Order From Modal
async function cancelOrderFromModal(orderId) {
    const modal = document.querySelector('.modal.active');
    if (modal) modal.remove();
    
    await cancelOrder(orderId);
}

// Create Sell Modal
function createSellModal() {
    if (document.getElementById('sellModal')) return;

    const modalHTML = `
        <div id="sellModal" class="modal">
            <div class="modal-content modal-sell-item">
                <div class="modal-header">
                    <div>
                        <h2 class="modal-title">List Your Item</h2>
                        <p style="color: var(--gray-500); font-size: 0.875rem; margin-top: 0.25rem;">Give your item a second life ♻️</p>
                    </div>
                    <button class="modal-close" id="closeSellModalDash">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <form id="sellFormDash" class="sell-form-layout">
                    <div class="sell-column-left">
                        <div class="form-group" style="height: 100%;">
                            <label class="form-label">Product Image</label>
                            <div class="image-upload-large" id="imageUploadAreaDash">
                                <div id="uploadPromptDash" class="upload-prompt-content">
                                    <div class="upload-icon-circle">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="17 8 12 3 7 8"></polyline>
                                            <line x1="12" y1="3" x2="12" y2="15"></line>
                                        </svg>
                                    </div>
                                    <h4>Upload Photo</h4>
                                    <p>Drag & drop or click to browse</p>
                                    <span class="file-support-text">Supports JPG, PNG</span>
                                </div>
                                
                                <div id="imagePreviewDash" class="image-preview-container" style="display: none;">
                                    <img id="previewImgDash" src="" alt="Preview">
                                    <button type="button" id="removeImageDash" class="remove-image-btn">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <input type="file" id="imageInputDash" accept="image/*" style="display: none;">
                        </div>
                    </div>

                    <div class="sell-column-right">
                        <div class="form-group">
                            <label class="form-label">Product Name</label>
                            <input type="text" id="productNameDash" class="input-styled" placeholder="e.g., Vintage Denim Jacket" required>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Price (BDT)</label>
                                <div class="input-with-icon">
                                    <span class="input-icon">৳</span>
                                    <input type="number" id="productPriceDash" class="input-styled" placeholder="0.00" step="0.01" min="0" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Category</label>
                                <div class="select-wrapper">
                                    <select id="productCategoryDash" class="input-styled" required>
                                        <option value="" disabled selected>Select Category</option>
                                        <option value="Tops">👕 Tops</option>
                                        <option value="Bottoms">👖 Bottoms</option>
                                        <option value="Dresses">👗 Dresses</option>
                                        <option value="Accessories">💍 Accessories</option>
                                        <option value="Shoes">👠 Shoes</option>
                                        <option value="Bags">👜 Bags</option>
                                        <option value="Eyewear">🕶️ Eyewear</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Condition</label>
                                <div class="select-wrapper">
                                    <select id="productConditionDash" class="input-styled" required>
                                        <option value="" disabled selected>Select Condition</option>
                                        <option value="Like New">✨ Like New</option>
                                        <option value="Good">👍 Good</option>
                                        <option value="Fair">👌 Fair</option>
                                        <option value="Well Used">♻️ Well Used</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Size</label>
                                <input type="text" id="productSizeDash" class="input-styled" placeholder="e.g. M, 42">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Usage Time</label>
                            <input type="text" id="productUsageTimeDash" class="input-styled" placeholder="e.g., 6 months" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea id="productDescriptionDash" class="input-styled" rows="4" placeholder="Tell the story of this item..." required></textarea>
                        </div>

                        <div class="form-actions-sticky">
                            <button type="button" class="btn-secondary" id="cancelSellDash">Cancel</button>
                            <button type="submit" class="btn-primary">List Now</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const sellModal = document.getElementById('sellModal');
    document.getElementById('closeSellModalDash').onclick = () => sellModal.classList.remove('active');
    document.getElementById('cancelSellDash').onclick = () => sellModal.classList.remove('active');
    
    const imageInput = document.getElementById('imageInputDash');
    const uploadArea = document.getElementById('imageUploadAreaDash');
    uploadArea.onclick = () => imageInput.click();
    
    imageInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('previewImgDash').src = e.target.result;
                document.getElementById('uploadPromptDash').style.display = 'none';
                document.getElementById('imagePreviewDash').style.display = 'flex';
                uploadArea.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        }
    };
    
    document.getElementById('removeImageDash').onclick = (e) => {
        e.stopPropagation();
        imageInput.value = '';
        document.getElementById('uploadPromptDash').style.display = 'flex';
        document.getElementById('imagePreviewDash').style.display = 'none';
        uploadArea.classList.remove('has-image');
    };
    
    document.getElementById('sellFormDash').onsubmit = handleSellFormSubmit;
    setupAutoConditionSelection();
}

// Auto Condition Selection
function setupAutoConditionSelection() {
    const usageTimeInput = document.getElementById('productUsageTimeDash');
    const conditionSelect = document.getElementById('productConditionDash');
    
    if (!usageTimeInput || !conditionSelect) return;
    
    usageTimeInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        const months = parseInt(value);
        
        if (!isNaN(months) && value === months.toString() && months >= 0) {
            let selectedCondition = '';
            
            if (months <= 3) {
                selectedCondition = 'Like New';
            } else if (months <= 12) {
                selectedCondition = 'Good';
            } else if (months <= 24) {
                selectedCondition = 'Fair';
            } else {
                selectedCondition = 'Well Used';
            }
            
            conditionSelect.value = selectedCondition;
            conditionSelect.style.transition = 'all 0.3s ease';
            conditionSelect.style.background = 'linear-gradient(135deg, #a855f7, #ec4899)';
            conditionSelect.style.color = 'white';
            conditionSelect.style.fontWeight = 'bold';
            
            setTimeout(() => {
                conditionSelect.style.background = '';
                conditionSelect.style.color = '';
                conditionSelect.style.fontWeight = '';
            }, 600);
        }
    });
}

// Add New Listing Button
document.getElementById('addListingBtn')?.addEventListener('click', () => {
    createSellModal();
    document.getElementById('sellModal').classList.add('active');
});

document.getElementById('sellBtn')?.addEventListener('click', () => {
    createSellModal();
    document.getElementById('sellModal').classList.add('active');
});

// Handle Sell Form Submit
async function handleSellFormSubmit(e) {
    e.preventDefault();
    try {
        showLoading(true);
        const formData = new FormData();
        formData.append('name', document.getElementById('productNameDash').value);
        formData.append('description', document.getElementById('productDescriptionDash').value);
        formData.append('price', document.getElementById('productPriceDash').value);
        formData.append('category', document.getElementById('productCategoryDash').value);
        formData.append('condition', document.getElementById('productConditionDash').value);
        formData.append('size', document.getElementById('productSizeDash').value);
        formData.append('usageTime', document.getElementById('productUsageTimeDash').value);
        
        const imageFile = document.getElementById('imageInputDash').files[0];
        if (imageFile) formData.append('image', imageFile);
        
        const response = await apiRequest('/products', { method: 'POST', body: formData });
        
        if (response.success) {
            showNotification('Product listed successfully!', 'success');
            document.getElementById('sellModal').classList.remove('active');
            await loadListings();
            await loadStats();
            renderMyListings();
        }
    } catch (error) {
        showError(error.message || 'Failed to create product');
    } finally {
        showLoading(false);
    }
}

// Edit/Delete Listing Actions
let currentEditId = null;

async function editListing(id) {
    const listing = myListingsData.find(item => item.id === id);
    if (!listing) return;
    
    currentEditId = id;
    if(document.getElementById('editName')) document.getElementById('editName').value = listing.name;
    if(document.getElementById('editPrice')) document.getElementById('editPrice').value = listing.price;
    if(document.getElementById('editCondition')) document.getElementById('editCondition').value = listing.condition;
    
    document.getElementById('editModal')?.classList.add('active');
}

document.getElementById('editForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentEditId) return;
    
    try {
        showLoading(true);
        const updates = {
            name: document.getElementById('editName').value,
            price: document.getElementById('editPrice').value,
            condition: document.getElementById('editCondition').value
        };
        
        await apiRequest(`/dashboard/listings/${currentEditId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
        
        await loadListings();
        renderMyListings();
        document.getElementById('editModal').classList.remove('active');
        showNotification('Listing updated successfully', 'success');
    } catch (error) {
        showError('Failed to update listing');
    } finally {
        showLoading(false);
    }
});

async function deleteListing(id) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
        showLoading(true);
        await apiRequest(`/dashboard/listings/${id}`, { method: 'DELETE' });
        await loadListings();
        renderMyListings();
        await loadStats();
        showNotification('Listing deleted successfully', 'success');
    } catch (error) {
        showError('Failed to delete listing');
    } finally {
        showLoading(false);
    }
}

async function removeFavorite(favoriteId) {
    if (!confirm('Remove from favorites?')) return;
    try {
        showLoading(true);
        await apiRequest(`/dashboard/favorites/${favoriteId}`, { method: 'DELETE' });
        await loadFavorites();
        renderFavorites();
        await loadStats();
        showNotification('Removed from favorites', 'success');
    } catch (error) {
        showError('Failed to remove favorite');
    } finally {
        showLoading(false);
    }
}

// FIXED: Profile Image Upload
document.getElementById('uploadImageBtn')?.addEventListener('click', () => {
    document.getElementById('profileImageInput').click();
});

document.getElementById('profileImageInput')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size should be less than 5MB', 'error');
        return;
    }
    
    try {
        showLoading(true);
        console.log('=== UPLOADING PROFILE IMAGE ===');
        console.log('File:', file.name, file.size, file.type);
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await apiRequest('/dashboard/avatar', { 
            method: 'POST', 
            body: formData 
        });
        
        console.log('Upload response:', response);
        
        if (response.success && response.data) {
            const avatarUrl = response.data.avatar_url || response.data.profile_picture;
            console.log('New avatar URL:', avatarUrl);
            
            if (currentUser.profile) {
                currentUser.profile.avatar_url = avatarUrl;
                currentUser.profile.profile_picture = avatarUrl;
            } else {
                currentUser.avatar_url = avatarUrl;
                currentUser.profile_picture = avatarUrl;
            }
            
            const storage = localStorage.getItem('revogueUser') ? localStorage : sessionStorage;
            storage.setItem('revogueUser', JSON.stringify(currentUser));
            
            const authUser = AuthService.getUser();
            if (authUser) {
                authUser.avatar_url = avatarUrl;
                authUser.profile_picture = avatarUrl;
                AuthService.setUser(authUser);
            }
            
            await loadProfile();
            
            if (document.getElementById('userAvatarImg')) {
                document.getElementById('userAvatarImg').src = avatarUrl + '?t=' + Date.now();
            }
            
            if (document.getElementById('settingsAvatarPreview')) {
                document.getElementById('settingsAvatarPreview').src = avatarUrl + '?t=' + Date.now();
            }
            
            showNotification('Profile picture updated successfully!', 'success');
        } else {
            throw new Error('Failed to upload image');
        }
    } catch (error) {
        console.error('Profile image upload error:', error);
        showNotification(error.message || 'Failed to upload profile picture', 'error');
    } finally {
        showLoading(false);
        e.target.value = '';
    }
});

// Remove Image Button
document.getElementById('removeImageBtn')?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;
    
    try {
        showLoading(true);
        console.log('=== REMOVING PROFILE IMAGE ===');
        
        const response = await apiRequest('/dashboard/avatar', { 
            method: 'DELETE'
        });
        
        if (response.success) {
            const defaultAvatar = '/ReVogue/assets/images/profile.jpg';
            
            if (currentUser.profile) {
                currentUser.profile.avatar_url = defaultAvatar;
                currentUser.profile.profile_picture = defaultAvatar;
            } else {
                currentUser.avatar_url = defaultAvatar;
                currentUser.profile_picture = defaultAvatar;
            }
            
            const storage = localStorage.getItem('revogueUser') ? localStorage : sessionStorage;
            storage.setItem('revogueUser', JSON.stringify(currentUser));
            
            if (document.getElementById('userAvatarImg')) {
                document.getElementById('userAvatarImg').src = defaultAvatar;
            }
            
            if (document.getElementById('settingsAvatarPreview')) {
                document.getElementById('settingsAvatarPreview').src = defaultAvatar;
            }
            
            showNotification('Profile picture removed', 'success');
        }
    } catch (error) {
        console.error('Remove image error:', error);
        showNotification('Failed to remove profile picture', 'error');
    } finally {
        showLoading(false);
    }
});

// Save Profile Settings
document.querySelector('.settings-form .btn-primary')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        showLoading(true);
        const updates = {
            full_name: document.getElementById('settingsName').value,
            location: document.getElementById('settingsLocation').value,
            phone: document.getElementById('settingsPhone').value
        };
        
        const response = await apiRequest('/dashboard/profile', {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
        
        if (response.success) {
            if (currentUser) {
                if (currentUser.profile) Object.assign(currentUser.profile, updates);
                else Object.assign(currentUser, updates);
                
                const storage = localStorage.getItem('revogueUser') ? localStorage : sessionStorage;
                storage.setItem('revogueUser', JSON.stringify(currentUser));
            }
            updateProfileUI();
            showNotification('Profile updated successfully', 'success');
        }
    } catch (error) {
        showError('Failed to update profile');
    } finally {
        showLoading(false);
    }
});

// Settings Preferences
function initializeSettingsListeners() {
    document.querySelectorAll('.setting-option input[type="checkbox"]').forEach((toggle) => {
        toggle.addEventListener('change', async () => {
            try {
                const settings = {
                    email_notifications: document.querySelector('.setting-option:nth-child(1) input[type="checkbox"]').checked,
                    message_notifications: document.querySelector('.setting-option:nth-child(2) input[type="checkbox"]').checked,
                    price_drop_alerts: document.querySelector('.setting-option:nth-child(3) input[type="checkbox"]').checked
                };
                await apiRequest('/dashboard/settings', { method: 'PUT', body: JSON.stringify(settings) });
                showNotification('Settings updated', 'success');
            } catch (error) {
                toggle.checked = !toggle.checked;
                showError('Failed to update settings');
            }
        });
    });
}

// Change Password Modal
const changePasswordBtn = document.getElementById('changePasswordBtn');
const changePasswordModal = document.getElementById('changePasswordModal');
const closeChangePasswordModal = document.getElementById('closeChangePasswordModal');
const cancelChangePassword = document.getElementById('cancelChangePassword');
const changePasswordForm = document.getElementById('changePasswordForm');

changePasswordBtn?.addEventListener('click', () => {
    changePasswordForm.reset();
    changePasswordModal.classList.add('active');
});

function hidePasswordModal() {
    changePasswordModal.classList.remove('active');
}

closeChangePasswordModal?.addEventListener('click', hidePasswordModal);
cancelChangePassword?.addEventListener('click', hidePasswordModal);

window.addEventListener('click', (e) => {
    if (e.target === changePasswordModal) {
        hidePasswordModal();
    }
});

changePasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        showLoading(true);
        await apiRequest('/dashboard/change-password', {
            method: 'POST',
            body: JSON.stringify({ 
                current_password: currentPassword, 
                new_password: newPassword 
            })
        });
        
        showNotification('Password changed successfully', 'success');
        hidePasswordModal();
        changePasswordForm.reset();
    } catch (error) {
        showError(error.message || 'Failed to change password');
    } finally {
        showLoading(false);
    }
});

document.querySelectorAll('.settings-actions .btn-secondary')[1]?.addEventListener('click', () => {
    showNotification('Two-factor authentication coming soon!', 'info');
});

document.querySelectorAll('.settings-actions .btn-secondary')[2]?.addEventListener('click', () => {
    showNotification('Privacy settings coming soon!', 'info');
});



// UI Utilities
function showLoading(show) {
    document.body.style.cursor = show ? 'wait' : 'default';
}

function showError(message) {
    showNotification(message, 'error');
}

// Navigation & Logout
document.querySelector('.btn-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to logout?')) AuthService.logout();
});

const navItems = document.querySelectorAll('.dashboard-nav-item');
const tabContents = document.querySelectorAll('.tab-content');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const tabName = item.getAttribute('data-tab');
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(tabName)?.classList.add('active');
    });
});

// Modal Cleanup
document.getElementById('closeEditModal')?.addEventListener('click', () => {
    document.getElementById('editModal').classList.remove('active');
});

document.getElementById('cancelEdit')?.addEventListener('click', () => {
    document.getElementById('editModal').classList.remove('active');
});

// Navbar toggles
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

// Close panels on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-panel') && !e.target.closest('.icon-btn')) {
        document.querySelectorAll('.dropdown-panel').forEach(p => p.classList.remove('active'));
    }
});

// Chat modal
document.getElementById('sendMessageBtn')?.addEventListener('click', sendChatMessage);
document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});
document.getElementById('closeChatModal')?.addEventListener('click', () => {
    document.getElementById('chatModal').classList.remove('active');
});

window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('editModal')) document.getElementById('editModal').classList.remove('active');
    if (e.target === document.getElementById('sellModal')) document.getElementById('sellModal').classList.remove('active');
});

// Initialization
document.addEventListener('DOMContentLoaded', initDashboard);
async function loadSalesOrders() {
    try {
        console.log('=== LOADING SALES ORDERS ===');
        
        const response = await apiRequest('/dashboard/sales-orders');
        
        console.log('Sales orders response:', response);
        
        if (response.success) {
            salesOrdersData = response.data || [];
            console.log('✅ Loaded sales orders:', salesOrdersData.length);
            
            // Log first order for debugging
            if (salesOrdersData.length > 0) {
                console.log('Sample order:', salesOrdersData[0]);
            }
        } else {
            console.error('❌ Failed to load sales orders:', response.error);
            salesOrdersData = [];
        }
    } catch (error) {
        console.error('❌ Error loading sales orders:', error);
        salesOrdersData = [];
    }
}

// Global Styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

// Make functions global for onclick
window.openChat = openChat;
window.markNotificationRead = markNotificationRead;

// Auto-refresh every 15 seconds
setInterval(() => {
    if (AuthService.isAuthenticated()) {
        loadNotifications();
        loadMessages();
    }
}, 15000);

document.getElementById('salesStatusFilter')?.addEventListener('change', (e) => {
    renderSalesOrders(e.target.value);
});

window.updateSalesOrderStatus = updateSalesOrderStatus;
window.cancelSalesOrder = cancelSalesOrder;
window.viewSalesOrderDetails = viewSalesOrderDetails;
// js/dashboard.js - COMPLETE FINAL VERSION
const API_URL = 'http://localhost:3000/api';

let ordersData = [];

// Auth Service
const AuthService = {
    getToken() {
        return localStorage.getItem('authToken');
    },
    
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
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
            loadSettings()
        ]);
        
        renderMyListings();
        renderFavorites();
        renderPurchases();
        renderSettings();
        renderOrders(); 
        
        // Initialize interactive elements
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

// Load Profile from API
async function loadProfile() {
    try {
        const response = await apiRequest('/dashboard/profile');
        if (response.success && response.data) {
            const profile = response.data;
            
            if (!currentUser) currentUser = {};
            currentUser.profile = profile;
            
            const storage = localStorage.getItem('revogueUser') ? localStorage : sessionStorage;
            storage.setItem('revogueUser', JSON.stringify(currentUser));
            
            updateProfileUI();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Update Profile UI
function updateProfileUI() {
    if (!currentUser) return;
    
    const profile = currentUser.profile || currentUser;
    
    const nameElements = ['userName', 'settingsName'];
    const emailElements = ['userEmail', 'settingsEmail'];
    
    const displayName = profile.full_name || profile.username || currentUser.email?.split('@')[0] || 'User';
    
    if (document.getElementById('userName')) document.getElementById('userName').textContent = displayName;
    if (document.getElementById('userEmail')) document.getElementById('userEmail').textContent = currentUser.email || '';
    
    if (document.getElementById('settingsName')) document.getElementById('settingsName').value = profile.full_name || '';
    if (document.getElementById('settingsEmail')) document.getElementById('settingsEmail').value = currentUser.email || '';
    if (document.getElementById('settingsLocation')) document.getElementById('settingsLocation').value = profile.location || '';
    if (document.getElementById('settingsPhone')) document.getElementById('settingsPhone').value = profile.phone || '';
    
    if (profile.avatar_url) {
        if (document.getElementById('userAvatarImg')) document.getElementById('userAvatarImg').src = profile.avatar_url;
        if (document.getElementById('settingsAvatarPreview')) document.getElementById('settingsAvatarPreview').src = profile.avatar_url;
    }
}

// 3. ADD NEW FUNCTION - Load Orders
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

// 4. ADD NEW FUNCTION - Render Orders
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

// 5. ADD NEW FUNCTION - View Order Details
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

// 6. ADD NEW FUNCTION - Review Order (placeholder)
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
        
        // Load orders instead of separate purchases
        const response = await apiRequest('/orders');
        const orders = response.data || [];
        
        console.log('Loaded orders/purchases:', orders.length);
        
        // Transform orders into purchases format
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
            // Include all order details for reference
            order_details: order
        }));
        
        console.log('Transformed purchases data:', purchasesData.length);
    } catch (error) {
        console.error('Error loading purchases:', error);
        purchasesData = [];
    }
}

// Load Notifications
async function loadNotifications() {
    try {
        const response = await apiRequest('/dashboard/notifications');
        notificationsData = response.data || [];
        updateNotificationBadge();
    } catch (error) {
        console.error('Error loading notifications:', error);
        notificationsData = [];
    }
}

// Load Messages
async function loadMessages() {
    try {
        const response = await apiRequest('/dashboard/messages');
        messagesData = response.data || [];
        updateMessagesBadge();
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesData = [];
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
        
        // Check if order can be cancelled (only pending or confirmed)
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

async function cancelOrder(orderId) {
    const order = purchasesData.find(p => p.id === orderId);
    if (!order) return;
    
    // Confirmation dialog
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
        
        // Call API to update order status
        const response = await apiRequest(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({
                status: 'cancelled',
                payment_status: 'refunded' // Optional: update payment status
            })
        });
        
        if (response.success) {
            showNotification('Order cancelled successfully', 'success');
            
            // Update local data
            const orderIndex = purchasesData.findIndex(p => p.id === orderId);
            if (orderIndex !== -1) {
                purchasesData[orderIndex].status = 'cancelled';
                purchasesData[orderIndex].order_details.status = 'cancelled';
                purchasesData[orderIndex].order_details.payment_status = 'refunded';
            }
            
            // Re-render purchases
            renderPurchases();
            
            // Optionally reload all purchases to ensure sync
            // await loadPurchases();
            // renderPurchases();
        }
    } catch (error) {
        console.error('Cancel order error:', error);
        showNotification(error.message || 'Failed to cancel order', 'error');
    } finally {
        showLoading(false);
    }
}
// Modal Controllers
// Modal Controllers

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
                    <!-- Left Column: Image Upload -->
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

                    <!-- Right Column: Details -->
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
async function cancelOrderFromModal(orderId) {
    // Close the modal first
    const modal = document.querySelector('.modal.active');
    if (modal) modal.remove();
    
    // Then cancel the order
    await cancelOrder(orderId);
}

function setupAutoConditionSelection() {
    const usageTimeInput = document.getElementById('productUsageTimeDash');
    const conditionSelect = document.getElementById('productConditionDash');
    
    if (!usageTimeInput || !conditionSelect) return;
    
    usageTimeInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        const months = parseInt(value);
        
        // Only works if input is a number
        if (!isNaN(months) && value === months.toString() && months >= 0) {
            let selectedCondition = '';
            
            // Auto-select based on months
            if (months <= 3) {
                selectedCondition = 'Like New';
            } else if (months <= 12) {
                selectedCondition = 'Good';
            } else if (months <= 24) {
                selectedCondition = 'Fair';
            } else {
                selectedCondition = 'Well Used';
            }
            
            // Set dropdown and add visual effect
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



// Add New Listing Trigger
document.getElementById('addListingBtn')?.addEventListener('click', () => {
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

// Profile Image Upload
document.getElementById('uploadImageBtn')?.addEventListener('click', () => {
    document.getElementById('profileImageInput').click();
});

document.getElementById('profileImageInput')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    try {
        showLoading(true);
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await apiRequest('/dashboard/avatar', { method: 'POST', body: formData });
        
        if (response.success) {
            const avatarUrl = response.data.avatar_url;
            if(currentUser.profile) currentUser.profile.avatar_url = avatarUrl;
            else currentUser.avatar_url = avatarUrl;
            
            const storage = localStorage.getItem('revogueUser') ? localStorage : sessionStorage;
            storage.setItem('revogueUser', JSON.stringify(currentUser));
            
            updateProfileUI();
            showNotification('Profile image updated', 'success');
        }
    } catch (error) {
        showError('Failed to upload image');
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

// Security Actions (Password, 2FA)
// Change Password Modal Logic
const changePasswordBtn = document.getElementById('changePasswordBtn');
const changePasswordModal = document.getElementById('changePasswordModal');
const closeChangePasswordModal = document.getElementById('closeChangePasswordModal');
const cancelChangePassword = document.getElementById('cancelChangePassword');
const changePasswordForm = document.getElementById('changePasswordForm');

// Open Modal
changePasswordBtn?.addEventListener('click', () => {
    changePasswordForm.reset();
    changePasswordModal.classList.add('active');
});

// Close Modal
function hidePasswordModal() {
    changePasswordModal.classList.remove('active');
}

closeChangePasswordModal?.addEventListener('click', hidePasswordModal);
cancelChangePassword?.addEventListener('click', hidePasswordModal);

// Close on click outside
window.addEventListener('click', (e) => {
    if (e.target === changePasswordModal) {
        hidePasswordModal();
    }
});

// Handle Form Submit
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

// Badge Management
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        const unreadCount = notificationsData.filter(n => !n.read).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function updateMessagesBadge() {
    const badge = document.getElementById('messagesBadge');
    if (badge && currentUser) {
        const unreadCount = messagesData.filter(m => !m.is_read && m.receiver_id === currentUser.id).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

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

window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('editModal')) document.getElementById('editModal').classList.remove('active');
    if (e.target === document.getElementById('sellModal')) document.getElementById('sellModal').classList.remove('active');
});

// Initialization
document.addEventListener('DOMContentLoaded', initDashboard);

// Global Styles for Notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);
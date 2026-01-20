// js/dashboard-api.js - Complete Dashboard with Add Product & Settings
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
            loadStats(),
            loadListings(),
            loadFavorites(),
            loadPurchases(),
            loadNotifications(),
            loadMessages()
        ]);
        
        renderMyListings();
        renderFavorites();
        renderPurchases();
        
        showLoading(false);
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showError('Failed to load dashboard data');
        showLoading(false);
    }
}

// Update Profile UI
function updateProfileUI() {
    if (!currentUser) return;
    
    const profile = currentUser.profile || currentUser;
    
    document.getElementById('userName').textContent = profile.full_name || profile.username || currentUser.email?.split('@')[0] || 'User';
    document.getElementById('userEmail').textContent = currentUser.email || '';
    
    if (document.getElementById('settingsName')) {
        document.getElementById('settingsName').value = profile.full_name || '';
    }
    if (document.getElementById('settingsEmail')) {
        document.getElementById('settingsEmail').value = currentUser.email || '';
    }
    if (document.getElementById('settingsLocation')) {
        document.getElementById('settingsLocation').value = profile.location || '';
    }
    
    if (profile.avatar_url) {
        document.getElementById('userAvatarImg').src = profile.avatar_url;
        if (document.getElementById('settingsAvatarPreview')) {
            document.getElementById('settingsAvatarPreview').src = profile.avatar_url;
        }
    }
}

// Load Stats
async function loadStats() {
    try {
        const response = await apiRequest('/dashboard/stats');
        const stats = response.data;
        
        document.getElementById('totalListings').textContent = stats.active_listings || 0;
        document.getElementById('totalFavorites').textContent = stats.total_favorites || 0;
        document.getElementById('totalSold').textContent = stats.items_sold || 0;
        document.getElementById('totalEarnings').textContent = `BDT ${parseFloat(stats.total_earnings || 0).toFixed(2)}`;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load Listings
async function loadListings() {
    try {
        const response = await apiRequest('/dashboard/listings');
        myListingsData = response.data || [];
        console.log('Loaded listings:', myListingsData.length);
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
        
        console.log('Loaded favorites:', favoritesData.length);
    } catch (error) {
        console.error('Error loading favorites:', error);
        favoritesData = [];
    }
}

// Load Purchases
async function loadPurchases() {
    try {
        const response = await apiRequest('/dashboard/purchases');
        purchasesData = response.data || [];
        console.log('Loaded purchases:', purchasesData.length);
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

// Render My Listings
function renderMyListings() {
    const grid = document.getElementById('myListingsGrid');
    
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

// Render Purchases
function renderPurchases() {
    const list = document.getElementById('purchasesList');
    
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
    
    list.innerHTML = purchasesData.map(item => `
        <div class="purchase-card">
            <img src="${item.product?.image_url || 'https://via.placeholder.com/400'}" alt="${item.product?.name}" class="purchase-image">
            <div class="purchase-info">
                <div class="purchase-header">
                    <div class="purchase-name">${item.product?.name || 'Item'}</div>
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
                        ${new Date(item.created_at).toLocaleDateString()}
                    </div>
                    <div class="purchase-seller">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Seller: ${item.seller?.full_name || item.seller?.username || 'Unknown'}
                    </div>
                </div>
                <div style="margin-top: 0.5rem;">
                    <span class="badge badge-verified">${item.status}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Add New Listing Button
document.getElementById('addListingBtn')?.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Edit Listing
let currentEditId = null;

async function editListing(id) {
    const listing = myListingsData.find(item => item.id === id);
    if (!listing) return;
    
    currentEditId = id;
    document.getElementById('editName').value = listing.name;
    document.getElementById('editPrice').value = listing.price;
    document.getElementById('editCondition').value = listing.condition;
    
    document.getElementById('editModal').classList.add('active');
}

// Save Edit
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
        await loadStats();
        
        document.getElementById('editModal').classList.remove('active');
        
        showNotification('Listing updated successfully', 'success');
        showLoading(false);
    } catch (error) {
        console.error('Error updating listing:', error);
        showError('Failed to update listing');
        showLoading(false);
    }
});

// Delete Listing
async function deleteListing(id) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
        showLoading(true);
        await apiRequest(`/dashboard/listings/${id}`, {
            method: 'DELETE'
        });
        
        await loadListings();
        renderMyListings();
        await loadStats();
        
        showNotification('Listing deleted successfully', 'success');
        showLoading(false);
    } catch (error) {
        console.error('Error deleting listing:', error);
        showError('Failed to delete listing');
        showLoading(false);
    }
}

// Remove Favorite
async function removeFavorite(favoriteId) {
    if (!confirm('Remove from favorites?')) return;
    
    try {
        showLoading(true);
        await apiRequest(`/dashboard/favorites/${favoriteId}`, {
            method: 'DELETE'
        });
        
        await loadFavorites();
        renderFavorites();
        await loadStats();
        
        showNotification('Removed from favorites', 'success');
        showLoading(false);
    } catch (error) {
        console.error('Error removing favorite:', error);
        showError('Failed to remove favorite');
        showLoading(false);
    }
}

// Profile Image Upload
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
    
    try {
        showLoading(true);
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await apiRequest('/dashboard/avatar', {
            method: 'POST',
            body: formData
        });
        
        if (response.success) {
            const avatarUrl = response.data.avatar_url;
            document.getElementById('userAvatarImg').src = avatarUrl;
            if (document.getElementById('settingsAvatarPreview')) {
                document.getElementById('settingsAvatarPreview').src = avatarUrl;
            }
            
            if (currentUser) {
                if (currentUser.profile) {
                    currentUser.profile.avatar_url = avatarUrl;
                } else {
                    currentUser.avatar_url = avatarUrl;
                }
                const storage = localStorage.getItem('revogueUser') ? localStorage : sessionStorage;
                storage.setItem('revogueUser', JSON.stringify(currentUser));
            }
            
            showNotification('Profile image updated', 'success');
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Error uploading avatar:', error);
        showError('Failed to upload image');
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
            location: document.getElementById('settingsLocation').value
        };
        
        const response = await apiRequest('/dashboard/profile', {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
        
        if (response.success) {
            // Update stored user
            if (currentUser) {
                if (currentUser.profile) {
                    currentUser.profile.full_name = updates.full_name;
                    currentUser.profile.location = updates.location;
                } else {
                    currentUser.full_name = updates.full_name;
                    currentUser.location = updates.location;
                }
                const storage = localStorage.getItem('revogueUser') ? localStorage : sessionStorage;
                storage.setItem('revogueUser', JSON.stringify(currentUser));
            }
            
            updateProfileUI();
            showNotification('Profile updated successfully', 'success');
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile');
        showLoading(false);
    }
});

// Update Badges
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

// Utility Functions
function showLoading(show) {
    document.body.style.cursor = show ? 'wait' : 'default';
}

function showError(message) {
    showNotification(message, 'error');
}

// Logout Handler
document.querySelector('.btn-logout')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        AuthService.logout();
    }
});

// Tab Navigation
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

// Modal Controls
document.getElementById('closeEditModal')?.addEventListener('click', () => {
    document.getElementById('editModal').classList.remove('active');
});

document.getElementById('cancelEdit')?.addEventListener('click', () => {
    document.getElementById('editModal').classList.remove('active');
});

window.addEventListener('click', (e) => {
    const editModal = document.getElementById('editModal');
    if (e.target === editModal) {
        editModal.classList.remove('active');
    }
});

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', initDashboard);

// Add notification animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
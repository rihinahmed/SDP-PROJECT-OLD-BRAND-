// js/dashboard.js - COMPLETE FINAL VERSION
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
            loadNotifications(),
            loadMessages(),
            loadSettings()
        ]);
        
        renderMyListings();
        renderFavorites();
        renderPurchases();
        renderSettings();
        
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
        const response = await apiRequest('/dashboard/purchases');
        purchasesData = response.data || [];
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

// Modal Controllers
function createSellModal() {
    if (document.getElementById('sellModal')) return;

    const modalHTML = `
        <div id="sellModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">List Your Item</h2>
                    <button class="modal-close" id="closeSellModalDash">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <form id="sellFormDash" class="sell-form">
                    <div class="form-group">
                        <label class="form-label">Product Image *</label>
                        <div class="image-upload" id="imageUploadAreaDash">
                            <div id="uploadPromptDash">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                                <p>Click to upload or drag and drop</p>
                                <label for="imageInputDash" class="upload-btn">Choose File</label>
                            </div>
                            <div id="imagePreviewDash" style="display: none;">
                                <img id="previewImgDash" src="" alt="Preview">
                                <button type="button" id="removeImageDash" class="remove-image">×</button>
                            </div>
                        </div>
                        <input type="file" id="imageInputDash" accept="image/*" style="display: none;">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Product Name *</label>
                        <input type="text" id="productNameDash" placeholder="e.g., Vintage Denim Jacket" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Price (BDT) *</label>
                            <input type="number" id="productPriceDash" placeholder="0.00" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Category *</label>
                            <select id="productCategoryDash" required>
                                <option value="Tops">Tops</option>
                                <option value="Bottoms">Bottoms</option>
                                <option value="Dresses">Dresses</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Shoes">Shoes</option>
                                <option value="Bags">Bags</option>
                                <option value="Eyewear">Eyewear</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Condition *</label>
                            <select id="productConditionDash" required>
                                <option value="Like New">Like New</option>
                                <option value="Good">Good</option>
                                <option value="Fair">Fair</option>
                                <option value="Well Used">Well Used</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Usage Time *</label>
                            <input type="text" id="productUsageTimeDash" placeholder="e.g., 6 months, 2 years" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Size (Optional)</label>
                        <input type="text" id="productSizeDash" placeholder="e.g., M, L, 10, EU 40">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description *</label>
                        <textarea id="productDescriptionDash" rows="4" placeholder="Describe your item..." required></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" id="cancelSellDash">Cancel</button>
                        <button type="submit" class="btn-primary">List Item</button>
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
                document.getElementById('imagePreviewDash').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    };
    
    document.getElementById('removeImageDash').onclick = (e) => {
        e.stopPropagation();
        imageInput.value = '';
        document.getElementById('uploadPromptDash').style.display = 'block';
        document.getElementById('imagePreviewDash').style.display = 'none';
    };
    
    document.getElementById('sellFormDash').onsubmit = handleSellFormSubmit;
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
document.querySelectorAll('.settings-actions .btn-secondary')[0]?.addEventListener('click', async () => {
    const currentPassword = prompt('Enter your current password:');
    if (!currentPassword) return;

    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword || newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    const confirmPassword = prompt('Confirm new password:');
    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    try {
        showLoading(true);
        await apiRequest('/dashboard/change-password', {
            method: 'POST',
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
        });
        showNotification('Password changed successfully', 'success');
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
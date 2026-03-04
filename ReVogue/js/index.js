// /ReVogue/js/index.js - FINAL FIXED VERSION

// API Configuration
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
let activeChat = {
    conversationId: null,
    receiverId: null,
    receiverName: null,
    productId: null
};
let notifications = [];
let conversations = [];

// API Service
const API = {
    // ... (Existing Product APIs) ...
    async getProducts(filters = {}) {
        try {
            const params = new URLSearchParams();
            
            console.log('🔍 API.getProducts called with:', filters);
            
            // Category filter
            if (filters.category && filters.category !== 'All') {
                params.append('category', filters.category);
            }
            
            // Condition filter
            if (filters.condition) {
                params.append('condition', filters.condition);
            }
            
            // Price filter
            if (filters.maxPrice && filters.maxPrice < 10000) {
                params.append('max_price', filters.maxPrice);
            }
            
            // Sort
            if (filters.sortBy) {
                params.append('sort', filters.sortBy);
            }
            
            // SEARCH - THIS IS THE KEY FIX
            // Check for searchQuery (what your code uses)
            if (filters.searchQuery && filters.searchQuery.trim() !== '') {
                params.append('search', filters.searchQuery);
                console.log('✅ Search param added:', filters.searchQuery);
            }
            
            const url = `${API_URL}/products?${params}`;
            console.log('📡 Fetching URL:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error('❌ Response not OK:', response.status);
                throw new Error('Failed to fetch products');
            }
            
            const data = await response.json();
            console.log('✅ Received products:', data.data?.length || 0);
            
            return data.data || data || [];
            
        } catch (error) {
            console.error('❌ Get products error:', error);
            return [];
        }
    },

    async getProduct(id) {
        try {
            const response = await fetch(`${API_URL}/products/${id}`);
            if (!response.ok) throw new Error('Product not found');
            const data = await response.json();
            return data.data || data;
        } catch (error) { return null; }
    },

    async createProduct(formData) {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: AuthService.getMultipartHeaders(),
            body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create product');
        return data;
    },

    async addToFavorites(productId) {
        const response = await fetch(`${API_URL}/dashboard/favorites`, {
            method: 'POST',
            headers: AuthService.getHeaders(),
            body: JSON.stringify({ product_id: productId })
        });
        return await response.json();
    },

    async removeFromFavorites(favoriteId) {
        const response = await fetch(`${API_URL}/dashboard/favorites/${favoriteId}`, {
            method: 'DELETE',
            headers: AuthService.getHeaders()
        });
        return await response.json();
    },

    async getFavorites() {
        try {
            const response = await fetch(`${API_URL}/dashboard/favorites`, { headers: AuthService.getHeaders() });
            if (!response.ok) throw new Error('Failed');
            const data = await response.json();
            return data.data || [];
        } catch (error) { return []; }
    },

    // --- MESSAGING APIs (UPDATED) ---
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
        // Backend usually returns { conversation: {...}, messages: [...] }
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
    },

    // --- NOTIFICATION APIs ---
    async getNotifications() {
        const response = await fetch(`${API_URL}/dashboard/notifications`, {
            headers: AuthService.getHeaders()
        });
        if (!response.ok) throw new Error('Failed to load notifications');
        const data = await response.json();
        return data.data || [];
    }
};

// ... (Keep Particle Animation Code exactly as is) ...
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const particles = [];
const particleCount = 50;
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
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
        ctx.fillStyle = `rgba(168, 85, 247, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}
function initParticles() { for (let i = 0; i < particleCount; i++) particles.push(new Particle()); }
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => { particle.update(); particle.draw(); });
    requestAnimationFrame(animateParticles);
}
initParticles();
animateParticles();

// Categories
const categories = [
    { name: 'Tops', emoji: '👕', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Bottoms', emoji: '👖', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Dresses', emoji: '👗', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { name: 'Accessories', emoji: '💍', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { name: 'Shoes', emoji: '👠', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { name: 'Bags', emoji: '👜', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
    { name: 'Eyewear', emoji: '🕶️', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }
];

// State
let products = [];
let userFavorites = new Map();
let filters = { category: 'All', maxPrice: 10000, conditions: [], sortBy: 'newest', searchQuery: '' };

// Load Data Logic
async function loadProducts() {
    try {
        const filterParams = { ...filters };
        if (filters.conditions.length > 0) filterParams.condition = filters.conditions[0];
        
        products = await API.getProducts(filterParams);
        if (AuthService.isAuthenticated()) await loadFavorites();
        renderProducts(products);
    } catch (e) { console.error(e); }
}

async function loadFavorites() {
    try {
        const favorites = await API.getFavorites();
        userFavorites.clear();
        favorites.forEach(fav => {
            const pid = fav.products?.id || fav.product_id;
            if(pid) userFavorites.set(pid, fav.id);
        });
    } catch(e) { console.error(e); }
}

// Render Functions (Keep existing logic)
function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    const allBtn = `<button class="category-btn active" data-category="All" style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);"><span style="font-size: 2rem;">🌟</span><span>All Items</span></button>`;
    const cats = categories.map(cat => `<button class="category-btn" data-category="${cat.name}" style="background: ${cat.gradient}; color: white;"><span style="font-size: 2rem;">${cat.emoji}</span><span>${cat.name}</span></button>`).join('');
    grid.innerHTML = allBtn + cats;
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filters.category = btn.dataset.category;
            loadProducts();
        });
    });
}

function renderConditionFilters() {
    const container = document.getElementById('conditionFilters');
    container.innerHTML = ['Like New', 'Good', 'Fair', 'Well Used'].map(c => 
        `<div class="condition-filter"><input type="checkbox" id="${c}" value="${c}"><label for="${c}">${c}</label></div>`
    ).join('');
    container.querySelectorAll('input').forEach(cb => {
        cb.addEventListener('change', () => {
            filters.conditions = Array.from(container.querySelectorAll('input:checked')).map(i => i.value);
            loadProducts();
        });
    });
}
function getConditionClass(condition) {
    const conditionMap = {
        'Like New': 'condition-like-new',
        'Good': 'condition-good',
        'Fair': 'condition-fair',
        'Well Used': 'condition-well-used'
    };
    return conditionMap[condition] || 'condition-good';
}

function renderProducts(list) {
    const grid = document.getElementById('productsGrid');
    const empty = document.getElementById('noProducts');
    
    if(list.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    grid.style.display = 'grid';
    empty.style.display = 'none';
    
    grid.innerHTML = list.map(p => {
        const liked = userFavorites.has(p.id);
        const seller = p.profiles?.username || 'Anonymous';
        const conditionClass = getConditionClass(p.condition); // ✅ ADD THIS
        
        return `
            <div class="product-card" onclick="showProductDetail('${p.id}')">
                <div class="product-image-container">
                    <img src="${p.image_url}" class="product-image">
                    <span class="product-condition ${conditionClass}">${p.condition}</span>
                    <button class="product-like-btn ${liked?'liked':''}" onclick="toggleLike(event, '${p.id}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="${liked?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </button>
                </div>
                <div class="product-info">
                    <div class="product-name">${p.name}</div>
                    <div class="product-category">${p.category}</div>
                    <div class="product-usage">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 6v6l4 2"></path>
                        </svg>
                        Used for ${p.usage_time}
                    </div>
                    <div class="product-footer">
                        <span class="product-price">BDT ${parseFloat(p.price).toFixed(2)}</span>
                        <span class="product-seller">${seller}</span>
                    </div>
                </div>
            </div>`;
    }).join('');
}

// Interaction Functions
async function toggleLike(e, pid) {
    e.stopPropagation();
    if(!AuthService.isAuthenticated()) return showNotification('Login required', 'error');
    
    if(userFavorites.has(pid)) {
        await API.removeFromFavorites(userFavorites.get(pid));
        userFavorites.delete(pid);
        showNotification('Removed from favorites', 'success');
    } else {
        const res = await API.addToFavorites(pid);
        userFavorites.set(pid, res.data.id);
        showNotification('Added to favorites', 'success');
    }
    renderProducts(products);
}

// Detail Modal
async function showProductDetail(pid) {
    const product = await API.getProduct(pid);
    if(!product) return;
    
    const modal = document.getElementById('detailModal');
    const container = document.getElementById('productDetails');
    const seller = product.profiles?.username || 'Anonymous';
    const sellerId = product.user_id || product.seller_id;
    
    // Pass seller name carefully to handleMessageSeller
    const cleanSellerName = seller.replace(/'/g, "\\'");
    const cleanProductName = product.name.replace(/'/g, "\\'");

    container.innerHTML = `
        <div class="detail-grid">
            <img src="${product.image_url}" class="detail-image">
            <div class="detail-content">
                <div class="detail-header">
                    <h3 class="detail-name">${product.name}</h3>
                    <span class="detail-condition">${product.condition}</span>
                </div>
                <div class="detail-price">BDT ${parseFloat(product.price).toFixed(2)}</div>
                <div class="detail-meta">
                    <div class="detail-meta-item"><span>Seller: ${seller}</span></div>
                    <div class="detail-meta-item"><span>Used: ${product.usage_time}</span></div>
                    <div class="detail-meta-item"><span>Size: ${product.size || 'N/A'}</span></div>
                </div>
                <div class="detail-description">
                    <h3>Description</h3>
                    <p>${product.description}</p>
                </div>
                <div class="detail-actions">
                    <button class="btn-primary" onclick="handleBuyNow('${product.id}')">Buy Now</button>
                    <button class="btn-outline" onclick="handleMessageSeller('${sellerId}', '${cleanSellerName}', '${product.id}', '${cleanProductName}')">
                        Message Seller
                    </button>
                </div>
            </div>
        </div>`;
    modal.classList.add('active');
}

// =========================================
//  MESSAGING & NOTIFICATIONS (DYNAMIC)
// =========================================

// Load Data
async function loadUserData() {
    if(!AuthService.isAuthenticated()) return;
    
    try {
        // 1. Notifications
        notifications = await API.getNotifications();
        updateNotificationBadge();
        renderNotificationsList();

        // 2. Conversations
        conversations = await API.getConversations();
        updateMessageBadge();
        renderConversationsList();
    } catch(e) { console.error(e); }
}

// --- BADGES ---
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if(!badge) return;
    const count = notifications.filter(n => !n.is_read).length;
    
    if(count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function updateMessageBadge() {
    const badge = document.getElementById('messagesBadge');
    if(!badge) return;
    
    // Sum up unread counts from all conversations
    const count = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
    
    if(count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// --- RENDER LISTS ---

// Render Conversations in Dropdown
function renderConversationsList() {
    const list = document.getElementById('messagesList');
    if(!list) return;

    if(conversations.length === 0) {
        list.innerHTML = `<div style="text-align: center; padding: 2rem; color: #9ca3af;">No messages yet</div>`;
        return;
    }

    const user = AuthService.getUser();

    list.innerHTML = conversations.map(conv => {
        // Handle other user display name
        const other = conv.other_user;
        const name = other?.full_name || other?.username || 'User';
        const initials = name.charAt(0).toUpperCase();
        const unreadClass = conv.unread_count > 0 ? 'unread' : '';
        
        // Escape for onclick
        const safeName = name.replace(/'/g, "\\'");
        // Handle product context safely if exists
        const productData = conv.product ? JSON.stringify(conv.product).replace(/"/g, '&quot;') : 'null';

        return `
            <div class="message-item ${unreadClass}" onclick="openChat('${conv.id}', '${safeName}', ${productData})">
                <div class="message-avatar">${initials}</div>
                <div class="message-info">
                    <div class="message-header">
                        <div class="message-user">${name}</div>
                        <div class="notification-time">${new Date(conv.last_message_at).toLocaleDateString()}</div>
                    </div>
                    <div class="message-preview" style="display: flex; justify-content: space-between;">
                        <span>${conv.last_message}</span>
                        ${conv.unread_count > 0 ? `<span class="message-badge">${conv.unread_count}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Notifications in Dropdown
function renderNotificationsList() {
    const list = document.getElementById('notificationsList');
    if(!list) return;

    if(notifications.length === 0) {
        list.innerHTML = `<div style="text-align: center; padding: 2rem; color: #9ca3af;">No notifications</div>`;
        return;
    }

    list.innerHTML = notifications.map(n => `
        <div class="notification-item ${n.is_read ? '' : 'unread'}">
            <div class="notification-content">
                <div class="notification-text">
                    <strong>${n.title}</strong><br>
                    ${n.message}
                </div>
                <div class="notification-time">${new Date(n.created_at).toLocaleDateString()}</div>
            </div>
        </div>
    `).join('');
}

// --- CHAT MODAL LOGIC ---

// Open Chat from List
async function openChat(conversationId, username, productData) {
    // Parse productData if it's a string
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
    document.getElementById('chatMessages').innerHTML = '<div style="text-align:center; padding:1rem;">Loading...</div>';
    
    // Show Modal, Hide Dropdown
    document.getElementById('chatModal').classList.add('active');
    document.getElementById('messagesPanel')?.classList.remove('active');

    // Load Messages
    try {
        const data = await API.getConversationMessages(conversationId);
        const msgs = data.messages || [];
        
        // Render with product card at top if product exists
        renderChatMessages(msgs, product);
        
        // Refresh to update unread counts
        loadUserData();
    } catch(e) {
        console.error(e);
        document.getElementById('chatMessages').innerHTML = '<div style="text-align:center; color:red;">Failed to load messages</div>';
    }
}

// Handle "Message Seller" from Product
function handleMessageSeller(sellerId, sellerName, productId, productName) {
    if(!AuthService.isAuthenticated()) {
        showNotification('Login required', 'warning');
        return setTimeout(() => window.location.href = 'login.html', 1000);
    }

    const user = AuthService.getUser();
    if(user.id === sellerId) return showNotification("Can't message yourself", 'error');

    // Find product data
    const product = products.find(p => p.id === productId);
    
    // Prepare context for NEW conversation
    activeChat = {
        conversationId: null,
        receiverId: sellerId,
        receiverName: sellerName,
        productId: productId,
        productName: productName,
        productImage: product?.image_url || 'https://via.placeholder.com/300',
        productPrice: product?.price || 0
    };

    document.getElementById('chatUsername').textContent = sellerName;
    document.getElementById('chatAvatar').textContent = sellerName.charAt(0).toUpperCase();
    document.getElementById('detailModal')?.classList.remove('active');
    document.getElementById('chatModal').classList.add('active');

    // Show PRODUCT CARD as first "message"
    const container = document.getElementById('chatMessages');
    container.innerHTML = `
        <div style="text-align: center; margin: 2rem auto; max-width: 350px;">
            <div style="background: white; border-radius: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                <img src="${activeChat.productImage}" alt="${productName}" style="width: 100%; height: 200px; object-fit: cover;">
                <div style="padding: 1rem;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #1f2937; font-size: 1rem;">${productName}</h4>
                    <p style="margin: 0; color: #a855f7; font-weight: 600; font-size: 1.25rem;">BDT ${parseFloat(activeChat.productPrice).toFixed(2)}</p>
                    <p style="margin: 0.75rem 0 0 0; color: #6b7280; font-size: 0.875rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Chat about this item
                    </p>
                </div>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Render Messages inside Modal
function renderChatMessages(msgs, productData = null) {
    const container = document.getElementById('chatMessages');
    const user = AuthService.getUser();

    let html = '';

    // Add product card at the top if product data exists
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
        // Fallback to activeChat data if productData not provided but we have it in context
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

    // Add messages
    if (msgs.length === 0) {
        html += `
            <div style="text-align: center; color: #9ca3af; margin-top: 1rem; font-size: 0.875rem;">
                No messages yet. Start the conversation!
            </div>
        `;
    } else {
        html += msgs.map(msg => {
            const isMe = msg.sender_id === user.id;
            const time = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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

// Send Message Logic
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if(!text) return;

    // Optimistic Append
    const container = document.getElementById('chatMessages');
    
    // Don't clear product card - just check if it's the initial state
    const hasProductCard = container.querySelector('div[style*="background: linear-gradient"]');
    const hasOnlyProductCard = hasProductCard && container.children.length === 1;
    
    // If only product card exists, keep it and add message after
    // Otherwise just append normally
    
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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
        
        if(activeChat.conversationId) {
            payload.conversation_id = activeChat.conversationId;
        } else if (activeChat.receiverId) {
            payload.receiver_id = activeChat.receiverId;
            if(activeChat.productId) payload.product_id = activeChat.productId;
        }

        const res = await API.sendMessage(payload);
        
        if(res.data && res.data.conversation_id) {
            activeChat.conversationId = res.data.conversation_id;
            loadUserData();
        }
    } catch(e) {
        console.error(e);
        showNotification('Failed to send', 'error');
    }
}

// Chat Input Event Listeners
document.getElementById('sendMessageBtn')?.addEventListener('click', sendChatMessage);
document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});
document.getElementById('closeChatModal')?.addEventListener('click', () => {
    document.getElementById('chatModal').classList.remove('active');
});

// --- NAVBAR TOGGLES ---
document.getElementById('notificationBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const p = document.getElementById('notificationsPanel');
    p.classList.toggle('active');
    document.getElementById('messagesPanel').classList.remove('active');
    
    // Mark notifications read if needed (optional logic)
});

document.getElementById('messagesBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const p = document.getElementById('messagesPanel');
    p.classList.toggle('active');
    document.getElementById('notificationsPanel').classList.remove('active');
});

// Close panels on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-panel') && !e.target.closest('.icon-btn')) {
        document.querySelectorAll('.dropdown-panel').forEach(p => p.classList.remove('active'));
    }
});

// --- SELL MODAL ---
// ============================================
// ✅ SELL MODAL HANDLER (MATCHING DASHBOARD)
// ============================================

function openSellModal() {
    // Check authentication
    if (!AuthService.isAuthenticated()) {
        showNotification('Please login to sell items', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    
    // Check sell authorization
    const user = AuthService.getUser();
    if (user && !user.can_sell) {
        showNotification('Your account is not authorized to sell items yet', 'error');
        return;
    }
    
    // Show the modal
    const modal = document.getElementById('sellModal');
    if (modal) {
        modal.classList.add('active');
    } else {
        console.error('❌ Sell modal not found');
    }
}

// ============================================
// ✅ AUTO-SELECT CONDITION BASED ON USAGE TIME (ENHANCED)
// ============================================

function setupAutoConditionSelection() {
    const usageValueInput = document.getElementById('productUsageTimeValue');
    const usageUnitSelect = document.getElementById('productUsageTimeUnit');
    const conditionSelect = document.getElementById('productCondition');
    const hintElement = document.getElementById('usageTimeHint');
    
    if (!usageValueInput || !usageUnitSelect || !conditionSelect) {
        console.warn('⚠️ Usage time inputs or condition select not found');
        return;
    }
    
    // Function to calculate total months
    function calculateMonths() {
        const value = parseInt(usageValueInput.value) || 0;
        const unit = usageUnitSelect.value;
        
        if (value === 0 || !unit) return 0;
        
        let months = 0;
        
        switch(unit) {
            case 'days':
                months = Math.ceil(value / 30);
                break;
            case 'months':
                months = value;
                break;
            case 'years':
                months = value * 12;
                break;
            default:
                months = 0;
        }
        
        return months;
    }
    
    // Function to determine condition
    function determineCondition(months) {
        if (months === 0) return null;
        
        if (months <= 3) {
            return {
                value: 'Like New',
                label: '✨ Like New',
                description: 'Almost brand new! (0-3 months)',
                class: 'like-new'
            };
        } else if (months <= 12) {
            return {
                value: 'Good',
                label: '👍 Good',
                description: 'Well maintained (4-12 months)',
                class: 'good'
            };
        } else if (months <= 24) {
            return {
                value: 'Fair',
                label: '👌 Fair',
                description: 'Shows some wear (13-24 months)',
                class: 'fair'
            };
        } else {
            return {
                value: 'Well Used',
                label: '♻️ Well Used',
                description: 'Loved and used (24+ months)',
                class: 'well-used'
            };
        }
    }
    
    // Function to update condition and hint
    function updateCondition() {
        const months = calculateMonths();
        const condition = determineCondition(months);
        
        if (!condition) {
            // Reset if no valid input
            hintElement.textContent = '';
            hintElement.className = 'usage-time-hint';
            return;
        }
        
        console.log('📊 Calculated:', months, 'months →', condition.value);
        
        // Update condition select
        conditionSelect.value = condition.value;
        
        // Add flash animation
        conditionSelect.classList.remove('condition-auto-selected');
        void conditionSelect.offsetWidth; // Force reflow
        conditionSelect.classList.add('condition-auto-selected');
        
        // Update hint
        hintElement.textContent = `${condition.label}: ${condition.description}`;
        hintElement.className = `usage-time-hint active ${condition.class}`;
        
        // Remove flash animation after it completes
        setTimeout(() => {
            conditionSelect.classList.remove('condition-auto-selected');
        }, 600);
    }
    
    // Attach event listeners
    usageValueInput.addEventListener('input', updateCondition);
    usageUnitSelect.addEventListener('change', updateCondition);
    
    // Also update when condition is manually changed (to hide hint)
    conditionSelect.addEventListener('change', () => {
        const months = calculateMonths();
        const autoCondition = determineCondition(months);
        
        // If user manually changed it, fade out the hint
        if (autoCondition && conditionSelect.value !== autoCondition.value) {
            setTimeout(() => {
                hintElement.classList.remove('active');
            }, 1000);
        }
    });
}

// Attach to Sell Item button
document.getElementById('sellBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    openSellModal();
});
document.getElementById('closeSellModal')?.addEventListener('click', () => sellModal.classList.remove('active'));
document.getElementById('cancelSell')?.addEventListener('click', () => sellModal.classList.remove('active'));

// Sell Submit
document.getElementById('sellForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const formData = new FormData();
        
        // Handle regular fields
        ['productName','productDescription','productPrice','productCategory','productCondition','productSize'].forEach(id => {
            const el = document.getElementById(id);
            let key = id.replace('product','').toLowerCase();
            formData.append(key, el.value);
        });
        
        // ✅ Combine usage time value + unit
        const usageValue = document.getElementById('productUsageTimeValue').value;
        const usageUnit = document.getElementById('productUsageTimeUnit').value;
        const usageTime = `${usageValue} ${usageUnit}`;
        formData.append('usageTime', usageTime);
        
        console.log('📦 Submitting usage time:', usageTime);
        const file = document.getElementById('imageInput').files[0];
        if(file) formData.append('image', file);

        await API.createProduct(formData);
        showNotification('Listed successfully!', 'success');
        sellModal.classList.remove('active');
        e.target.reset();
        loadProducts();
    } catch(err) { showNotification(err.message, 'error'); }
});

// Detail Modal
document.getElementById('closeDetailModal')?.addEventListener('click', () => {
    document.getElementById('detailModal').classList.remove('active');
});

// Other Utils
function showNotification(msg, type='info') {
    const d = document.createElement('div');
    d.className = `notification notification-${type}`;
    d.textContent = msg;
    d.style.cssText = `position:fixed; top:20px; right:20px; padding:15px; background:${type==='error'?'#ef4444':'#10b981'}; color:white; border-radius:8px; z-index:9999; animation: slideIn 0.3s;`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 3000);
}

function handleBuyNow(id) {
    if(!AuthService.isAuthenticated()) return window.location.href = 'login.html';
    const p = products.find(i => i.id === id);
    if(p) {
        localStorage.setItem('revogueCart', JSON.stringify([{
            id: p.id, name: p.name, price: p.price, image_url: p.image_url, shipping: 120
        }]));
        window.location.href = '/ReVogue/Pages/checkout.html';
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    renderConditionFilters();
    loadProducts();
    setupAutoConditionSelection();
    
    // ✅ PRICE SLIDER
    const priceSlider = document.getElementById('priceRange');
    const maxPriceDisplay = document.getElementById('maxPrice');
    if(priceSlider) {
        priceSlider.addEventListener('input', (e) => {
            filters.maxPrice = parseInt(e.target.value);
            maxPriceDisplay.textContent = `BDT ${filters.maxPrice}`;
            loadProducts();
        });
    }

    // ✅ SORT BY
    const sortSelect = document.getElementById('sortBy');
    if(sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            filters.sortBy = e.target.value;
            loadProducts();
        });
    }

    // ✅ SEARCH INPUT
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        console.log('✅ Search input found');
        
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            console.log('🔍 Search typed:', value);
            
            filters.searchQuery = value;
            
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(() => {
                console.log('⏰ Search delay finished, loading products...');
                loadProducts();
            }, 500);
        });
    } else {
        console.error('❌ Search input NOT FOUND!');
    }

    // ✅ CLEAR FILTERS
    const clearBtn = document.getElementById('clearFilters');
    if(clearBtn) {
        clearBtn.addEventListener('click', () => {
            filters = { category: 'All', maxPrice: 10000, conditions: [], sortBy: 'newest', searchQuery: '' };
            
            // Reset UI
            if(priceSlider) {
                priceSlider.value = 10000;
                maxPriceDisplay.textContent = 'BDT 10000';
            }
            if(sortSelect) sortSelect.value = 'newest';
            if(searchInput) searchInput.value = '';
            
            // Uncheck all condition checkboxes
            document.querySelectorAll('.condition-filter input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            
            // Reset category to "All"
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            const allBtn = document.querySelector('.category-btn[data-category="All"]');
            if(allBtn) allBtn.classList.add('active');
            
            loadProducts();
        });
    }
    
    // Load messaging if authenticated
    if (AuthService.isAuthenticated()) {
        loadUserData();
        // Poll for new messages every 15 seconds
        setInterval(loadUserData, 15000);
    }
});

// Styling for dynamic badges
const style = document.createElement('style');
style.textContent = `
    .message-badge { background: #ec4899; color: white; border-radius: 10px; padding: 2px 6px; font-size: 0.75rem; margin-left: auto; }
    .message-item { display: flex; align-items: center; gap: 10px; }
    .message-avatar { width: 40px; height: 40px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #374151; flex-shrink: 0; }
    .message-avatar-img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .message-item.unread { background-color: #f3f4f6; }
    .message-unread-dot { width: 10px; height: 10px; background: red; border-radius: 50%; position: absolute; top: 0; right: 0; border: 2px solid white; }
    .message-avatar-wrapper { position: relative; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
`;
document.head.appendChild(style);

// Export
window.toggleLike = toggleLike;
window.handleBuyNow = handleBuyNow;
window.handleMessageSeller = handleMessageSeller;
window.openChat = openChat;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// ✅ AUTO-OPEN SELL MODAL IF REDIRECTED FROM ABOUT PAGE
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('action') === 'sell') {
    setTimeout(() => {
        openSellModal();
    }, 500);
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
}
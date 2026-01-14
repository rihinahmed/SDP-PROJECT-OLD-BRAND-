// API Configuration
const API_URL = 'http://localhost:3000/api';

// Auth Service
const AuthService = {
    getToken() {
        return localStorage.getItem('authToken');
    },
    
    setToken(token) {
        localStorage.setItem('authToken', token);
    },
    
    removeToken() {
        localStorage.removeItem('authToken');
    },
    
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
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

// API Service
const API = {
    // Products
    async getProducts(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.category && filters.category !== 'All') params.append('category', filters.category);
            if (filters.condition) params.append('condition', filters.condition);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.sortBy) params.append('sortBy', filters.sortBy);
            if (filters.search) params.append('search', filters.search);
            
            const response = await fetch(`${API_URL}/products?${params}`);
            if (!response.ok) throw new Error('Failed to fetch products');
            return await response.json();
        } catch (error) {
            console.error('Get products error:', error);
            return [];
        }
    },

    async getProduct(id) {
        try {
            const response = await fetch(`${API_URL}/products/${id}`);
            if (!response.ok) throw new Error('Product not found');
            return await response.json();
        } catch (error) {
            console.error('Get product error:', error);
            return null;
        }
    },

    async createProduct(formData) {
        try {
            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: AuthService.getMultipartHeaders(),
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create product');
            return data;
        } catch (error) {
            console.error('Create product error:', error);
            throw error;
        }
    },

    async addToFavorites(productId) {
        try {
            const response = await fetch(`${API_URL}/products/${productId}/favorite`, {
                method: 'POST',
                headers: AuthService.getHeaders()
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            return data;
        } catch (error) {
            console.error('Add to favorites error:', error);
            throw error;
        }
    },

    async removeFromFavorites(productId) {
        try {
            const response = await fetch(`${API_URL}/products/${productId}/favorite`, {
                method: 'DELETE',
                headers: AuthService.getHeaders()
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            return data;
        } catch (error) {
            console.error('Remove from favorites error:', error);
            throw error;
        }
    },

    async getFavorites() {
        try {
            const response = await fetch(`${API_URL}/products/favorites`, {
                headers: AuthService.getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch favorites');
            return await response.json();
        } catch (error) {
            console.error('Get favorites error:', error);
            return [];
        }
    },

    // Notifications
    async getNotifications() {
        try {
            const response = await fetch(`${API_URL}/notifications`, {
                headers: AuthService.getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return await response.json();
        } catch (error) {
            console.error('Get notifications error:', error);
            return [];
        }
    },

    async markNotificationAsRead(id) {
        try {
            const response = await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: AuthService.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Mark notification as read error:', error);
        }
    },

    async markAllNotificationsAsRead() {
        try {
            const response = await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: AuthService.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Mark all notifications as read error:', error);
        }
    }
};

// Particle Animation
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

// Categories Data
const categories = [
    { name: 'Tops', emoji: '👕', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Bottoms', emoji: '👖', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Dresses', emoji: '👗', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { name: 'Accessories', emoji: '💍', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { name: 'Shoes', emoji: '👠', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { name: 'Bags', emoji: '👜', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
    { name: 'Eyewear', emoji: '🕶️', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }
];

// Products State
let products = [];
let userFavorites = new Set();

// Filters State
let filters = {
    category: 'All',
    maxPrice: 10000,
    conditions: [],
    sortBy: 'newest',
    searchQuery: ''
};

// Load products from backend
async function loadProducts() {
    try {
        const filterParams = {
            category: filters.category,
            maxPrice: filters.maxPrice,
            sortBy: filters.sortBy,
            search: filters.searchQuery
        };
        
        // Add condition filter if any selected
        if (filters.conditions.length > 0) {
            filterParams.condition = filters.conditions[0]; // API expects single condition
        }

        products = await API.getProducts(filterParams);
        
        // Load favorites if authenticated
        if (AuthService.isAuthenticated()) {
            await loadFavorites();
        }
        
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Failed to load products', 'error');
    }
}

// Load user favorites
async function loadFavorites() {
    try {
        const favorites = await API.getFavorites();
        userFavorites = new Set(favorites.map(fav => fav.product_id));
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

// Check if product is favorited
function isFavorited(productId) {
    return userFavorites.has(productId);
}

// Render Categories
function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    const allCategory = `
        <button class="category-btn active" data-category="All" style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);">
            <span style="font-size: 2rem;">🌟</span>
            <span>All Items</span>
        </button>
    `;
    
    const categoryButtons = categories.map(cat => `
        <button class="category-btn" data-category="${cat.name}" style="background: ${cat.gradient}; color: white;">
            <span style="font-size: 2rem;">${cat.emoji}</span>
            <span>${cat.name}</span>
        </button>
    `).join('');
    
    grid.innerHTML = allCategory + categoryButtons;
    
    // Add click handlers
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filters.category = btn.dataset.category;
            loadProducts();
        });
    });
}

// Render Condition Filters
function renderConditionFilters() {
    const container = document.getElementById('conditionFilters');
    const conditions = ['Like New', 'Good', 'Fair', 'Well Used'];
    
    container.innerHTML = conditions.map(condition => `
        <div class="condition-filter">
            <input type="checkbox" id="${condition.replace(' ', '-')}" value="${condition}">
            <label for="${condition.replace(' ', '-')}">${condition}</label>
        </div>
    `).join('');
    
    // Add change handlers
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            filters.conditions = Array.from(container.querySelectorAll('input:checked')).map(cb => cb.value);
            loadProducts();
        });
    });
}

// Get Condition Class
function getConditionClass(condition) {
    return 'condition-' + condition.toLowerCase().replace(' ', '-');
}

// Render Products
function renderProducts(productsToRender) {
    const grid = document.getElementById('productsGrid');
    const noProducts = document.getElementById('noProducts');
    
    if (productsToRender.length === 0) {
        grid.style.display = 'none';
        noProducts.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    noProducts.style.display = 'none';
    
    grid.innerHTML = productsToRender.map(product => {
        const liked = isFavorited(product.id);
        const sellerName = product.profiles?.username || 'Anonymous';
        
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.image_url || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400'}" alt="${product.name}" class="product-image">
                    <span class="product-condition ${getConditionClass(product.condition)}">${product.condition}</span>
                    <button class="product-like-btn ${liked ? 'liked' : ''}" onclick="toggleLike(event, '${product.id}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-category">${product.category}</div>
                    <div class="product-usage">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 6v6l4 2"></path>
                        </svg>
                        Used for ${product.usage_time}
                    </div>
                    <div class="product-footer">
                        <span class="product-price">BDT ${parseFloat(product.price).toFixed(2)}</span>
                        <span class="product-seller">${sellerName}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add click handlers for product cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.product-like-btn')) {
                const productId = card.dataset.id;
                showProductDetail(productId);
            }
        });
    });
}

// Toggle Like
async function toggleLike(event, productId) {
    event.stopPropagation();
    
    if (!AuthService.isAuthenticated()) {
        showNotification('Please login to add favorites', 'error');
        return;
    }
    
    try {
        const isLiked = userFavorites.has(productId);
        
        if (isLiked) {
            await API.removeFromFavorites(productId);
            userFavorites.delete(productId);
            showNotification('Removed from favorites', 'success');
        } else {
            await API.addToFavorites(productId);
            userFavorites.add(productId);
            showNotification('Added to favorites', 'success');
        }
        
        // Re-render to update UI
        renderProducts(products);
    } catch (error) {
        console.error('Toggle like error:', error);
        showNotification(error.message || 'Failed to update favorites', 'error');
    }
}

// Show Product Detail
async function showProductDetail(productId) {
    try {
        const product = await API.getProduct(productId);
        if (!product) {
            showNotification('Product not found', 'error');
            return;
        }
        
        const modal = document.getElementById('detailModal');
        const detailsContainer = document.getElementById('productDetails');
        const sellerName = product.profiles?.username || 'Anonymous';
        
        detailsContainer.innerHTML = `
            <div class="detail-grid">
                <img src="${product.image_url || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400'}" alt="${product.name}" class="detail-image">
                <div class="detail-content">
                    <div class="detail-header">
                        <h3 class="detail-name">${product.name}</h3>
                        <span class="detail-condition ${getConditionClass(product.condition)}">${product.condition}</span>
                    </div>
                    <div class="detail-price">BDT ${parseFloat(product.price).toFixed(2)}</div>
                    <div class="detail-meta">
                        <div class="detail-meta-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>Seller: ${sellerName}</span>
                        </div>
                        <div class="detail-meta-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 6v6l4 2"></path>
                            </svg>
                            <span>Used for ${product.usage_time}</span>
                        </div>
                        <div class="detail-meta-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            </svg>
                            <span>Category: ${product.category}</span>
                        </div>
                        ${product.size ? `
                        <div class="detail-meta-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            </svg>
                            <span>Size: ${product.size}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="detail-description">
                        <h3>Description</h3>
                        <p>${product.description}</p>
                    </div>
                    <div class="detail-actions">
                        <button class="btn-primary" onclick="handleBuyNow('${product.id}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            Buy Now
                        </button>
                        <button class="btn-outline" onclick="handleMessageSeller('${product.user_id}', '${product.id}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            Message Seller
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Show product detail error:', error);
        showNotification('Failed to load product details', 'error');
    }
}

// Handle Buy Now
function handleBuyNow(productId) {
    if (!AuthService.isAuthenticated()) {
        showNotification('Please login to purchase items', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    // TODO: Implement checkout flow
    showNotification('Checkout feature coming soon!', 'info');
}

// Handle Message Seller
function handleMessageSeller(sellerId, productId) {
    if (!AuthService.isAuthenticated()) {
        showNotification('Please login to message sellers', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    // TODO: Implement messaging
    showNotification('Messaging feature coming soon!', 'info');
}

// Show Notification
function showNotification(message, type = 'info') {
    // Create notification element
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

// Price Range Slider
const priceSlider = document.getElementById('priceRange');
const maxPriceDisplay = document.getElementById('maxPrice');

priceSlider.addEventListener('input', (e) => {
    filters.maxPrice = parseInt(e.target.value);
    maxPriceDisplay.textContent = `BDT ${filters.maxPrice}`;
    loadProducts();
});

// Sort By
document.getElementById('sortBy').addEventListener('change', (e) => {
    filters.sortBy = e.target.value;
    loadProducts();
});

// Search
document.getElementById('searchInput').addEventListener('input', (e) => {
    filters.searchQuery = e.target.value;
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        loadProducts();
    }, 500); // Debounce search
});

// Clear Filters
document.getElementById('clearFilters').addEventListener('click', () => {
    filters = {
        category: 'All',
        maxPrice: 10000,
        conditions: [],
        sortBy: 'newest',
        searchQuery: ''
    };
    
    priceSlider.value = 10000;
    maxPriceDisplay.textContent = 'BDT 10000';
    document.getElementById('sortBy').value = 'newest';
    document.getElementById('searchInput').value = '';
    document.querySelectorAll('.condition-filter input').forEach(cb => cb.checked = false);
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.category-btn[data-category="All"]').classList.add('active');
    
    loadProducts();
});

// Sell Modal
const sellModal = document.getElementById('sellModal');
const sellBtn = document.getElementById('sellBtn');
const closeSellModal = document.getElementById('closeSellModal');
const cancelSell = document.getElementById('cancelSell');
const sellForm = document.getElementById('sellForm');

sellBtn.addEventListener('click', () => {
    if (!AuthService.isAuthenticated()) {
        showNotification('Please login to sell items', 'error');
        window.location.href = 'login.html';
        return;
    }
    sellModal.classList.add('active');
});

closeSellModal.addEventListener('click', () => {
    sellModal.classList.remove('active');
});

cancelSell.addEventListener('click', () => {
    sellModal.classList.remove('active');
});

// Image Upload
const imageInput = document.getElementById('imageInput');
const uploadArea = document.getElementById('imageUploadArea');
const uploadPrompt = document.getElementById('uploadPrompt');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImage');

uploadArea.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            uploadPrompt.style.display = 'none';
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    imageInput.value = '';
    uploadPrompt.style.display = 'block';
    imagePreview.style.display = 'none';
});

// Sell Form Submit
sellForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!AuthService.isAuthenticated()) {
        showNotification('Please login to sell items', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('name', document.getElementById('productName').value);
        formData.append('description', document.getElementById('productDescription').value);
        formData.append('price', document.getElementById('productPrice').value);
        formData.append('category', document.getElementById('productCategory').value);
        formData.append('condition', document.getElementById('productCondition').value);
        formData.append('size', document.getElementById('productSize').value);
        formData.append('usageTime', document.getElementById('productUsageTime').value);
        
        if (imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }
        
        await API.createProduct(formData);
        
        showNotification('Product listed successfully!', 'success');
        sellModal.classList.remove('active');
        sellForm.reset();
        uploadPrompt.style.display = 'block';
        imagePreview.style.display = 'none';
        
        // Reload products
        loadProducts();
    } catch (error) {
        console.error('Create product error:', error);
        showNotification(error.message || 'Failed to create product', 'error');
    }
});

// Detail Modal Close
document.getElementById('closeDetailModal').addEventListener('click', () => {
    document.getElementById('detailModal').classList.remove('active');
});

// Close modals on outside click
window.addEventListener('click', (e) => {
    if (e.target === sellModal) {
        sellModal.classList.remove('active');
    }
    if (e.target === document.getElementById('detailModal')) {
        document.getElementById('detailModal').classList.remove('active');
    }
});

// Add CSS for notifications
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    renderConditionFilters();
    loadProducts();
    
    // Update UI based on auth state
    const user = AuthService.getUser();
    if (user) {
        console.log('User logged in:', user.email);
    }
});
// /ReVogue/js/shop.js - Dynamic with Supabase
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

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 6rem;
        right: 1rem;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : 'linear-gradient(to right, var(--purple-500), var(--pink-500))'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Products State
let allProducts = [];
let userFavorites = new Set();

// Filters State
let filters = {
    category: 'All',
    minPrice: 0,
    maxPrice: 10000,
    conditions: [],
    sizes: [],
    colors: [],
    sortBy: 'newest',
    searchQuery: ''
};

// View State
let currentView = 'grid';
let displayedProducts = 12;
let cart = JSON.parse(localStorage.getItem('revogueCart') || '[]');

// Categories
const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Accessories', 'Shoes', 'Bags', 'Eyewear'];

// Conditions
const conditions = ['Like New', 'Good', 'Fair', 'Well Used'];

// Sizes
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'One Size'];

// Colors
const colorOptions = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Blue', hex: '#4169E1' },
    { name: 'Red', hex: '#FF0000' },
    { name: 'Pink', hex: '#FFB6C1' },
    { name: 'Green', hex: '#228B22' },
    { name: 'Brown', hex: '#8B4513' },
    { name: 'Gold', hex: '#FFD700' },
    { name: 'Navy', hex: '#000080' }
];

// Load Products from API
async function loadProducts() {
    try {
        const params = new URLSearchParams({
            category: filters.category !== 'All' ? filters.category : '',
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            sortBy: filters.sortBy,
            search: filters.searchQuery
        });

        // Add condition filter
        if (filters.conditions.length > 0) {
            params.append('condition', filters.conditions[0]);
        }

        const response = await fetch(`${API_URL}/products?${params}`);
        if (!response.ok) throw new Error('Failed to load products');

        allProducts = await response.json();

        // Load favorites if authenticated
        if (AuthService.isAuthenticated()) {
            await loadFavorites();
        }

        filterAndRenderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Failed to load products', 'error');
    }
}

// Load User Favorites
async function loadFavorites() {
    try {
        const response = await fetch(`${API_URL}/products/favorites`, {
            headers: AuthService.getHeaders()
        });

        if (response.ok) {
            const favorites = await response.json();
            userFavorites = new Set(favorites.map(fav => fav.product_id));
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

// Check if product is favorited
function isFavorited(productId) {
    return userFavorites.has(productId);
}

// Initialize Filters
function initFilters() {
    // Category Filters
    const categoryContainer = document.getElementById('categoryFilters');
    categoryContainer.innerHTML = categories.map(cat => `
        <button class="category-filter ${cat === 'All' ? 'active' : ''}" data-category="${cat}">
            ${cat}
        </button>
    `).join('');
    
    categoryContainer.querySelectorAll('.category-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            categoryContainer.querySelectorAll('.category-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filters.category = btn.dataset.category;
            displayedProducts = 12;
            loadProducts();
        });
    });
    
    // Condition Filters
    const conditionContainer = document.getElementById('conditionFilters');
    conditionContainer.innerHTML = conditions.map(condition => `
        <div class="checkbox-filter">
            <input type="checkbox" id="cond-${condition.replace(' ', '-')}" value="${condition}">
            <label for="cond-${condition.replace(' ', '-')}">${condition}</label>
        </div>
    `).join('');
    
    conditionContainer.querySelectorAll('input').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            filters.conditions = Array.from(conditionContainer.querySelectorAll('input:checked')).map(cb => cb.value);
            displayedProducts = 12;
            loadProducts();
        });
    });
    
    // Size Filters
    const sizeContainer = document.getElementById('sizeFilters');
    sizeContainer.innerHTML = sizes.map(size => `
        <button class="size-filter" data-size="${size}">${size}</button>
    `).join('');
    
    sizeContainer.querySelectorAll('.size-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            filters.sizes = Array.from(sizeContainer.querySelectorAll('.size-filter.active')).map(b => b.dataset.size);
            displayedProducts = 12;
            filterAndRenderProducts();
        });
    });
    
    // Color Filters
    const colorContainer = document.getElementById('colorFilters');
    colorContainer.innerHTML = colorOptions.map(color => `
        <button class="color-filter" data-color="${color.hex}" style="background-color: ${color.hex}; ${color.name === 'White' ? 'border-color: var(--gray-400);' : ''}" title="${color.name}"></button>
    `).join('');
    
    colorContainer.querySelectorAll('.color-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            filters.colors = Array.from(colorContainer.querySelectorAll('.color-filter.active')).map(b => b.dataset.color);
            displayedProducts = 12;
            filterAndRenderProducts();
        });
    });
}

// Price Range
const priceRange = document.getElementById('priceRange');
const priceValue = document.getElementById('priceValue');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');

priceRange.addEventListener('input', (e) => {
    filters.maxPrice = parseInt(e.target.value);
    priceValue.textContent = `BDT ${filters.maxPrice}`;
    maxPriceInput.value = filters.maxPrice;
    displayedProducts = 12;
    debounceLoadProducts();
});

minPriceInput.addEventListener('change', (e) => {
    filters.minPrice = parseInt(e.target.value) || 0;
    displayedProducts = 12;
    loadProducts();
});

maxPriceInput.addEventListener('change', (e) => {
    const value = parseInt(e.target.value) || 10000;
    filters.maxPrice = value;
    priceRange.value = value;
    priceValue.textContent = `BDT ${value}`;
    displayedProducts = 12;
    loadProducts();
});

// Debounce for price slider
let priceDebounceTimer;
function debounceLoadProducts() {
    clearTimeout(priceDebounceTimer);
    priceDebounceTimer = setTimeout(() => {
        loadProducts();
    }, 500);
}

// Sort By
document.getElementById('sortBy').addEventListener('change', (e) => {
    filters.sortBy = e.target.value;
    loadProducts();
});

// Search
document.getElementById('searchInput').addEventListener('input', (e) => {
    filters.searchQuery = e.target.value;
    displayedProducts = 12;
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        loadProducts();
    }, 500);
});

// View Toggle
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;
        renderProducts(getFilteredProducts());
    });
});

// Clear Filters
document.getElementById('clearFilters').addEventListener('click', () => {
    filters = {
        category: 'All',
        minPrice: 0,
        maxPrice: 10000,
        conditions: [],
        sizes: [],
        colors: [],
        sortBy: 'newest',
        searchQuery: ''
    };
    
    displayedProducts = 12;
    
    priceRange.value = 10000;
    priceValue.textContent = 'BDT 10000';
    minPriceInput.value = '';
    maxPriceInput.value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('sortBy').value = 'newest';
    
    document.querySelectorAll('.checkbox-filter input').forEach(cb => cb.checked = false);
    document.querySelectorAll('.size-filter').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.color-filter').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.category-filter').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.category-filter[data-category="All"]').classList.add('active');
    
    loadProducts();
});

// Get Filtered Products (client-side filters for size and color)
function getFilteredProducts() {
    let filtered = [...allProducts];
    
    // Size filter (client-side)
    if (filters.sizes.length > 0) {
        filtered = filtered.filter(p => filters.sizes.includes(p.size));
    }
    
    // Color filter (client-side) - would need color field in database
    // if (filters.colors.length > 0) {
    //     filtered = filtered.filter(p => filters.colors.includes(p.color));
    // }
    
    return filtered;
}

// Filter and Render Products
function filterAndRenderProducts() {
    const filtered = getFilteredProducts();
    renderProducts(filtered);
}

// Render Products
function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    const noProducts = document.getElementById('noProducts');
    const productCount = document.getElementById('productCount');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    const productsToShow = products.slice(0, displayedProducts);
    
    if (products.length === 0) {
        container.style.display = 'none';
        noProducts.style.display = 'block';
        loadMoreBtn.parentElement.style.display = 'none';
        productCount.textContent = 'No products found';
        return;
    }
    
    container.style.display = 'grid';
    noProducts.style.display = 'none';
    productCount.textContent = `Showing ${productsToShow.length} of ${products.length} products`;
    
    // Update view class
    container.className = currentView === 'list' ? 'products-grid list-view' : 'products-grid';
    
    container.innerHTML = productsToShow.map(product => {
        const liked = isFavorited(product.id);
        const sellerName = product.profiles?.username || 'Anonymous';
        
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.image_url || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400'}" alt="${product.name}" class="product-image">
                    ${product.status === 'available' ? '<span class="product-badge badge-new">Available</span>' : ''}
                    <button class="product-like-btn ${liked ? 'liked' : ''}" onclick="toggleLike(event, '${product.id}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                    <button class="product-quick-view" onclick="showQuickView(event, '${product.id}')">Quick View</button>
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-category">${product.category}</div>
                    <div class="product-rating">
                        <span class="stars">★★★★★</span>
                        <span class="rating-count">(${product.views || 0} views)</span>
                    </div>
                    <div class="product-footer">
                        <span class="product-price">BDT ${parseFloat(product.price).toFixed(2)}</span>
                        <button class="product-add-btn" onclick="addToCart(event, '${product.id}')">Add to Cart</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Show/hide load more button
    if (displayedProducts < products.length) {
        loadMoreBtn.parentElement.style.display = 'block';
    } else {
        loadMoreBtn.parentElement.style.display = 'none';
    }
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
            const response = await fetch(`${API_URL}/products/${productId}/favorite`, {
                method: 'DELETE',
                headers: AuthService.getHeaders()
            });
            
            if (response.ok) {
                userFavorites.delete(productId);
                showNotification('Removed from favorites', 'success');
            }
        } else {
            const response = await fetch(`${API_URL}/products/${productId}/favorite`, {
                method: 'POST',
                headers: AuthService.getHeaders()
            });
            
            if (response.ok) {
                userFavorites.add(productId);
                showNotification('Added to favorites', 'success');
            }
        }
        
        // Re-render to update UI
        renderProducts(getFilteredProducts());
    } catch (error) {
        console.error('Toggle like error:', error);
        showNotification('Failed to update favorites', 'error');
    }
}

// Quick View
async function showQuickView(event, productId) {
    event.stopPropagation();
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Product not found');
        
        const product = await response.json();
        const sellerName = product.profiles?.username || 'Anonymous';
        
        const modal = document.getElementById('quickViewModal');
        const content = document.getElementById('quickViewContent');
        
        content.innerHTML = `
            <img src="${product.image_url || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400'}" alt="${product.name}" class="quick-view-image">
            <div class="quick-view-info">
                <h3 class="quick-view-name">${product.name}</h3>
                <div class="product-rating">
                    <span class="stars">★★★★★</span>
                    <span class="rating-count">(${product.views || 0} views)</span>
                </div>
                <div class="quick-view-price">BDT ${parseFloat(product.price).toFixed(2)}</div>
                <div class="product-category" style="margin: 0.5rem 0;">Category: ${product.category}</div>
                <div style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.5rem;">
                    Condition: <strong>${product.condition}</strong> | Size: <strong>${product.size || 'N/A'}</strong>
                </div>
                <div style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 1rem;">
                    Seller: <strong>${sellerName}</strong> | Used for: <strong>${product.usage_time}</strong>
                </div>
                <p class="quick-view-description">${product.description}</p>
                <div class="quick-view-actions">
                    <button class="btn-primary-large" onclick="addToCartFromQuickView('${product.id}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Show quick view error:', error);
        showNotification('Failed to load product details', 'error');
    }
}

// Add to Cart
function addToCart(event, productId) {
    event.stopPropagation();
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (!existingItem) {
        cart.push({...product, quantity: 1});
        localStorage.setItem('revogueCart', JSON.stringify(cart));
        updateCart();
        showNotification('Added to cart!', 'success');
    } else {
        showNotification('Item already in cart!', 'info');
    }
}

function addToCartFromQuickView(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (!existingItem) {
        cart.push({...product, quantity: 1});
        localStorage.setItem('revogueCart', JSON.stringify(cart));
        updateCart();
        document.getElementById('quickViewModal').classList.remove('active');
        showNotification('Added to cart!', 'success');
    } else {
        showNotification('Item already in cart!', 'info');
    }
}

// Update Cart
function updateCart() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    
    cartCount.textContent = cart.length;
    
    if (cart.length === 0) {
        cartItems.style.display = 'none';
        cartEmpty.style.display = 'block';
        cartFooter.style.display = 'none';
    } else {
        cartItems.style.display = 'flex';
        cartEmpty.style.display = 'none';
        cartFooter.style.display = 'block';
        
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image_url || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400'}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">BDT ${parseFloat(item.price).toFixed(2)}</div>
                    <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">Remove</button>
                </div>
            </div>
        `).join('');
        
        const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
        cartTotal.textContent = `BDT ${total.toFixed(2)}`;
    }
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('revogueCart', JSON.stringify(cart));
    updateCart();
    showNotification('Removed from cart', 'success');
}

// Add CSS animations
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

// Load More
document.getElementById('loadMoreBtn').addEventListener('click', () => {
    displayedProducts += 12;
    filterAndRenderProducts();
});

// Cart Modal
document.getElementById('cartBtn').addEventListener('click', () => {
    document.getElementById('cartModal').classList.add('active');
});

document.getElementById('closeCart').addEventListener('click', () => {
    document.getElementById('cartModal').classList.remove('active');
});

// Quick View Modal
document.getElementById('closeQuickView').addEventListener('click', () => {
    document.getElementById('quickViewModal').classList.remove('active');
});

// Close modals on outside click
window.addEventListener('click', (e) => {
    const cartModal = document.getElementById('cartModal');
    const quickViewModal = document.getElementById('quickViewModal');
    
    if (e.target === cartModal) {
        cartModal.classList.remove('active');
    }
    if (e.target === quickViewModal) {
        quickViewModal.classList.remove('active');
    }
});

// Checkout
document.querySelector('.btn-checkout').addEventListener('click', () => {
    if (!AuthService.isAuthenticated()) {
        showNotification('Please login to checkout', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    showNotification('Checkout feature coming soon!', 'info');
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    loadProducts();
    updateCart();
    
    // Update UI based on auth state
    if (AuthService.isAuthenticated()) {
        console.log('User logged in');
    }
});
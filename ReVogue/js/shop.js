// Enhanced Particle Animation with Connections
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
const particleCount = 80;
const colors = ['#a855f7', '#ec4899', '#3b82f6', '#8b5cf6', '#f472b6'];

for (let i = 0; i < particleCount; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
    });
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
        
        // Draw connections
        particles.forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(otherParticle.x, otherParticle.y);
                ctx.strokeStyle = particle.color;
                ctx.globalAlpha = (1 - distance / 120) * 0.2;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
    });
    
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Sample Products Data
const allProducts = [
    {
        id: 1,
        name: 'Vintage Denim Jacket',
        price: 45.99,
        category: 'Tops',
        condition: 'Like New',
        size: 'M',
        color: '#4169E1',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
        description: 'Classic vintage denim jacket in excellent condition.',
        rating: 4.5,
        reviews: 28,
        isNew: true,
        liked: false
    },
    {
        id: 2,
        name: 'Leather Ankle Boots',
        price: 89.99,
        category: 'Shoes',
        condition: 'Good',
        size: '8',
        color: '#8B4513',
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
        description: 'Genuine leather ankle boots with minimal wear.',
        rating: 4.8,
        reviews: 45,
        liked: false
    },
    {
        id: 3,
        name: 'Floral Summer Dress',
        price: 35.00,
        category: 'Dresses',
        condition: 'Like New',
        size: 'S',
        color: '#FFB6C1',
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
        description: 'Beautiful floral pattern, perfect for summer.',
        rating: 4.7,
        reviews: 32,
        isNew: true,
        liked: false
    },
    {
        id: 4,
        name: 'Designer Handbag',
        price: 120.00,
        category: 'Bags',
        condition: 'Good',
        size: 'One Size',
        color: '#000000',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
        description: 'Authentic designer handbag, well maintained.',
        rating: 4.9,
        reviews: 67,
        liked: false
    },
    {
        id: 5,
        name: 'Vintage Sunglasses',
        price: 25.00,
        category: 'Accessories',
        condition: 'Like New',
        size: 'One Size',
        color: '#FFD700',
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400',
        description: 'Retro style sunglasses with UV protection.',
        rating: 4.3,
        reviews: 19,
        liked: false
    },
    {
        id: 6,
        name: 'High-Waisted Jeans',
        price: 42.50,
        category: 'Bottoms',
        condition: 'Good',
        size: 'M',
        color: '#000080',
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
        description: 'Trendy high-waisted jeans in great condition.',
        rating: 4.6,
        reviews: 41,
        liked: false
    },
    {
        id: 7,
        name: 'Pearl Necklace',
        price: 55.00,
        category: 'Accessories',
        condition: 'Like New',
        size: 'One Size',
        color: '#F5F5DC',
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
        description: 'Elegant pearl necklace for formal events.',
        rating: 4.9,
        reviews: 52,
        isNew: true,
        liked: false
    },
    {
        id: 8,
        name: 'Wool Winter Coat',
        price: 95.00,
        category: 'Tops',
        condition: 'Good',
        size: 'L',
        color: '#A9A9A9',
        image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400',
        description: 'Warm wool coat, ideal for cold weather.',
        rating: 4.7,
        reviews: 38,
        liked: false
    },
    {
        id: 9,
        name: 'Silk Scarf',
        price: 18.99,
        category: 'Accessories',
        condition: 'Like New',
        size: 'One Size',
        color: '#FF69B4',
        image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400',
        description: 'Luxurious silk scarf with vibrant patterns.',
        rating: 4.4,
        reviews: 24,
        liked: false
    },
    {
        id: 10,
        name: 'Retro Sneakers',
        price: 65.00,
        category: 'Shoes',
        condition: 'Good',
        size: '9',
        color: '#FFFFFF',
        image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400',
        description: 'Classic retro sneakers in excellent shape.',
        rating: 4.8,
        reviews: 56,
        liked: false
    },
    {
        id: 11,
        name: 'Vintage T-Shirt',
        price: 22.50,
        category: 'Tops',
        condition: 'Fair',
        size: 'M',
        color: '#808080',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        description: 'Authentic vintage band t-shirt.',
        rating: 4.2,
        reviews: 15,
        liked: false
    },
    {
        id: 12,
        name: 'Denim Shorts',
        price: 28.00,
        category: 'Bottoms',
        condition: 'Good',
        size: 'S',
        color: '#4169E1',
        image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400',
        description: 'Comfortable denim shorts for summer.',
        rating: 4.5,
        reviews: 29,
        liked: false
    },
    {
        id: 13,
        name: 'Leather Belt',
        price: 32.00,
        category: 'Accessories',
        condition: 'Like New',
        size: 'M',
        color: '#8B4513',
        image: 'https://images.unsplash.com/photo-1624222247344-550fb60583c2?w=400',
        description: 'High-quality leather belt with brass buckle.',
        rating: 4.6,
        reviews: 21,
        liked: false
    },
    {
        id: 14,
        name: 'Maxi Dress',
        price: 48.00,
        category: 'Dresses',
        condition: 'Good',
        size: 'L',
        color: '#FF0000',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
        description: 'Elegant maxi dress for special occasions.',
        rating: 4.7,
        reviews: 34,
        liked: false
    },
    {
        id: 15,
        name: 'Canvas Backpack',
        price: 38.50,
        category: 'Bags',
        condition: 'Good',
        size: 'One Size',
        color: '#228B22',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        description: 'Durable canvas backpack for daily use.',
        rating: 4.5,
        reviews: 42,
        liked: false
    },
    {
        id: 16,
        name: 'Wool Sweater',
        price: 52.00,
        category: 'Tops',
        condition: 'Like New',
        size: 'L',
        color: '#800000',
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400',
        description: 'Cozy wool sweater for chilly days.',
        rating: 4.8,
        reviews: 48,
        isNew: true,
        liked: false
    }
];

// Filters State
let filters = {
    category: 'All',
    minPrice: 0,
    maxPrice: 1000,
    conditions: [],
    sizes: [],
    colors: [],
    sortBy: 'newest',
    searchQuery: ''
};

// View State
let currentView = 'grid';
let displayedProducts = 12;
let cart = [];

// Categories
const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Accessories', 'Shoes', 'Bags'];

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
            filterProducts();
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
            filterProducts();
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
            filterProducts();
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
            filterProducts();
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
    priceValue.textContent = `$${filters.maxPrice}`;
    maxPriceInput.value = filters.maxPrice;
    displayedProducts = 12;
    filterProducts();
});

minPriceInput.addEventListener('change', (e) => {
    filters.minPrice = parseInt(e.target.value) || 0;
    displayedProducts = 12;
    filterProducts();
});

maxPriceInput.addEventListener('change', (e) => {
    const value = parseInt(e.target.value) || 1000;
    filters.maxPrice = value;
    priceRange.value = value;
    priceValue.textContent = `$${value}`;
    displayedProducts = 12;
    filterProducts();
});

// Sort By
document.getElementById('sortBy').addEventListener('change', (e) => {
    filters.sortBy = e.target.value;
    filterProducts();
});

// Search
document.getElementById('searchInput').addEventListener('input', (e) => {
    filters.searchQuery = e.target.value;
    displayedProducts = 12;
    filterProducts();
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
        maxPrice: 1000,
        conditions: [],
        sizes: [],
        colors: [],
        sortBy: 'newest',
        searchQuery: ''
    };
    
    displayedProducts = 12;
    
    priceRange.value = 1000;
    priceValue.textContent = '$1000';
    minPriceInput.value = '';
    maxPriceInput.value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('sortBy').value = 'newest';
    
    document.querySelectorAll('.checkbox-filter input').forEach(cb => cb.checked = false);
    document.querySelectorAll('.size-filter').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.color-filter').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.category-filter').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.category-filter[data-category="All"]').classList.add('active');
    
    filterProducts();
});

// Get Filtered Products
function getFilteredProducts() {
    let filtered = [...allProducts];
    
    // Category
    if (filters.category !== 'All') {
        filtered = filtered.filter(p => p.category === filters.category);
    }
    
    // Price
    filtered = filtered.filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice);
    
    // Condition
    if (filters.conditions.length > 0) {
        filtered = filtered.filter(p => filters.conditions.includes(p.condition));
    }
    
    // Size
    if (filters.sizes.length > 0) {
        filtered = filtered.filter(p => filters.sizes.includes(p.size));
    }
    
    // Color
    if (filters.colors.length > 0) {
        filtered = filtered.filter(p => filters.colors.includes(p.color));
    }
    
    // Search
    if (filters.searchQuery) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(filters.searchQuery.toLowerCase())
        );
    }
    
    // Sort
    switch (filters.sortBy) {
        case 'price-low':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'popular':
            filtered.sort((a, b) => b.reviews - a.reviews);
            break;
        case 'newest':
        default:
            filtered.sort((a, b) => b.id - a.id);
    }
    
    return filtered;
}

// Filter Products
function filterProducts() {
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
    
    container.innerHTML = productsToShow.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                ${product.isNew ? '<span class="product-badge badge-new">New</span>' : ''}
                <button class="product-like-btn ${product.liked ? 'liked' : ''}" onclick="toggleLike(event, ${product.id})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${product.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
                <button class="product-quick-view" onclick="showQuickView(event, ${product.id})">Quick View</button>
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.category}</div>
                <div class="product-rating">
                    <span class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}</span>
                    <span class="rating-count">(${product.reviews})</span>
                </div>
                <div class="product-footer">
                    <span class="product-price">BDT ${product.price.toFixed(2)}</span>
                    <button class="product-add-btn" onclick="addToCart(event, ${product.id})">Add to Cart</button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Show/hide load more button
    if (displayedProducts < products.length) {
        loadMoreBtn.parentElement.style.display = 'block';
    } else {
        loadMoreBtn.parentElement.style.display = 'none';
    }
}

// Toggle Like
function toggleLike(event, productId) {
    event.stopPropagation();
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        product.liked = !product.liked;
        filterProducts();
    }
}

// Quick View
function showQuickView(event, productId) {
    event.stopPropagation();
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('quickViewModal');
    const content = document.getElementById('quickViewContent');
    
    content.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="quick-view-image">
        <div class="quick-view-info">
            <h3 class="quick-view-name">${product.name}</h3>
            <div class="product-rating">
                <span class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}</span>
                <span class="rating-count">(${product.reviews} reviews)</span>
            </div>
            <div class="quick-view-price">$${product.price.toFixed(2)}</div>
            <div class="product-category" style="margin: 0.5rem 0;">Category: ${product.category}</div>
            <div style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.5rem;">
                Condition: <strong>${product.condition}</strong> | Size: <strong>${product.size}</strong>
            </div>
            <p class="quick-view-description">${product.description}</p>
            <div class="quick-view-actions">
                <button class="btn-primary-large" onclick="addToCartFromQuickView(${product.id})">
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
}

// Add to Cart
function addToCart(event, productId) {
    event.stopPropagation();
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (!existingItem) {
        cart.push({...product});
        updateCart();
        showNotification('Added to cart!');
    } else {
        showNotification('Item already in cart!');
    }
}

function addToCartFromQuickView(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (!existingItem) {
        cart.push({...product});
        updateCart();
        document.getElementById('quickViewModal').classList.remove('active');
        showNotification('Added to cart!');
    } else {
        showNotification('Item already in cart!');
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
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            </div>
        `).join('');
        
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

// Show Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 6rem;
        right: 1rem;
        background: linear-gradient(to right, var(--purple-500), var(--pink-500));
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
    filterProducts();
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
    alert('Proceeding to checkout... (Demo only)');
});

// Initialize
initFilters();
filterProducts();
updateCart();

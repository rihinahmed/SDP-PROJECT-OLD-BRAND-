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

// Sample Products Data
let products = [
    {
        id: 1,
        name: 'Vintage Denim Jacket',
        price: 45.99,
        category: 'Tops',
        condition: 'Like New',
        usageTime: '6 months',
        seller: 'Sarah M.',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
        description: 'Classic vintage denim jacket in excellent condition. Perfect for layering.',
        liked: false
    },
    {
        id: 2,
        name: 'Leather Ankle Boots',
        price: 89.99,
        category: 'Shoes',
        condition: 'Good',
        usageTime: '1 year',
        seller: 'Michael R.',
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
        description: 'Genuine leather ankle boots with minimal wear.',
        liked: false
    },
    {
        id: 3,
        name: 'Floral Summer Dress',
        price: 35.00,
        category: 'Dresses',
        condition: 'Like New',
        usageTime: '3 months',
        seller: 'Emma T.',
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
        description: 'Beautiful floral pattern, perfect for summer occasions.',
        liked: false
    },
    {
        id: 4,
        name: 'Designer Handbag',
        price: 120.00,
        category: 'Bags',
        condition: 'Good',
        usageTime: '2 years',
        seller: 'Olivia K.',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
        description: 'Authentic designer handbag, well maintained.',
        liked: false
    },
    {
        id: 5,
        name: 'Vintage Sunglasses',
        price: 25.00,
        category: 'Eyewear',
        condition: 'Like New',
        usageTime: '2 months',
        seller: 'James L.',
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400',
        description: 'Retro style sunglasses with UV protection.',
        liked: false
    },
    {
        id: 6,
        name: 'High-Waisted Jeans',
        price: 42.50,
        category: 'Bottoms',
        condition: 'Good',
        usageTime: '8 months',
        seller: 'Sophie B.',
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
        description: 'Trendy high-waisted jeans in great condition.',
        liked: false
    },
    {
        id: 7,
        name: 'Pearl Necklace',
        price: 55.00,
        category: 'Accessories',
        condition: 'Like New',
        usageTime: '1 month',
        seller: 'Isabella P.',
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
        description: 'Elegant pearl necklace, perfect for formal events.',
        liked: false
    },
    {
        id: 8,
        name: 'Wool Winter Coat',
        price: 95.00,
        category: 'Tops',
        condition: 'Good',
        usageTime: '1 year',
        seller: 'Ryan W.',
        image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400',
        description: 'Warm wool coat, ideal for cold weather.',
        liked: false
    }
];

// Filters State
let filters = {
    category: 'All',
    maxPrice: 1000,
    conditions: [],
    sortBy: 'newest',
    searchQuery: ''
};

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
            filterProducts();
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
            filterProducts();
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
    
    grid.innerHTML = productsToRender.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <span class="product-condition ${getConditionClass(product.condition)}">${product.condition}</span>
                <button class="product-like-btn ${product.liked ? 'liked' : ''}" onclick="toggleLike(event, ${product.id})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${product.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
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
                    Used for ${product.usageTime}
                </div>
                <div class="product-footer">
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                    <span class="product-seller">${product.seller}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add click handlers for product cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.product-like-btn')) {
                const productId = parseInt(card.dataset.id);
                showProductDetail(productId);
            }
        });
    });
}

// Filter Products
function filterProducts() {
    let filtered = products;
    
    // Filter by category
    if (filters.category !== 'All') {
        filtered = filtered.filter(p => p.category === filters.category);
    }
    
    // Filter by price
    filtered = filtered.filter(p => p.price <= filters.maxPrice);
    
    // Filter by condition
    if (filters.conditions.length > 0) {
        filtered = filtered.filter(p => filters.conditions.includes(p.condition));
    }
    
    // Filter by search query
    if (filters.searchQuery) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(filters.searchQuery.toLowerCase())
        );
    }
    
    // Sort products
    switch (filters.sortBy) {
        case 'price-low':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
        default:
            filtered.sort((a, b) => b.id - a.id);
    }
    
    renderProducts(filtered);
}

// Toggle Like
function toggleLike(event, productId) {
    event.stopPropagation();
    const product = products.find(p => p.id === productId);
    if (product) {
        product.liked = !product.liked;
        filterProducts();
    }
}

// Show Product Detail
function showProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('detailModal');
    const detailsContainer = document.getElementById('productDetails');
    
    detailsContainer.innerHTML = `
        <div class="detail-grid">
            <img src="${product.image}" alt="${product.name}" class="detail-image">
            <div class="detail-content">
                <div class="detail-header">
                    <h3 class="detail-name">${product.name}</h3>
                    <span class="detail-condition ${getConditionClass(product.condition)}">${product.condition}</span>
                </div>
                <div class="detail-price">$${product.price.toFixed(2)}</div>
                <div class="detail-meta">
                    <div class="detail-meta-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>Seller: ${product.seller}</span>
                    </div>
                    <div class="detail-meta-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 6v6l4 2"></path>
                        </svg>
                        <span>Used for ${product.usageTime}</span>
                    </div>
                    <div class="detail-meta-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        </svg>
                        <span>Category: ${product.category}</span>
                    </div>
                </div>
                <div class="detail-description">
                    <h3>Description</h3>
                    <p>${product.description}</p>
                </div>
                <div class="detail-actions">
                    <button class="btn-primary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        Buy Now
                    </button>
                    <button class="btn-outline">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Message Seller
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Price Range Slider
const priceSlider = document.getElementById('priceRange');
const maxPriceDisplay = document.getElementById('maxPrice');

priceSlider.addEventListener('input', (e) => {
    filters.maxPrice = parseInt(e.target.value);
    maxPriceDisplay.textContent = `$${filters.maxPrice}`;
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
    filterProducts();
});

// Clear Filters
document.getElementById('clearFilters').addEventListener('click', () => {
    filters = {
        category: 'All',
        maxPrice: 1000,
        conditions: [],
        sortBy: 'newest',
        searchQuery: ''
    };
    
    priceSlider.value = 1000;
    maxPriceDisplay.textContent = '$1000';
    document.getElementById('sortBy').value = 'newest';
    document.getElementById('searchInput').value = '';
    document.querySelectorAll('.condition-filter input').forEach(cb => cb.checked = false);
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.category-btn[data-category="All"]').classList.add('active');
    
    filterProducts();
});

// Sell Modal
const sellModal = document.getElementById('sellModal');
const sellBtn = document.getElementById('sellBtn');
const closeSellModal = document.getElementById('closeSellModal');
const cancelSell = document.getElementById('cancelSell');
const sellForm = document.getElementById('sellForm');

sellBtn.addEventListener('click', () => {
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
sellForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newProduct = {
        id: products.length + 1,
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        condition: document.getElementById('productCondition').value,
        usageTime: document.getElementById('productUsageTime').value,
        seller: 'You',
        image: previewImg.src || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400',
        description: document.getElementById('productDescription').value,
        liked: false
    };
    
    products.unshift(newProduct);
    filterProducts();
    sellModal.classList.remove('active');
    sellForm.reset();
    uploadPrompt.style.display = 'block';
    imagePreview.style.display = 'none';
    
    alert('Your item has been listed successfully!');
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

// Initialize
renderCategories();
renderConditionFilters();
filterProducts();

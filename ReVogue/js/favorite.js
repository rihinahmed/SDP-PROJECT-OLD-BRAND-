// Particle Background Animation
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.color = `rgba(${Math.random() > 0.5 ? '168, 85, 247' : '236, 72, 153'}, ${Math.random() * 0.5 + 0.2})`;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width || this.x < 0) {
            this.speedX = -this.speedX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.speedY = -this.speedY;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const particles = [];
for (let i = 0; i < 100; i++) {
    particles.push(new Particle());
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    // Connect particles with lines
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                ctx.strokeStyle = `rgba(168, 85, 247, ${0.2 * (1 - distance / 100)})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animateParticles);
}

animateParticles();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Favorites Management
let favorites = [];
let filteredFavorites = [];

// Load favorites from localStorage
function loadFavorites() {
    const stored = localStorage.getItem('revogue_favorites');
    if (stored) {
        favorites = JSON.parse(stored);
        filteredFavorites = [...favorites];
    }
    updateFavoriteCount();
    renderFavorites();
}

// Update favorite count in hero
function updateFavoriteCount() {
    const countElement = document.getElementById('favoriteCount');
    const count = favorites.length;
    countElement.textContent = `${count} ${count === 1 ? 'item' : 'items'} in your wishlist`;
}

// Remove from favorites
function removeFromFavorites(productId) {
    favorites = favorites.filter(item => item.id !== productId);
    localStorage.setItem('revogue_favorites', JSON.stringify(favorites));
    
    // Update filtered favorites
    filteredFavorites = filteredFavorites.filter(item => item.id !== productId);
    
    updateFavoriteCount();
    renderFavorites();
    
    // Show notification
    showNotification('Removed from favorites');
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 5rem;
        right: 1rem;
        background: linear-gradient(to right, #a855f7, #ec4899);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Add CSS for notification animations
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

// Render favorites
function renderFavorites() {
    const grid = document.getElementById('favoritesGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredFavorites.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        grid.innerHTML = filteredFavorites.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <button class="product-remove-btn" data-product-id="${product.id}" title="Remove from favorites">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <span class="product-condition condition-${product.condition.toLowerCase().replace(/\s+/g, '-')}">
                        ${product.condition}
                    </span>
                </div>
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-category">${product.category}</p>
                    <div class="product-usage">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>Used ${product.usageTime}</span>
                    </div>
                    <div class="product-footer">
                        <span class="product-price">$${product.price}</span>
                        <span class="product-seller">by ${product.seller}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click event to product cards
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.product-remove-btn')) {
                    const productId = parseInt(card.dataset.productId);
                    showProductDetail(productId);
                }
            });
        });
        
        // Add click event to remove buttons
        document.querySelectorAll('.product-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(btn.dataset.productId);
                if (confirm('Remove this item from favorites?')) {
                    removeFromFavorites(productId);
                }
            });
        });
    }
}

// Filter and Sort Functions
function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    // Filter by category
    filteredFavorites = favorites.filter(product => {
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                            product.description.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });
    
    // Sort
    switch (sortBy) {
        case 'price-low':
            filteredFavorites.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredFavorites.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredFavorites.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'newest':
        default:
            filteredFavorites.sort((a, b) => b.id - a.id);
            break;
    }
    
    renderFavorites();
}

// Show product detail modal
function showProductDetail(productId) {
    const product = favorites.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('detailModal');
    const detailsContainer = document.getElementById('productDetails');
    
    detailsContainer.innerHTML = `
        <div class="detail-grid">
            <div>
                <img src="${product.image}" alt="${product.name}" class="detail-image">
            </div>
            <div class="detail-content">
                <div>
                    <div class="detail-header">
                        <h3 class="detail-name">${product.name}</h3>
                    </div>
                    <span class="detail-condition condition-${product.condition.toLowerCase().replace(/\s+/g, '-')}">${product.condition}</span>
                </div>
                
                <div class="detail-price">$${product.price}</div>
                
                <div class="detail-meta">
                    <div class="detail-meta-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 7h-9M14 17H5M6 17h0M17 7h0M14 3v8M9 14v8"></path>
                        </svg>
                        <span><strong>Category:</strong> ${product.category}</span>
                    </div>
                    ${product.size ? `
                        <div class="detail-meta-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            </svg>
                            <span><strong>Size:</strong> ${product.size}</span>
                        </div>
                    ` : ''}
                    <div class="detail-meta-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span><strong>Usage Time:</strong> ${product.usageTime}</span>
                    </div>
                    <div class="detail-meta-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span><strong>Seller:</strong> ${product.seller}</span>
                    </div>
                </div>
                
                <div class="detail-description">
                    <h3>Description</h3>
                    <p>${product.description}</p>
                </div>
                
                <div class="detail-actions">
                    <button class="btn-primary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Contact Seller
                    </button>
                    <button class="btn-outline" onclick="removeFromFavorites(${product.id}); document.getElementById('detailModal').classList.remove('active');">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        Remove from Favorites
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Event Listeners
document.getElementById('categoryFilter').addEventListener('change', applyFilters);
document.getElementById('sortBy').addEventListener('change', applyFilters);
document.getElementById('searchInput').addEventListener('input', applyFilters);

// Clear all favorites
document.getElementById('clearAllFavorites').addEventListener('click', () => {
    if (favorites.length === 0) {
        showNotification('No favorites to clear');
        return;
    }
    
    if (confirm(`Remove all ${favorites.length} items from favorites?`)) {
        favorites = [];
        filteredFavorites = [];
        localStorage.setItem('revogue_favorites', JSON.stringify(favorites));
        updateFavoriteCount();
        renderFavorites();
        showNotification('All favorites cleared');
    }
});

// Modal close
document.getElementById('closeDetailModal').addEventListener('click', () => {
    document.getElementById('detailModal').classList.remove('active');
});

// Close modal on outside click
document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') {
        document.getElementById('detailModal').classList.remove('active');
    }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('detailModal').classList.remove('active');
    }
});

// Initialize
loadFavorites();

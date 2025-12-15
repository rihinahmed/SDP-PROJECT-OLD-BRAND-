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

// Sample Data
const myListingsData = [
    {
        id: 1,
        name: 'Vintage Denim Jacket',
        price: 45.99,
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
        condition: 'Like New',
        status: 'active',
        category: 'Tops'
    },
    {
        id: 2,
        name: 'Leather Ankle Boots',
        price: 89.99,
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
        condition: 'Good',
        status: 'active',
        category: 'Shoes'
    },
    {
        id: 3,
        name: 'Floral Summer Dress',
        price: 35.00,
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
        condition: 'Like New',
        status: 'sold',
        category: 'Dresses'
    },
    {
        id: 4,
        name: 'Designer Handbag',
        price: 120.00,
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
        condition: 'Good',
        status: 'active',
        category: 'Bags'
    },
    {
        id: 5,
        name: 'Vintage Sunglasses',
        price: 25.00,
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400',
        condition: 'Like New',
        status: 'active',
        category: 'Eyewear'
    },
    {
        id: 6,
        name: 'High-Waisted Jeans',
        price: 42.50,
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
        condition: 'Good',
        status: 'active',
        category: 'Bottoms'
    }
];

const favoritesData = [
    {
        id: 101,
        name: 'Silk Scarf',
        price: 18.99,
        image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400',
        condition: 'Like New',
        seller: 'Emma S.'
    },
    {
        id: 102,
        name: 'Wool Coat',
        price: 95.00,
        image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400',
        condition: 'Good',
        seller: 'Michael R.'
    },
    {
        id: 103,
        name: 'Pearl Necklace',
        price: 55.00,
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
        condition: 'Like New',
        seller: 'Olivia T.'
    },
    {
        id: 104,
        name: 'Vintage Watch',
        price: 150.00,
        image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400',
        condition: 'Good',
        seller: 'James L.'
    }
];

const purchasesData = [
    {
        id: 201,
        name: 'Retro Sneakers',
        price: 65.00,
        image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400',
        date: '2024-01-15',
        seller: 'Alex M.',
        status: 'Delivered'
    },
    {
        id: 202,
        name: 'Vintage T-Shirt',
        price: 22.50,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        date: '2024-01-10',
        seller: 'Sophie K.',
        status: 'Delivered'
    },
    {
        id: 203,
        name: 'Denim Shorts',
        price: 28.00,
        image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400',
        date: '2024-01-05',
        seller: 'Ryan P.',
        status: 'Delivered'
    }
];

// Tab Navigation
const navItems = document.querySelectorAll('.dashboard-nav-item');
const tabContents = document.querySelectorAll('.tab-content');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const tabName = item.getAttribute('data-tab');
        
        // Update active nav item
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Update active tab content
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
    });
});

// Render My Listings
function renderMyListings() {
    const grid = document.getElementById('myListingsGrid');
    
    if (myListingsData.length === 0) {
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
                <img src="${item.image}" alt="${item.name}" class="listing-image">
                <span class="listing-status status-${item.status}">${item.status === 'active' ? 'Active' : 'Sold'}</span>
            </div>
            <div class="listing-info">
                <div class="listing-name">${item.name}</div>
                <div class="listing-price">$${item.price.toFixed(2)}</div>
                <div class="listing-actions">
                    <button class="btn-icon btn-edit" onclick="editListing(${item.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteListing(${item.id})">
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
    
    if (favoritesData.length === 0) {
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
                <img src="${item.image}" alt="${item.name}" class="listing-image">
            </div>
            <div class="listing-info">
                <div class="listing-name">${item.name}</div>
                <div class="listing-price">$${item.price.toFixed(2)}</div>
                <div style="font-size: 0.875rem; color: var(--gray-600); margin-top: 0.5rem;">
                    by ${item.seller}
                </div>
            </div>
        </div>
    `).join('');
}

// Render Purchases
function renderPurchases() {
    const list = document.getElementById('purchasesList');
    
    if (purchasesData.length === 0) {
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
            <img src="${item.image}" alt="${item.name}" class="purchase-image">
            <div class="purchase-info">
                <div class="purchase-header">
                    <div class="purchase-name">${item.name}</div>
                    <div class="purchase-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="purchase-details">
                    <div class="purchase-date">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        ${new Date(item.date).toLocaleDateString()}
                    </div>
                    <div class="purchase-seller">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Seller: ${item.seller}
                    </div>
                </div>
                <div style="margin-top: 0.5rem;">
                    <span class="badge badge-verified">${item.status}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Edit Listing
let currentEditId = null;

function editListing(id) {
    const listing = myListingsData.find(item => item.id === id);
    if (!listing) return;
    
    currentEditId = id;
    document.getElementById('editName').value = listing.name;
    document.getElementById('editPrice').value = listing.price;
    document.getElementById('editCondition').value = listing.condition;
    
    document.getElementById('editModal').classList.add('active');
}

// Delete Listing
function deleteListing(id) {
    if (confirm('Are you sure you want to delete this listing?')) {
        const index = myListingsData.findIndex(item => item.id === id);
        if (index > -1) {
            myListingsData.splice(index, 1);
            renderMyListings();
            updateStats();
        }
    }
}

// Modal Controls
document.getElementById('closeEditModal').addEventListener('click', () => {
    document.getElementById('editModal').classList.remove('active');
});

document.getElementById('cancelEdit').addEventListener('click', () => {
    document.getElementById('editModal').classList.remove('active');
});

document.getElementById('editForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const listing = myListingsData.find(item => item.id === currentEditId);
    if (listing) {
        listing.name = document.getElementById('editName').value;
        listing.price = parseFloat(document.getElementById('editPrice').value);
        listing.condition = document.getElementById('editCondition').value;
        
        renderMyListings();
        document.getElementById('editModal').classList.remove('active');
    }
});

// Add Listing Button
document.getElementById('addListingBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Update Stats
function updateStats() {
    const activeListings = myListingsData.filter(item => item.status === 'active').length;
    const soldItems = myListingsData.filter(item => item.status === 'sold').length;
    const totalEarnings = myListingsData
        .filter(item => item.status === 'sold')
        .reduce((sum, item) => sum + item.price, 0);
    
    document.getElementById('totalListings').textContent = activeListings;
    document.getElementById('totalFavorites').textContent = favoritesData.length;
    document.getElementById('totalSold').textContent = soldItems;
    document.getElementById('totalEarnings').textContent = `$${totalEarnings.toFixed(2)}`;
}

// Logout Button
document.querySelector('.btn-logout').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'index.html';
    }
});

// Close modal on outside click
window.addEventListener('click', (e) => {
    const editModal = document.getElementById('editModal');
    if (e.target === editModal) {
        editModal.classList.remove('active');
    }
});

// Initialize
renderMyListings();
renderFavorites();
renderPurchases();
updateStats();

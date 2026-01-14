// ===== PARTICLE ANIMATION =====
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

// ===== MOCK DATA =====
const users = [
    {
        id: 1,
        name: 'Sarah Johnson',
        username: '@sarahj',
        email: 'sarah.j@email.com',
        status: 'verified',
        products: 12,
        joined: '2024-01-15',
        lastActive: 'online',
        totalSales: 45620,
        rating: 4.8,
        phone: '+880 1712-345678',
        address: 'Dhaka, Bangladesh'
    },
    {
        id: 2,
        name: 'Michael Chen',
        username: '@mikechen',
        email: 'mike.chen@email.com',
        status: 'pending',
        products: 5,
        joined: '2024-02-20',
        lastActive: '2 hours ago',
        totalSales: 12300,
        rating: 4.5,
        phone: '+880 1812-345678',
        address: 'Chittagong, Bangladesh'
    },
    {
        id: 3,
        name: 'Emily Davis',
        username: '@emilyd',
        email: 'emily.d@email.com',
        status: 'verified',
        products: 23,
        joined: '2023-11-10',
        lastActive: 'online',
        totalSales: 78900,
        rating: 4.9,
        phone: '+880 1912-345678',
        address: 'Sylhet, Bangladesh'
    },
    {
        id: 4,
        name: 'James Wilson',
        username: '@jameswilson',
        email: 'james.w@email.com',
        status: 'suspended',
        products: 8,
        joined: '2024-03-05',
        lastActive: '1 week ago',
        totalSales: 5600,
        rating: 3.2,
        phone: '+880 1612-345678',
        address: 'Khulna, Bangladesh'
    },
    {
        id: 5,
        name: 'Lisa Anderson',
        username: '@lisaa',
        email: 'lisa.a@email.com',
        status: 'verified',
        products: 18,
        joined: '2023-12-01',
        lastActive: '5 minutes ago',
        totalSales: 62400,
        rating: 4.7,
        phone: '+880 1512-345678',
        address: 'Rajshahi, Bangladesh'
    },
    {
        id: 6,
        name: 'David Martinez',
        username: '@davidm',
        email: 'david.m@email.com',
        status: 'pending',
        products: 3,
        joined: '2024-03-18',
        lastActive: '1 day ago',
        totalSales: 4200,
        rating: 4.3,
        phone: '+880 1412-345678',
        address: 'Barisal, Bangladesh'
    }
];

const products = [
    {
        id: 1,
        name: 'Vintage Denim Jacket',
        seller: 'Sarah Johnson',
        price: 2500,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400',
        category: 'Tops',
        views: 234
    },
    {
        id: 2,
        name: 'Floral Summer Dress',
        seller: 'Emily Davis',
        price: 1800,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
        category: 'Dresses',
        views: 189
    },
    {
        id: 3,
        name: 'Leather Handbag',
        seller: 'Lisa Anderson',
        price: 3200,
        status: 'pending',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
        category: 'Bags',
        views: 145
    },
    {
        id: 4,
        name: 'Classic Sneakers',
        seller: 'Michael Chen',
        price: 2800,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
        category: 'Shoes',
        views: 298
    },
    {
        id: 5,
        name: 'Wool Winter Coat',
        seller: 'Sarah Johnson',
        price: 4500,
        status: 'flagged',
        image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400',
        category: 'Tops',
        views: 167
    },
    {
        id: 6,
        name: 'Sunglasses',
        seller: 'David Martinez',
        price: 1200,
        status: 'pending',
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
        category: 'Eyewear',
        views: 92
    }
];

const orders = [
    {
        id: 1001,
        customer: 'Alice Cooper',
        product: 'Vintage Denim Jacket',
        amount: 2500,
        status: 'completed',
        date: '2024-03-20'
    },
    {
        id: 1002,
        customer: 'Bob Smith',
        product: 'Floral Summer Dress',
        amount: 1800,
        status: 'processing',
        date: '2024-03-21'
    },
    {
        id: 1003,
        customer: 'Carol White',
        product: 'Leather Handbag',
        amount: 3200,
        status: 'pending',
        date: '2024-03-21'
    },
    {
        id: 1004,
        customer: 'David Brown',
        product: 'Classic Sneakers',
        amount: 2800,
        status: 'completed',
        date: '2024-03-19'
    },
    {
        id: 1005,
        customer: 'Eve Wilson',
        product: 'Sunglasses',
        amount: 1200,
        status: 'cancelled',
        date: '2024-03-18'
    }
];

const activities = [
    {
        type: 'user',
        icon: 'user',
        title: 'New User Registration',
        description: 'David Martinez registered as a new seller',
        time: '5 minutes ago'
    },
    {
        type: 'product',
        icon: 'product',
        title: 'Product Listed',
        description: 'Sarah Johnson listed "Vintage Denim Jacket"',
        time: '15 minutes ago'
    },
    {
        type: 'transaction',
        icon: 'transaction',
        title: 'Sale Completed',
        description: 'Emily Davis sold "Floral Summer Dress" for ৳1,800',
        time: '1 hour ago'
    },
    {
        type: 'user',
        icon: 'user',
        title: 'User Verification',
        description: 'Lisa Anderson verified their account',
        time: '2 hours ago'
    },
    {
        type: 'product',
        icon: 'product',
        title: 'Product Flagged',
        description: 'Wool Winter Coat was flagged for review',
        time: '3 hours ago'
    },
    {
        type: 'system',
        icon: 'product',
        title: 'System Update',
        description: 'Platform maintenance completed successfully',
        time: '4 hours ago'
    },
    {
        type: 'transaction',
        icon: 'transaction',
        title: 'Payment Processed',
        description: 'Payment of ৳2,800 processed for Classic Sneakers',
        time: '5 hours ago'
    },
    {
        type: 'user',
        icon: 'user',
        title: 'Account Suspended',
        description: 'James Wilson account suspended due to violations',
        time: '6 hours ago'
    }
];

// ===== NAVIGATION =====
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('pageTitle');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        contentSections.forEach(content => content.classList.remove('active'));
        document.getElementById(`${section}-section`).classList.add('active');
        
        const titles = {
            'dashboard': 'Dashboard',
            'users': 'User Management',
            'products': 'Product Management',
            'orders': 'Order Management',
            'activity': 'Activity Log',
            'settings': 'Settings'
        };
        pageTitle.textContent = titles[section];
        
        if (window.innerWidth <= 1024) {
            sidebar.classList.remove('open');
        }
    });
});

// ===== MOBILE MENU =====
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}

document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024) {
        if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

// ===== STATS ANIMATION =====
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

const statValues = document.querySelectorAll('.stat-value, .quick-stat-value');
statValues.forEach(stat => {
    const target = parseInt(stat.dataset.target);
    if (target) {
        animateValue(stat, 0, target, 2000);
    }
});

// ===== RECENT ACTIVITY =====
function generateRecentActivity() {
    const activityList = document.getElementById('recentActivityList');
    if (!activityList) return;
    
    activityList.innerHTML = activities.slice(0, 5).map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${activity.type === 'user' ? '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>' : 
                      activity.type === 'product' ? '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>' :
                      '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>'}
                </svg>
            </div>
            <div class="activity-content">
                <div class="activity-text"><strong>${activity.title}</strong><br>${activity.description}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

generateRecentActivity();

// ===== USERS TABLE =====
function generateUsersTable(filterStatus = 'all') {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    const filteredUsers = filterStatus === 'all' 
        ? users 
        : users.filter(user => user.status === filterStatus);
    
    tbody.innerHTML = filteredUsers.map(user => {
        const initials = user.name.split(' ').map(n => n[0]).join('');
        const isOnline = user.lastActive === 'online';
        
        return `
            <tr>
                <td><input type="checkbox"></td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">${initials}</div>
                        <div class="user-info">
                            <div class="user-name">${user.name}</div>
                            <div class="user-username">${user.username}</div>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="status-badge ${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
                </td>
                <td>${user.products}</td>
                <td>${new Date(user.joined).toLocaleDateString()}</td>
                <td>
                    <div class="activity-indicator">
                        <div class="activity-dot ${isOnline ? 'online' : 'offline'}"></div>
                        ${user.lastActive}
                    </div>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="viewUserDetail(${user.id})" title="View Details">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        ${user.status === 'pending' ? `
                            <button class="action-btn" onclick="verifyUser(${user.id})" title="Verify">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </button>
                        ` : ''}
                        <button class="action-btn danger" onclick="deleteUser(${user.id})" title="Delete">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

generateUsersTable();

const userStatusFilter = document.getElementById('userStatusFilter');
if (userStatusFilter) {
    userStatusFilter.addEventListener('change', (e) => {
        generateUsersTable(e.target.value);
    });
}

const selectAllCheckbox = document.getElementById('selectAll');
if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('#usersTableBody input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    });
}

// ===== PRODUCTS GRID =====
function generateProductsGrid(filterStatus = 'all') {
    const grid = document.getElementById('adminProductsGrid');
    if (!grid) return;
    
    const filteredProducts = filterStatus === 'all' 
        ? products 
        : products.filter(product => product.status === filterStatus);
    
    grid.innerHTML = filteredProducts.map(product => `
        <div class="admin-product-card">
            <div class="product-image-wrapper">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <span class="product-status status-badge ${product.status}">${product.status.charAt(0).toUpperCase() + product.status.slice(1)}</span>
                <div class="product-actions">
                    <button class="product-action-btn" onclick="approveProduct(${product.id})" title="Approve">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </button>
                    <button class="product-action-btn" onclick="flagProduct(${product.id})" title="Flag">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                            <line x1="4" y1="22" x2="4" y2="15"></line>
                        </svg>
                    </button>
                    <button class="product-action-btn" onclick="deleteProduct(${product.id})" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="product-details-card">
                <div class="product-title">${product.name}</div>
                <div class="product-seller">by ${product.seller}</div>
                <div class="product-footer">
                    <div class="product-price">৳${product.price.toLocaleString()}</div>
                    <div class="activity-indicator">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        ${product.views}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

generateProductsGrid();

const productStatusFilter = document.getElementById('productStatusFilter');
if (productStatusFilter) {
    productStatusFilter.addEventListener('change', (e) => {
        generateProductsGrid(e.target.value);
    });
}

// ===== ORDERS TABLE =====
function generateOrdersTable(filterStatus = 'all') {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    const filteredOrders = filterStatus === 'all' 
        ? orders 
        : orders.filter(order => order.status === filterStatus);
    
    tbody.innerHTML = filteredOrders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.product}</td>
            <td>৳${order.amount.toLocaleString()}</td>
            <td>
                <span class="status-badge ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
            </td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>
                <div class="table-actions">
                    <button class="action-btn" onclick="viewOrder(${order.id})" title="View">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    ${order.status === 'pending' ? `
                        <button class="action-btn" onclick="processOrder(${order.id})" title="Process">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

generateOrdersTable();

const orderStatusFilter = document.getElementById('orderStatusFilter');
if (orderStatusFilter) {
    orderStatusFilter.addEventListener('change', (e) => {
        generateOrdersTable(e.target.value);
    });
}

// ===== ACTIVITY TIMELINE =====
function generateActivityTimeline(filterType = 'all') {
    const timeline = document.getElementById('activityTimeline');
    if (!timeline) return;
    
    const filteredActivities = filterType === 'all' 
        ? activities 
        : activities.filter(activity => activity.type === filterType);
    
    timeline.innerHTML = filteredActivities.map(activity => {
        const iconColors = {
            user: 'purple',
            product: 'pink',
            transaction: 'blue',
            system: 'orange'
        };
        
        return `
            <div class="timeline-item">
                <div class="timeline-icon stat-icon ${iconColors[activity.type]}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${activity.type === 'user' ? '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>' : 
                          activity.type === 'product' ? '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>' :
                          activity.type === 'transaction' ? '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>' :
                          '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'}
                    </svg>
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <div class="timeline-title">${activity.title}</div>
                        <div class="timeline-time">${activity.time}</div>
                    </div>
                    <div class="timeline-description">${activity.description}</div>
                </div>
            </div>
        `;
    }).join('');
}

generateActivityTimeline();

const activityTypeFilter = document.getElementById('activityTypeFilter');
if (activityTypeFilter) {
    activityTypeFilter.addEventListener('change', (e) => {
        generateActivityTimeline(e.target.value);
    });
}

// ===== USER DETAIL MODAL =====
const userDetailModal = document.getElementById('userDetailModal');
const closeUserModal = document.getElementById('closeUserModal');

if (closeUserModal) {
    closeUserModal.addEventListener('click', () => {
        userDetailModal.classList.remove('active');
    });
}

window.addEventListener('click', (e) => {
    if (e.target === userDetailModal) {
        userDetailModal.classList.remove('active');
    }
});

function viewUserDetail(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const initials = user.name.split(' ').map(n => n[0]).join('');
    const content = document.getElementById('userDetailContent');
    
    content.innerHTML = `
        <div class="user-detail-grid">
            <div class="user-detail-sidebar">
                <div class="user-detail-avatar">${initials}</div>
                <div class="user-detail-info">
                    <div class="user-detail-name">${user.name}</div>
                    <div class="user-detail-email">${user.email}</div>
                    <span class="status-badge ${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
                </div>
                <div class="user-detail-actions">
                    ${user.status === 'pending' ? `
                        <button class="btn-primary" onclick="verifyUser(${user.id})">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Verify User
                        </button>
                    ` : ''}
                    ${user.status !== 'suspended' ? `
                        <button class="btn-secondary" onclick="suspendUser(${user.id})">Suspend User</button>
                    ` : `
                        <button class="btn-primary" onclick="unsuspendUser(${user.id})">Unsuspend User</button>
                    `}
                    <button class="btn-secondary" onclick="sendMessage(${user.id})">Send Message</button>
                </div>
            </div>
            <div class="user-detail-main">
                <div class="detail-section">
                    <h3>Account Information</h3>
                    <div class="detail-row">
                        <span class="detail-label">User ID</span>
                        <span class="detail-value">#${user.id.toString().padStart(6, '0')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Username</span>
                        <span class="detail-value">${user.username}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Phone</span>
                        <span class="detail-value">${user.phone}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Address</span>
                        <span class="detail-value">${user.address}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Joined Date</span>
                        <span class="detail-value">${new Date(user.joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Last Active</span>
                        <span class="detail-value">${user.lastActive}</span>
                    </div>
                </div>
                <div class="detail-section">
                    <h3>Seller Statistics</h3>
                    <div class="detail-row">
                        <span class="detail-label">Total Products</span>
                        <span class="detail-value">${user.products}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Total Sales</span>
                        <span class="detail-value">৳${user.totalSales.toLocaleString()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Rating</span>
                        <span class="detail-value">${user.rating} ⭐ / 5.0</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    userDetailModal.classList.add('active');
}

// ===== USER ACTIONS =====
function verifyUser(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        user.status = 'verified';
        generateUsersTable(userStatusFilter?.value || 'all');
        showNotification(`${user.name} has been verified!`, 'success');
        userDetailModal.classList.remove('active');
    }
}

function suspendUser(userId) {
    const user = users.find(u => u.id === userId);
    if (user && confirm(`Are you sure you want to suspend ${user.name}?`)) {
        user.status = 'suspended';
        generateUsersTable(userStatusFilter?.value || 'all');
        showNotification(`${user.name} has been suspended`, 'warning');
        userDetailModal.classList.remove('active');
    }
}

function unsuspendUser(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        user.status = 'verified';
        generateUsersTable(userStatusFilter?.value || 'all');
        showNotification(`${user.name} has been unsuspended`, 'success');
        userDetailModal.classList.remove('active');
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        const index = users.findIndex(u => u.id === userId);
        if (index > -1) {
            const userName = users[index].name;
            users.splice(index, 1);
            generateUsersTable(userStatusFilter?.value || 'all');
            showNotification(`${userName} has been deleted`, 'error');
        }
    }
}

function sendMessage(userId) {
    showNotification('Message functionality would be implemented here', 'info');
}

// ===== PRODUCT ACTIONS =====
function approveProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        product.status = 'active';
        generateProductsGrid(productStatusFilter?.value || 'all');
        showNotification(`${product.name} has been approved!`, 'success');
    }
}

function flagProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        product.status = 'flagged';
        generateProductsGrid(productStatusFilter?.value || 'all');
        showNotification(`${product.name} has been flagged for review`, 'warning');
    }
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        const index = products.findIndex(p => p.id === productId);
        if (index > -1) {
            const productName = products[index].name;
            products.splice(index, 1);
            generateProductsGrid(productStatusFilter?.value || 'all');
            showNotification(`${productName} has been deleted`, 'error');
        }
    }
}

// ===== ORDER ACTIONS =====
function viewOrder(orderId) {
    showNotification('Order details would be shown here', 'info');
}

function processOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = 'processing';
        generateOrdersTable(orderStatusFilter?.value || 'all');
        showNotification(`Order #${order.id} is now being processed`, 'success');
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? 'linear-gradient(135deg, #22c55e, #15803d)' : 
                     type === 'error' ? 'linear-gradient(135deg, #ef4444, #b91c1c)' :
                     type === 'warning' ? 'linear-gradient(135deg, #eab308, #a16207)' :
                     'linear-gradient(135deg, #3b82f6, #2563eb)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
        max-width: 400px;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== LOGOUT =====
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            showNotification('Logging out...', 'info');
            setTimeout(() => {
                window.location.href = '/ReVogue/Pages/login.html';
            }, 1000);
        }
    });
}

// ===== GLOBAL SEARCH =====
const globalSearch = document.getElementById('globalSearch');
if (globalSearch) {
    globalSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        console.log('Searching for:', query);
    });
}

// ===== SETTINGS =====
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
        showNotification('Settings saved successfully!', 'success');
    });
}

// ===== CHART =====
const chartCanvas = document.getElementById('userGrowthChart');
if (chartCanvas) {
    const ctx = chartCanvas.getContext('2d');
    chartCanvas.width = chartCanvas.offsetWidth;
    chartCanvas.height = 300;
    
    const data = [120, 150, 180, 220, 280, 350, 420];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const padding = 40;
    const chartWidth = chartCanvas.width - padding * 2;
    const chartHeight = chartCanvas.height - padding * 2;
    const maxValue = Math.max(...data);
    const barWidth = chartWidth / data.length - 10;
    
    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding + index * (chartWidth / data.length) + 5;
        const y = chartCanvas.height - padding - barHeight;
        
        const gradient = ctx.createLinearGradient(0, y, 0, chartCanvas.height - padding);
        gradient.addColorStop(0, '#a855f7');
        gradient.addColorStop(1, '#ec4899');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x + barWidth / 2, chartCanvas.height - padding + 20);
        ctx.fillText(value, x + barWidth / 2, y - 10);
    });
}

console.log('✅ The Renewed Studio Admin Dashboard loaded successfully!');

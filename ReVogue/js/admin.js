// /ReVogue/js/admin.js - COMPLETE VERSION WITH FIXES
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
        return !!this.getToken() && !!this.getUser();
    },
    
    isAdmin() {
        const user = this.getUser();
        console.log('Checking admin access...');
        console.log('User:', user);
        console.log('User role:', user?.role);
        return user && user.role === 'admin';
    },
    
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/ReVogue/Pages/admin-login.html';
    },

    getHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }
};

// Check admin access on page load
console.log('=== ADMIN PAGE LOADED ===');
console.log('Checking authentication...');

if (!AuthService.isAuthenticated()) {
    console.log('❌ Not authenticated - redirecting to login');
    alert('Please login to access the admin dashboard');
    window.location.href = '/ReVogue/Pages/admin-login.html';
    throw new Error('Not authenticated');
}

if (!AuthService.isAdmin()) {
    console.log('❌ Not an admin - redirecting to login');
    alert('Access Denied: Admin privileges required');
    window.location.href = '/ReVogue/Pages/admin-login.html';
    throw new Error('Not admin');
}

console.log('✅ Admin access granted');

// Global State
let users = [];
let products = [];
let orders = [];
let activities = [];
let stats = {
    totalUsers: 0,
    activeProducts: 0,
    totalRevenue: 0,
    pendingVerifications: 0
};

// Chart instance
let userGrowthChart = null;

// ===== HELPER FUNCTIONS (MUST BE DEFINED BEFORE USE) =====

function getUserInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Never';
    
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return formatDate(dateString);
}

function formatLastActive(dateString) {
    if (!dateString) return 'Never';
    
    const minutes = Math.floor((new Date() - new Date(dateString)) / 60000);
    
    if (minutes < 5) return 'Online';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
}

function isRecentlyActive(dateString) {
    if (!dateString) return false;
    const minutes = Math.floor((new Date() - new Date(dateString)) / 60000);
    return minutes < 5;
}

function getActivityIcon(type) {
    const icons = {
        user: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><circle cx="17" cy="9" r="4"></circle>',
        product: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>',
        transaction: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>',
        system: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'
    };
    return icons[type] || icons.system;
}

// Show notification
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
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Show loading
function showLoading(show) {
    let loader = document.getElementById('adminLoader');
    
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'adminLoader';
            loader.innerHTML = `
                <div style="
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 2rem;
                    border-radius: 1rem;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    z-index: 9999;
                    text-align: center;
                ">
                    <div style="
                        width: 50px;
                        height: 50px;
                        border: 4px solid #f3f4f6;
                        border-top-color: #a855f7;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 1rem;
                    "></div>
                    <p style="color: #6b7280; margin: 0;">Loading...</p>
                </div>
            `;
            document.body.appendChild(loader);
        }
    } else {
        if (loader) loader.remove();
    }
}

// API Request Helper
async function apiRequest(endpoint, options = {}) {
    try {
        console.log(`API Request: ${endpoint}`);
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: AuthService.getHeaders()
        });
        
        console.log(`Response status: ${response.status}`);
        
        const data = await response.json();
        console.log(`Response data:`, data);
        
        if (!response.ok) {
            if (response.status === 401) {
                console.log('❌ Unauthorized - redirecting to login');
                alert('Session expired. Please login again.');
                AuthService.logout();
                return;
            }
            
            throw new Error(data.error || `Request failed with status ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== LOAD DATA FROM API =====

async function loadStats() {
    try {
        console.log('Loading stats...');
        const response = await apiRequest('/admin/stats');
        stats = response.data || response;
        console.log('Stats loaded:', stats);
    } catch (error) {
        console.error('Error loading stats:', error);
        showNotification('Failed to load stats', 'error');
    }
}

async function loadUsers() {
    try {
        console.log('Loading users...');
        const response = await apiRequest('/admin/users');
        users = response.data || response || [];
        console.log('Users loaded:', users.length);
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Failed to load users', 'error');
        users = [];
    }
}

async function loadProducts() {
    try {
        console.log('Loading products...');
        const response = await apiRequest('/admin/products');
        products = response.data || response || [];
        console.log('Products loaded:', products.length);
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Failed to load products', 'error');
        products = [];
    }
}

async function loadOrders() {
    try {
        console.log('Loading orders...');
        const response = await apiRequest('/admin/orders');
        orders = response.data || response || [];
        console.log('Orders loaded:', orders.length);
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Failed to load orders', 'error');
        orders = [];
    }
}

async function loadActivityLog() {
    try {
        console.log('Loading activity log...');
        const response = await apiRequest('/admin/activity');
        activities = response.data || response || [];
        console.log('Activities loaded:', activities.length);
    } catch (error) {
        console.error('Error loading activities:', error);
        showNotification('Failed to load activity log', 'error');
        activities = [];
    }
}

// ===== RENDER FUNCTIONS =====

function renderAll() {
    renderStats();
    renderRecentActivity();
    renderUsersTable();
    renderProductsGrid();
    renderOrdersTable();
    renderActivityTimeline();
    renderChart();
}

function renderStats() {
    console.log('=== RENDERING STATS ===');
    console.log('Stats data:', stats);
    
    // Find ALL elements with data-target attribute and update them
    const allDataTargets = document.querySelectorAll('[data-target]');
    console.log('Found elements with data-target:', allDataTargets.length);
    
    allDataTargets.forEach((el, index) => {
        // Find what this stat card is for by checking the label
        const statCard = el.closest('.stat-card');
        const quickStatItem = el.closest('.quick-stat-item');
        
        if (statCard) {
            // Main stat card
            const label = statCard.querySelector('.stat-label')?.textContent;
            console.log(`Stat card ${index}: ${label}`);
            
            if (label?.includes('Total Users')) {
                animateNumber(el, stats.total_users || 0);
            } else if (label?.includes('Active Products')) {
                animateNumber(el, stats.active_products || 0);
            } else if (label?.includes('Total Revenue')) {
                // Revenue has a span inside
                const span = el.querySelector('span');
                if (span) {
                    animateNumber(span, stats.total_revenue || 0);
                }
            } else if (label?.includes('Pending')) {
                animateNumber(el, stats.pending_verifications || 0);
            }
        } else if (quickStatItem) {
            // Quick stat item
            const label = quickStatItem.querySelector('.quick-stat-label')?.textContent;
            console.log(`Quick stat ${index}: ${label}`);
            
            if (label?.includes("Today's Sales")) {
                const span = el.querySelector('span');
                if (span) {
                    animateNumber(span, stats.todays_sales || 0);
                }
            } else if (label?.includes('New Users')) {
                animateNumber(el, stats.new_users_today || 0);
            } else if (label?.includes('Products Listed')) {
                animateNumber(el, stats.products_listed_today || 0);
            } else if (label?.includes('Orders Today')) {
                animateNumber(el, stats.orders_today || 0);
            }
        }
    });
    
    console.log('✅ Stats rendered');
}

function animateNumber(element, targetValue) {
    let currentValue = 0;
    const increment = targetValue / 50;
    const duration = 1500; // 1.5 seconds
    const stepTime = duration / 50;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            element.textContent = Math.floor(targetValue).toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(currentValue).toLocaleString();
        }
    }, stepTime);
}

function renderChart() {
    const canvas = document.getElementById('userGrowthChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // If Chart.js is not loaded, create a simple canvas chart
    if (typeof Chart === 'undefined') {
        // Simple canvas-based chart
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;
        
        // Sample data
        const data = [12, 19, 15, 25, 32, 38, 47];
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        const maxValue = Math.max(...data);
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw grid lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // Draw line chart
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        
        data.forEach((value, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = height - padding - (value / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Fill area under line
        ctx.lineTo(width - padding, height - padding);
        ctx.lineTo(padding, height - padding);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw points
        ctx.fillStyle = '#a855f7';
        data.forEach((value, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = height - padding - (value / maxValue) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw white border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        
        // Draw labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        labels.forEach((label, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            ctx.fillText(label, x, height - padding + 20);
        });
        
        // Draw y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            const value = Math.round(maxValue - (maxValue / 5) * i);
            ctx.fillText(value.toString(), padding - 10, y + 4);
        }
    }
}

function renderRecentActivity() {
    const activityList = document.getElementById('recentActivityList');
    if (!activityList) return;
    
    const recentActivities = activities.slice(0, 5);
    
    if (recentActivities.length === 0) {
        activityList.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:2rem;">No recent activity</p>';
        return;
    }
    
    activityList.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${getActivityIcon(activity.type)}
                </svg>
            </div>
            <div class="activity-content">
                <div class="activity-text">
                    <strong>${activity.title || activity.action}</strong><br>
                    ${activity.description || activity.details}
                </div>
                <div class="activity-time">${formatTimeAgo(activity.created_at)}</div>
            </div>
        </div>
    `).join('');
}

function renderUsersTable(filterStatus = 'all') {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    const filteredUsers = filterStatus === 'all' 
        ? users 
        : users.filter(user => user.status === filterStatus);
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#9ca3af;">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredUsers.map(user => {
        const initials = getUserInitials(user.full_name || user.username || 'U');
        const isOnline = user.last_active && isRecentlyActive(user.last_active);
        
        return `
            <tr>
                <td><input type="checkbox" data-user-id="${user.id}"></td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">${initials}</div>
                        <div class="user-info">
                            <div class="user-name">${user.full_name || user.username || 'Unknown'}</div>
                            <div class="user-username">@${user.username || 'unknown'}</div>
                        </div>
                    </div>
                </td>
                <td>${user.email || 'N/A'}</td>
                <td>
                    <select class="status-dropdown" onchange="changeUserStatus('${user.id}', this.value)" data-user-id="${user.id}">
                        <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="verified" ${user.status === 'verified' ? 'selected' : ''}>Verified</option>
                        <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                    </select>
                </td>
                <td>${user.total_products || 0}</td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <div class="activity-indicator">
                        <div class="activity-dot ${isOnline ? 'online' : 'offline'}"></div>
                        ${formatLastActive(user.last_active)}
                    </div>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="viewUserDetail('${user.id}')" title="View Details">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button class="action-btn danger" onclick="deleteUser('${user.id}')" title="Delete User">
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

function renderProductsGrid(filterStatus = 'all') {
    const grid = document.getElementById('adminProductsGrid');
    if (!grid) return;
    
    const filteredProducts = filterStatus === 'all' 
        ? products 
        : products.filter(product => product.status === filterStatus);
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:2rem;grid-column:1/-1;">No products found</p>';
        return;
    }
    
    grid.innerHTML = filteredProducts.map(product => {
        // Map status to display text
        const statusText = {
            'available': 'Available',
            'sold': 'Sold',
            'pending': 'Pending',
            'flagged': 'Flagged',
            'suspended': 'Suspended'
        }[product.status] || product.status;
        
        return `
        <div class="admin-product-card">
            <div class="product-image-wrapper">
                <img src="${product.image_url || 'https://via.placeholder.com/400'}" alt="${product.name}" class="product-image">
                <span class="product-status status-badge ${product.status}">${statusText}</span>
                <div class="product-actions">
                    ${product.status === 'pending' || product.status === 'flagged' ? `
                    <button class="product-action-btn" onclick="approveProduct('${product.id}')" title="Approve">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </button>
                    ` : ''}
                    ${product.status !== 'suspended' ? `
                    <button class="product-action-btn" onclick="suspendProduct('${product.id}')" title="Suspend">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                    </button>
                    ` : `
                    <button class="product-action-btn" onclick="approveProduct('${product.id}')" title="Reactivate">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </button>
                    `}
                    <button class="product-action-btn" onclick="deleteProduct('${product.id}')" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="product-details-card">
                <div class="product-title">${product.name}</div>
                <div class="product-seller">by ${product.profiles?.full_name || product.profiles?.username || 'Unknown'}</div>
                <div class="product-footer">
                    <div class="product-price">৳${parseFloat(product.price).toFixed(2)}</div>
                    <div class="activity-indicator">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        ${product.views || 0}
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

function renderOrdersTable(filterStatus = 'all') {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    const filteredOrders = filterStatus === 'all' 
        ? orders 
        : orders.filter(order => order.status === filterStatus);
    
    if (filteredOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#9ca3af;">No orders found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredOrders.map(order => `
        <tr>
            <td>#${order.order_number}</td>
            <td>${order.customer_first_name} ${order.customer_last_name}</td>
            <td>${order.product_name}</td>
            <td>৳${parseFloat(order.total_amount).toFixed(2)}</td>
            <td>
                <span class="status-badge ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
            </td>
            <td>${formatDate(order.created_at)}</td>
            <td>
                <div class="table-actions">
                    <button class="action-btn" onclick="viewOrderDetails('${order.id}')" title="View">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    ${order.status === 'pending' ? `
                        <button class="action-btn" onclick="updateOrderStatus('${order.id}', 'confirmed')" title="Confirm">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                    ` : ''}
                    ${order.status === 'confirmed' ? `
                        <button class="action-btn" onclick="updateOrderStatus('${order.id}', 'shipped')" title="Mark as Shipped">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="1" y="3" width="15" height="13"></rect>
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                <circle cx="18.5" cy="18.5" r="2.5"></circle>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function renderActivityTimeline(filterType = 'all') {
    const timeline = document.getElementById('activityTimeline');
    if (!timeline) return;
    
    const filteredActivities = filterType === 'all' 
        ? activities 
        : activities.filter(activity => activity.type === filterType);
    
    if (filteredActivities.length === 0) {
        timeline.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:2rem;">No activities found</p>';
        return;
    }
    
    timeline.innerHTML = filteredActivities.map(activity => {
        const iconColors = {
            user: 'purple',
            product: 'pink',
            transaction: 'blue',
            system: 'orange'
        };
        
        return `
            <div class="timeline-item">
                <div class="timeline-icon stat-icon ${iconColors[activity.type] || 'purple'}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${getActivityIcon(activity.type)}
                    </svg>
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <div class="timeline-title">${activity.title || activity.action}</div>
                        <div class="timeline-time">${formatTimeAgo(activity.created_at)}</div>
                    </div>
                    <div class="timeline-description">${activity.description || activity.details}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== USER ACTIONS =====

async function changeUserStatus(userId, newStatus) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    try {
        showLoading(true);
        
        await apiRequest(`/admin/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        
        user.status = newStatus;
        showNotification(`User status updated to ${newStatus}`, 'success');
        
    } catch (error) {
        console.error('Error updating user status:', error);
        showNotification('Failed to update user status', 'error');
        // Revert dropdown
        renderUsersTable();
    } finally {
        showLoading(false);
    }
}

async function deleteUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (!confirm(`Are you sure you want to delete ${user.full_name || user.username}? This action cannot be undone.`)) return;
    
    try {
        showLoading(true);
        
        await apiRequest(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        users = users.filter(u => u.id !== userId);
        renderUsersTable();
        showNotification('User deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Failed to delete user', 'error');
    } finally {
        showLoading(false);
    }
}

function viewUserDetail(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    showNotification('User details feature coming soon', 'info');
}

// ===== PRODUCT ACTIONS =====

async function approveProduct(productId) {
    try {
        showLoading(true);
        
        await apiRequest(`/admin/products/${productId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'available' })
        });
        
        const product = products.find(p => p.id === productId);
        if (product) product.status = 'available';
        
        renderProductsGrid();
        showNotification('Product approved successfully', 'success');
        
    } catch (error) {
        console.error('Error approving product:', error);
        showNotification('Failed to approve product', 'error');
    } finally {
        showLoading(false);
    }
}

async function suspendProduct(productId) {
    if (!confirm('Are you sure you want to suspend this product?')) return;
    
    try {
        showLoading(true);
        
        await apiRequest(`/admin/products/${productId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'suspended' })
        });
        
        const product = products.find(p => p.id === productId);
        if (product) product.status = 'suspended';
        
        renderProductsGrid();
        showNotification('Product suspended', 'warning');
        
    } catch (error) {
        console.error('Error suspending product:', error);
        showNotification('Failed to suspend product', 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    
    try {
        showLoading(true);
        
        await apiRequest(`/admin/products/${productId}`, {
            method: 'DELETE'
        });
        
        products = products.filter(p => p.id !== productId);
        renderProductsGrid();
        showNotification('Product deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Failed to delete product', 'error');
    } finally {
        showLoading(false);
    }
}

// ===== ORDER ACTIONS =====

async function updateOrderStatus(orderId, newStatus) {
    try {
        showLoading(true);
        
        await apiRequest(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        
        const order = orders.find(o => o.id === orderId);
        if (order) order.status = newStatus;
        
        renderOrdersTable();
        showNotification(`Order ${newStatus} successfully`, 'success');
        
    } catch (error) {
        console.error('Error updating order:', error);
        showNotification('Failed to update order', 'error');
    } finally {
        showLoading(false);
    }
}

function viewOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    showNotification('Order details feature coming soon', 'info');
}

// ===== EVENT LISTENERS =====

function setupEventListeners() {
    // Navigation
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
            document.getElementById(`${section}-section`)?.classList.add('active');
            
            const titles = {
                'dashboard': 'Dashboard',
                'users': 'User Management',
                'products': 'Product Management',
                'orders': 'Order Management',
                'activity': 'Activity Log',
                'settings': 'Settings'
            };
            if (pageTitle) pageTitle.textContent = titles[section];
        });
    });
    
    // Filters
    const userStatusFilter = document.getElementById('userStatusFilter');
    if (userStatusFilter) {
        userStatusFilter.addEventListener('change', (e) => {
            renderUsersTable(e.target.value);
        });
    }
    
    const productStatusFilter = document.getElementById('productStatusFilter');
    if (productStatusFilter) {
        productStatusFilter.addEventListener('change', (e) => {
            renderProductsGrid(e.target.value);
        });
    }
    
    const orderStatusFilter = document.getElementById('orderStatusFilter');
    if (orderStatusFilter) {
        orderStatusFilter.addEventListener('change', (e) => {
            renderOrdersTable(e.target.value);
        });
    }
    
    const activityTypeFilter = document.getElementById('activityTypeFilter');
    if (activityTypeFilter) {
        activityTypeFilter.addEventListener('change', (e) => {
            renderActivityTimeline(e.target.value);
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                AuthService.logout();
            }
        });
    }
    
    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}

// ===== INITIALIZATION =====

async function initAdminDashboard() {
    try {
        showLoading(true);
        
        console.log('=== INITIALIZING ADMIN DASHBOARD ===');
        console.log('Auth Token:', AuthService.getToken() ? 'Present' : 'Missing');
        console.log('User Data:', AuthService.getUser());
        
        await Promise.all([
            loadStats(),
            loadUsers(),
            loadProducts(),
            loadOrders(),
            loadActivityLog()
        ]);
        
        renderAll();
        setupEventListeners();
        
        showLoading(false);
        console.log('✅ Admin Dashboard loaded successfully!');
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to load dashboard data: ' + error.message, 'error');
        showLoading(false);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAdminDashboard);

// Make functions globally accessible
window.changeUserStatus = changeUserStatus;
window.deleteUser = deleteUser;
window.viewUserDetail = viewUserDetail;
window.approveProduct = approveProduct;
window.suspendProduct = suspendProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetails = viewOrderDetails;

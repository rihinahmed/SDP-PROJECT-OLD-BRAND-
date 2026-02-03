// /ReVogue/js/admin.js - FIXED VERSION WITH BETTER AUTH CHECK
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

// Check admin access on page load - IMPROVED VERSION
console.log('=== ADMIN PAGE LOADED ===');
console.log('Checking authentication...');

if (!AuthService.isAuthenticated()) {
    console.log('❌ Not authenticated - redirecting to login');
    alert('Please login to access the admin dashboard');
    window.location.href = '/ReVogue/Pages/admin-login.html';
    throw new Error('Not authenticated'); // Stop execution
}

if (!AuthService.isAdmin()) {
    console.log('❌ Not an admin - redirecting to login');
    alert('Access Denied: Admin privileges required');
    window.location.href = '/ReVogue/Pages/admin-login.html';
    throw new Error('Not admin'); // Stop execution
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

// API Request Helper - IMPROVED WITH BETTER ERROR HANDLING
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
            // If 401 Unauthorized, redirect to login
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
// (Rest of the code remains the same - just the first part needed to be fixed)

function renderAll() {
    renderStats();
    renderRecentActivity();
    renderUsersTable();
    renderProductsGrid();
    renderOrdersTable();
    renderActivityTimeline();
}

function renderStats() {
    // Animate stat values
    animateStatValue('totalUsers', stats.total_users || 0);
    animateStatValue('activeProducts', stats.active_products || 0);
    animateStatValue('totalRevenue', stats.total_revenue || 0);
    animateStatValue('pendingVerifications', stats.pending_verifications || 0);
    
    // Quick stats
    animateStatValue('todaysSales', stats.todays_sales || 0);
    animateStatValue('newUsersToday', stats.new_users_today || 0);
    animateStatValue('productsListedToday', stats.products_listed_today || 0);
    animateStatValue('ordersToday', stats.orders_today || 0);
}

function animateStatValue(id, targetValue) {
    const elements = document.querySelectorAll(`[data-target="${targetValue}"]`);
    elements.forEach(element => {
        let currentValue = 0;
        const increment = targetValue / 50;
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                element.textContent = Math.floor(targetValue).toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(currentValue).toLocaleString();
            }
        }, 20);
    });
}

function renderRecentActivity() {
    const activityList = document.getElementById('recentActivityList');
    if (!activityList) return;
    
    const recentActivities = activities.slice(0, 5);
    
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

// Copy rest of functions from original admin.js
// (renderUsersTable, renderProductsGrid, renderOrdersTable, renderActivityTimeline, etc.)
// ... ALL OTHER FUNCTIONS REMAIN THE SAME ...

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
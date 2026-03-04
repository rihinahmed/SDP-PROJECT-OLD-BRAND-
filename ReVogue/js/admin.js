// /ReVogue/js/admin.js - COMPLETE FIXED VERSION
const API_URL = 'http://localhost:3000/api';
let supportConversations = [];
let activeSupportChat = null;
let supportFilterActive = 'all';

const AuthService = {
    getToken() { return localStorage.getItem('authToken'); },
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    isAuthenticated() { return !!this.getToken() && !!this.getUser(); },
    isAdmin() {
        const user = this.getUser();
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

if (!AuthService.isAuthenticated() || !AuthService.isAdmin()) {
    alert('Access Denied: Admin privileges required');
    window.location.href = '/ReVogue/Pages/admin-login.html';
    throw new Error('Not admin');
}

let users = [], products = [], orders = [], activities = [], adminMessages = [];
let stats = {};

// ─── UTILS ───────────────────────────────────────────────────────────
function getUserInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
function formatDate(d) {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatTimeAgo(d) {
    if (!d) return 'Never';
    const s = Math.floor((new Date() - new Date(d)) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    if (s < 604800) return `${Math.floor(s/86400)}d ago`;
    return formatDate(d);
}
function formatLastActive(d) {
    if (!d) return 'Never';
    const m = Math.floor((new Date() - new Date(d)) / 60000);
    if (m < 5) return 'Online';
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m/60)}h ago`;
    return `${Math.floor(m/1440)}d ago`;
}
function isRecentlyActive(d) {
    if (!d) return false;
    return Math.floor((new Date() - new Date(d)) / 60000) < 5;
}
function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}
function formatRelativeTime(ts) {
    if (!ts) return '';
    const diff = new Date() - new Date(ts);
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (day < 7) return `${day}d ago`;
    return new Date(ts).toLocaleDateString();
}
function showNotification(message, type = 'success') {
    const n = document.createElement('div');
    n.style.cssText = `position:fixed;top:2rem;right:2rem;padding:1rem 1.5rem;border-radius:.75rem;z-index:99999;color:white;font-weight:500;font-family:'DM Sans',sans-serif;font-size:.875rem;box-shadow:0 10px 40px rgba(0,0,0,.15);
        background:${type==='success'?'linear-gradient(135deg,#22c55e,#15803d)':type==='error'?'linear-gradient(135deg,#ef4444,#b91c1c)':'linear-gradient(135deg,#3b82f6,#2563eb)'};
        animation:notifSlide .3s ease;`;
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => { n.style.opacity='0'; n.style.transform='translateY(-10px)'; n.style.transition='all .3s'; setTimeout(()=>n.remove(),300); }, 3000);
}
function showLoading(show) {
    let loader = document.getElementById('adminLoader');
    if (show && !loader) {
        loader = document.createElement('div');
        loader.id = 'adminLoader';
        loader.innerHTML = `<div style="position:fixed;inset:0;background:rgba(255,255,255,.8);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999;">
            <div style="background:white;padding:2rem;border-radius:1rem;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.15);">
                <div style="width:44px;height:44px;border:3px solid #f3f4f6;border-top-color:#a855f7;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 1rem;"></div>
                <p style="color:#6b7280;margin:0;font-size:.875rem;">Loading…</p>
            </div></div>`;
        document.body.appendChild(loader);
    } else if (!show && loader) loader.remove();
}

// --- THEME ---
function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    const btn = document.getElementById('themeToggleBtn');
    const sun = btn.querySelector('.sun-icon');
    const moon = btn.querySelector('.moon-icon');
    
    if (saved === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        sun.style.display = 'block';
        moon.style.display = 'none';
    } else {
        document.body.removeAttribute('data-theme');
        sun.style.display = 'none';
        moon.style.display = 'block';
    }

    btn.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            sun.style.display = 'none';
            moon.style.display = 'block';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            sun.style.display = 'block';
            moon.style.display = 'none';
        }
    });
}
function getActivityIcon(type) {
    const icons = {
        user: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>',
        product: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>',
        transaction: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>',
        system: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'
    };
    return icons[type] || icons.system;
}

// ─── API ──────────────────────────────────────────────────────────────
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers: AuthService.getHeaders() });
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401) { alert('Session expired'); AuthService.logout(); return; }
            throw new Error(data.error || 'Request failed');
        }
        return data;
    } catch (error) { console.error('API Error:', error); throw error; }
}

// ─── DATA LOADERS ─────────────────────────────────────────────────────
async function loadStats() { try { stats = (await apiRequest('/admin/stats')).data || {}; } catch(e) { console.error(e); } }
async function loadUsers() { try { users = (await apiRequest('/admin/users')).data || []; } catch(e) { users = []; } }
async function loadProducts() { try { products = (await apiRequest('/admin/products')).data || []; } catch(e) { products = []; } }
async function loadOrders() { try { orders = (await apiRequest('/admin/orders')).data || []; } catch(e) { orders = []; } }
async function loadActivityLog() { try { activities = (await apiRequest('/admin/activity')).data || []; } catch(e) { activities = []; } }
async function loadMessages() { try { adminMessages = (await apiRequest('/contact/admin/all')).data || []; updateMessagesBadge(); } catch(e) { adminMessages = []; } }

function renderAll() {
    renderStats(); renderRecentActivity(); renderUsersTable(); renderProductsGrid();
    renderOrdersTable(); renderActivityTimeline(); renderChart(); renderMessages();
}

// ─── RENDER FUNCTIONS ─────────────────────────────────────────────────
function animateNumber(el, val) {
    let c = 0, inc = val / 50;
    const t = setInterval(() => {
        c += inc;
        if (c >= val) { el.textContent = Math.floor(val).toLocaleString(); clearInterval(t); }
        else el.textContent = Math.floor(c).toLocaleString();
    }, 30);
}
function renderStats() {
    document.querySelectorAll('[data-target]').forEach(el => {
        const card = el.closest('.stat-card'), quick = el.closest('.quick-stat-item');
        const label = card?.querySelector('.stat-label')?.textContent || quick?.querySelector('.quick-stat-label')?.textContent;
        if (label?.includes('Total Users')) animateNumber(el, stats.total_users || 0);
        else if (label?.includes('Active Products')) animateNumber(el, stats.active_products || 0);
        else if (label?.includes('Revenue')) animateNumber(el.querySelector('span') || el, stats.total_revenue || 0);
        else if (label?.includes('Pending')) animateNumber(el, stats.pending_verifications || 0);
    });
}
function renderChart() { /* Chart.js integration here if needed */ }
function renderRecentActivity() {
    const list = document.getElementById('recentActivityList');
    if (!list) return;
    list.innerHTML = activities.slice(0, 5).map(a => `
        <div class="activity-item">
            <div class="activity-icon ${a.type}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getActivityIcon(a.type)}</svg></div>
            <div class="activity-content">
                <div class="activity-text"><strong>${a.title||a.action}</strong><br>${a.description||a.details}</div>
                <div class="activity-time">${formatTimeAgo(a.created_at)}</div>
            </div>
        </div>
    `).join('') || '<p style="text-align:center;color:#9ca3af;padding:2rem;">No recent activity</p>';
}
function renderUsersTable(filter='all') {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    const filtered = filter === 'all' ? users : users.filter(u => u.status === filter);
    if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#9ca3af;">No users found</td></tr>'; return; }
    tbody.innerHTML = filtered.map(u => `
        <tr>
            <td><input type="checkbox"></td>
            <td><div class="user-cell"><div class="user-avatar">${getUserInitials(u.full_name||u.username)}</div>
                <div class="user-info"><div class="user-name">${u.full_name||u.username||'Unknown'}</div>
                <div class="user-username">@${u.username||'unknown'}</div></div></div></td>
            <td>${u.email||'N/A'}</td>
            <td><select class="status-dropdown" onchange="changeUserStatus('${u.id}',this.value)">
                <option value="pending" ${u.status==='pending'?'selected':''}>Pending</option>
                <option value="verified" ${u.status==='verified'?'selected':''}>Verified</option>
                <option value="suspended" ${u.status==='suspended'?'selected':''}>Suspended</option>
            </select></td>
            <td>${u.total_products||0}</td><td>${formatDate(u.created_at)}</td>
            <td><div class="activity-indicator"><div class="activity-dot ${isRecentlyActive(u.last_active)?'online':'offline'}"></div>${formatLastActive(u.last_active)}</div></td>
            <td><button class="action-btn" onclick="viewUserDetail('${u.id}')">View</button>
                <button class="action-btn danger" onclick="deleteUser('${u.id}')">Delete</button></td>
        </tr>
    `).join('');
}
function renderProductsGrid(filter='all') {
    const grid = document.getElementById('adminProductsGrid');
    if (!grid) return;
    const filtered = filter === 'all' ? products : products.filter(p => p.status === filter);
    if (!filtered.length) { 
        grid.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:2rem;">No products</p>'; 
        return; 
    }
    
    grid.innerHTML = filtered.map(p => {
        const sellerName = p.profiles?.full_name || p.profiles?.username || 'Unknown Seller';
        
        return `
        <div class="admin-product-card" onclick="viewProductDetails(${JSON.stringify(p).replace(/"/g, '&quot;')})">
            <div class="product-image-wrapper">
                <img src="${p.image_url||'https://via.placeholder.com/400'}" alt="${p.name}" class="product-image">
                <span class="product-status-badge-card status-${p.status}">${p.status}</span>
                <div class="product-actions" onclick="event.stopPropagation();">
                    ${p.status==='pending'?`<button class="product-action-btn approve-btn" onclick="approveProduct('${p.id}')" title="Approve">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </button>`:''}
                    ${p.status!=='suspended'?`<button class="product-action-btn flag-btn" onclick="suspendProduct('${p.id}')" title="Suspend">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                    </button>`:''}
                    <button class="product-action-btn delete-btn" onclick="deleteProduct('${p.id}')" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="product-details-card">
                <div class="product-title">${p.name}</div>
                <div class="product-seller">by ${sellerName}</div>
                <div class="product-price">৳${parseFloat(p.price).toFixed(2)}</div>
            </div>
        </div>`;
    }).join('');
}
function renderOrdersTable(filter='all') {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
    if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;">No orders</td></tr>'; return; }
    tbody.innerHTML = filtered.map(o => `
        <tr>
            <td>#${o.order_number}</td>
            <td>${o.customer_first_name} ${o.customer_last_name}</td>
            <td>${o.product_name}</td>
            <td>৳${parseFloat(o.total_amount).toFixed(2)}</td>
            <td><span class="status-badge ${o.status}">${o.status}</span></td>
            <td>${formatDate(o.created_at)}</td>
            <td><button onclick="viewOrderDetails('${o.id}')">View</button></td>
        </tr>
    `).join('');
}
function renderActivityTimeline(filter='all') {
    const tl = document.getElementById('activityTimeline');
    if (!tl) return;
    const filtered = filter === 'all' ? activities : activities.filter(a => a.type === filter);
    tl.innerHTML = filtered.map(a => `
        <div class="timeline-item">
            <div class="timeline-icon stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getActivityIcon(a.type)}</svg></div>
            <div class="timeline-content">
                <div class="timeline-header"><div class="timeline-title">${a.title||a.action}</div><div class="timeline-time">${formatTimeAgo(a.created_at)}</div></div>
                <div class="timeline-description">${a.description||a.details}</div>
            </div>
        </div>
    `).join('') || '<p style="text-align:center;color:#9ca3af;padding:2rem;">No activities</p>';
}
function renderMessages(filter='all') {
    const grid = document.getElementById('messagesGrid');
    if (!grid) return;
    const filtered = filter === 'all' ? adminMessages : filter === 'unread' ? adminMessages.filter(m=>!m.is_read) : adminMessages.filter(m=>m.type===filter);
    if (!filtered.length) {
        grid.innerHTML = `<div class="messages-empty"><div class="messages-empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div><h3>No Messages Yet</h3><p>Contact messages will appear here</p></div>`;
        return;
    }
    grid.innerHTML = filtered.map(m => {
        const initials = getUserInitials(m.sender_name||m.user?.full_name);
        const unread = !m.is_read, replied = !!m.admin_reply;
        return `<div class="message-card ${unread?'unread':''} ${replied?'replied':''}">
            ${unread?'<div class="message-status-indicator"></div>':''}
            <div class="message-header">
                <div class="message-sender-info">
                    <div class="message-avatar-lg">${initials}</div>
                    <div class="message-sender-details">
                        <div class="message-sender-name">${m.sender_name||'Anonymous'}</div>
                        <div class="message-sender-email">${m.sender_email||'No email'}</div>
                        ${m.user?`<div style="font-size:.75rem;color:#9ca3af;">User: ${m.user.username}</div>`:'<div style="font-size:.75rem;color:#9ca3af;">Guest</div>'}
                    </div>
                </div>
                <div class="message-meta">
                    <span class="message-type-badge ${m.status||'unread'}">${m.status==='replied'?'✅ Replied':m.status==='read'?'👁️ Read':'📧 New'}</span>
                    <div class="message-time-stamp">${formatTimeAgo(m.created_at)}</div>
                </div>
            </div>
            <div class="message-body">
                <div class="message-subject">${m.subject||'No Subject'}</div>
                <div class="message-content">${m.message||'No content'}</div>
                ${replied?`<div style="margin-top:1rem;padding:1rem;background:#f0fdf4;border-left:4px solid #10b981;border-radius:.5rem;">
                    <div style="font-weight:600;color:#065f46;">Your Reply:</div>
                    <div style="color:#047857;font-size:.875rem;">${m.admin_reply}</div>
                    <div style="font-size:.75rem;color:#059669;margin-top:.5rem;">Replied: ${formatTimeAgo(m.replied_at)}</div>
                </div>`:''}
            </div>
            <div class="message-actions">
                ${!replied?`<button class="btn-message-action btn-reply" onclick="replyToContactMessage('${m.id}')">Reply</button>`:''}
                ${unread?`<button class="btn-message-action btn-mark-read" onclick="markContactMessageRead('${m.id}')">Mark Read</button>`:''}
                <button class="btn-message-action btn-delete" onclick="deleteContactMessage('${m.id}')">Delete</button>
            </div>
        </div>`;
    }).join('');
}

// ─── MESSAGES HELPERS ─────────────────────────────────────────────────
function updateMessagesBadge() {
    const badge = document.getElementById('messagesBadgeNav');
    if (badge) {
        const count = adminMessages.filter(m=>!m.is_read).length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}
async function replyToContactMessage(id) {
    const m = adminMessages.find(x=>x.id===id);
    if (!m) return;
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `<div class="modal-content">
        <div class="modal-header"><h2>Reply to ${m.sender_name}</h2><button class="modal-close" onclick="this.closest('.modal').remove()">×</button></div>
        <div class="modal-body">
            <div style="background:#fef3c7;padding:1rem;border-radius:.75rem;margin-bottom:1rem;">
                <strong>Subject:</strong> ${m.subject}<br><strong>Message:</strong> "${m.message}"
            </div>
            <form onsubmit="sendContactReply(event,'${m.id}','${m.sender_email}')">
                <textarea id="replyText" placeholder="Your reply..." required style="width:100%;min-height:100px;padding:.75rem;border-radius:.5rem;border:1px solid #ddd;font-family:inherit;"></textarea>
                <div style="margin-top:1rem;display:flex;gap:.5rem;justify-content:flex-end;">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="submit" class="btn-primary">Send Reply</button>
                </div>
            </form>
        </div>
    </div>`;
    document.body.appendChild(modal);
}
async function sendContactReply(e, id, email) {
    e.preventDefault();
    const reply = document.getElementById('replyText').value;
    try {
        showLoading(true);
        const res = await apiRequest(`/contact/admin/${id}/reply`, { method:'POST', body:JSON.stringify({ reply, recipient_email:email }) });
        if (res.success) {
            showNotification('Reply sent!', 'success');
            e.target.closest('.modal').remove();
            const m = adminMessages.find(x=>x.id===id);
            if (m) { m.admin_reply=reply; m.replied_at=new Date().toISOString(); m.status='replied'; m.is_read=true; }
            updateMessagesBadge(); renderMessages();
        }
    } catch(err) { showNotification('Failed to send reply','error'); }
    finally { showLoading(false); }
}
async function markContactMessageRead(id) {
    try {
        const res = await apiRequest(`/contact/admin/${id}/read`, { method:'PUT' });
        if (res.success) {
            const m = adminMessages.find(x=>x.id===id);
            if (m) { m.is_read=true; m.status='read'; }
            updateMessagesBadge(); renderMessages(); showNotification('Marked as read','success');
        }
    } catch(e) { showNotification('Failed','error'); }
}
async function deleteContactMessage(id) {
    if (!confirm('Delete this message?')) return;
    try {
        showLoading(true);
        const res = await apiRequest(`/contact/admin/${id}`, { method:'DELETE' });
        if (res.success) { adminMessages=adminMessages.filter(m=>m.id!==id); updateMessagesBadge(); renderMessages(); showNotification('Deleted','success'); }
    } catch(e) { showNotification('Failed to delete','error'); }
    finally { showLoading(false); }
}
function markAllMessagesRead() { adminMessages.filter(m=>!m.is_read).forEach(m=>markContactMessageRead(m.id)); }

// ─── USER / PRODUCT / ORDER ACTIONS ──────────────────────────────────
async function changeUserStatus(id, status) {
    try { showLoading(true); await apiRequest(`/admin/users/${id}/status`,{method:'PUT',body:JSON.stringify({status})}); const u=users.find(x=>x.id===id); if(u)u.status=status; showNotification('Updated','success'); }
    catch(e) { showNotification('Failed','error'); renderUsersTable(); }
    finally { showLoading(false); }
}
async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    try { showLoading(true); await apiRequest(`/admin/users/${id}`,{method:'DELETE'}); users=users.filter(u=>u.id!==id); renderUsersTable(); showNotification('Deleted','success'); }
    catch(e) { showNotification('Failed','error'); }
    finally { showLoading(false); }
}
function viewUserDetail(id) { showNotification('Feature coming soon','info'); }
async function approveProduct(id) {
    try { showLoading(true); await apiRequest(`/admin/products/${id}/status`,{method:'PUT',body:JSON.stringify({status:'available'})}); const p=products.find(x=>x.id===id); if(p)p.status='available'; renderProductsGrid(); showNotification('Approved','success'); }
    catch(e) { showNotification('Failed','error'); }
    finally { showLoading(false); }
}
async function suspendProduct(id) {
    if (!confirm('Suspend this product?')) return;
    try { showLoading(true); await apiRequest(`/admin/products/${id}/status`,{method:'PUT',body:JSON.stringify({status:'suspended'})}); const p=products.find(x=>x.id===id); if(p)p.status='suspended'; renderProductsGrid(); showNotification('Suspended','warning'); }
    catch(e) { showNotification('Failed','error'); }
    finally { showLoading(false); }
}
async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    try { showLoading(true); await apiRequest(`/admin/products/${id}`,{method:'DELETE'}); products=products.filter(p=>p.id!==id); renderProductsGrid(); showNotification('Deleted','success'); }
    catch(e) { showNotification('Failed','error'); }
    finally { showLoading(false); }
}

function viewProductDetails(product) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2 class="modal-title">Product Details</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="product-modal-content">
                    <div class="pm-image-col">
                        <img src="${product.image_url || 'https://via.placeholder.com/400'}" alt="${product.name}">
                        <div style="margin-top:1rem;">
                            <span class="status-badge ${product.status}">${product.status}</span>
                        </div>
                    </div>
                    <div class="pm-info-col">
                        <h3 class="pm-title">${product.name}</h3>
                        <div class="pm-price">৳${parseFloat(product.price).toFixed(2)}</div>
                        
                        <div class="pm-meta-grid">
                            <div class="pm-meta-item">
                                <label>Category</label>
                                <span>${product.category || 'N/A'}</span>
                            </div>
                            <div class="pm-meta-item">
                                <label>Condition</label>
                                <span>${product.condition || 'N/A'}</span>
                            </div>
                            <div class="pm-meta-item">
                                <label>Size</label>
                                <span>${product.size || 'N/A'}</span>
                            </div>
                            <div class="pm-meta-item">
                                <label>Brand</label>
                                <span>${product.brand || 'N/A'}</span>
                            </div>
                            <div class="pm-meta-item">
                                <label>Seller</label>
                                <span>${product.profiles?.full_name || product.profiles?.username || 'Unknown'}</span>
                            </div>
                            <div class="pm-meta-item">
                                <label>Posted</label>
                                <span>${formatDate(product.created_at)}</span>
                            </div>
                        </div>

                        <div class="pm-description">
                            <strong style="display:block;margin-bottom:0.5rem;color:var(--text-main);">Description:</strong>
                            ${product.description || 'No description provided.'}
                        </div>

                        <div class="pm-actions">
                            ${product.status==='pending'?`
                                <button class="btn-action-lg btn-approve" onclick="approveProduct('${product.id}'); this.closest('.modal').remove();">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    Approve
                                </button>
                            `:''}
                            ${product.status!=='suspended'?`
                                <button class="btn-action-lg btn-suspend" onclick="suspendProduct('${product.id}'); this.closest('.modal').remove();">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                    </svg>
                                    Suspend
                                </button>
                            `:''}
                            <button class="btn-action-lg btn-delete" onclick="deleteProduct('${product.id}'); this.closest('.modal').remove();">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}
function viewOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showNotification('Order not found', 'error');
        return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'orderDetailModal';
    
    const statusColors = {
        pending: '#f59e0b',
        confirmed: '#3b82f6',
        processing: '#8b5cf6',
        shipped: '#a855f7',
        delivered: '#10b981',
        cancelled: '#ef4444'
    };

    const currentStatus = order.status || 'pending';
    
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <div>
                    <h2 class="modal-title">Order Details</h2>
                    <p style="color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem;">Order #${order.order_number}</p>
                </div>
                <button class="modal-close" onclick="document.getElementById('orderDetailModal').remove()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <div class="order-detail-grid">
                    <!-- Status Section -->
                    <div class="order-detail-section">
                        <div class="order-section-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <h3>Order Status</h3>
                        </div>
                        <div class="order-detail-content">
                            <div class="status-change-section">
                                <div class="current-status-display">
                                    <span style="font-size: 0.875rem; color: #6b7280;">Current Status:</span>
                                    <span class="status-badge ${currentStatus}" style="font-size: 1rem; padding: 0.5rem 1rem; margin-top: 0.5rem;">
                                        ${currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                                    </span>
                                </div>
                                
                                <div style="margin-top: 1.5rem;">
                                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">
                                        Change Status:
                                    </label>
                                    <select id="orderStatusSelect" class="status-select-large">
                                        <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
                                        <option value="confirmed" ${currentStatus === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                        <option value="processing" ${currentStatus === 'processing' ? 'selected' : ''}>Processing</option>
                                        <option value="shipped" ${currentStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
                                        <option value="delivered" ${currentStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
                                        <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                    </select>
                                    <button class="btn-update-status" onclick="updateOrderStatus('${order.id}')">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        Update Status
                                    </button>
                                </div>

                                <div class="status-timeline">
                                    <div class="timeline-item ${['pending','confirmed','processing','shipped','delivered'].indexOf(currentStatus) >= 0 ? 'completed' : ''}">
                                        <div class="timeline-dot"></div>
                                        <div class="timeline-label">Pending</div>
                                    </div>
                                    <div class="timeline-line ${['confirmed','processing','shipped','delivered'].indexOf(currentStatus) >= 0 ? 'completed' : ''}"></div>
                                    <div class="timeline-item ${['confirmed','processing','shipped','delivered'].indexOf(currentStatus) >= 0 ? 'completed' : ''}">
                                        <div class="timeline-dot"></div>
                                        <div class="timeline-label">Confirmed</div>
                                    </div>
                                    <div class="timeline-line ${['processing','shipped','delivered'].indexOf(currentStatus) >= 0 ? 'completed' : ''}"></div>
                                    <div class="timeline-item ${['processing','shipped','delivered'].indexOf(currentStatus) >= 0 ? 'completed' : ''}">
                                        <div class="timeline-dot"></div>
                                        <div class="timeline-label">Processing</div>
                                    </div>
                                    <div class="timeline-line ${['shipped','delivered'].indexOf(currentStatus) >= 0 ? 'completed' : ''}"></div>
                                    <div class="timeline-item ${['shipped','delivered'].indexOf(currentStatus) >= 0 ? 'completed' : ''}">
                                        <div class="timeline-dot"></div>
                                        <div class="timeline-label">Shipped</div>
                                    </div>
                                    <div class="timeline-line ${currentStatus === 'delivered' ? 'completed' : ''}"></div>
                                    <div class="timeline-item ${currentStatus === 'delivered' ? 'completed' : ''}">
                                        <div class="timeline-dot"></div>
                                        <div class="timeline-label">Delivered</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Customer Information -->
                    <div class="order-detail-section">
                        <div class="order-section-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                            </svg>
                            <h3>Customer Information</h3>
                        </div>
                        <div class="order-detail-content">
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Full Name</label>
                                    <span>${order.customer_first_name} ${order.customer_last_name}</span>
                                </div>
                                <div class="info-item">
                                    <label>Phone Number</label>
                                    <span>${order.customer_phone || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Shipping Information -->
                    <div class="order-detail-section">
                        <div class="order-section-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            <h3>Shipping Address</h3>
                        </div>
                        <div class="order-detail-content">
                            <div class="address-display">
                                <p>${order.shipping_address}</p>
                                <p>${order.shipping_city}, ${order.shipping_postal_code}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Product Information -->
                    <div class="order-detail-section">
                        <div class="order-section-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            </svg>
                            <h3>Product Details</h3>
                        </div>
                        <div class="order-detail-content">
                            <div class="product-order-card">
                                ${order.product_image ? `<img src="${order.product_image}" alt="${order.product_name}" class="product-order-img">` : ''}
                                <div class="product-order-info">
                                    <div class="product-order-name">${order.product_name || 'Product'}</div>
                                    <div class="product-order-price">৳${parseFloat(order.subtotal || order.total_amount).toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Information -->
                    <div class="order-detail-section">
                        <div class="order-section-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                            <h3>Payment Information</h3>
                        </div>
                        <div class="order-detail-content">
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Payment Method</label>
                                    <span class="payment-method-badge">${order.payment_method?.toUpperCase() || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Payment Status</label>
                                    <span class="payment-status-badge status-${order.payment_status || 'pending'}">
                                        ${(order.payment_status || 'pending').charAt(0).toUpperCase() + (order.payment_status || 'pending').slice(1)}
                                    </span>
                                </div>
                                <div class="info-item">
                                    <label>Subtotal</label>
                                    <span>৳${parseFloat(order.subtotal || order.total_amount).toFixed(2)}</span>
                                </div>
                                <div class="info-item">
                                    <label>Shipping Cost</label>
                                    <span>৳${parseFloat(order.shipping_cost || 0).toFixed(2)}</span>
                                </div>
                                <div class="info-item">
                                    <label>Total Amount</label>
                                    <span style="font-weight: 700; font-size: 1.125rem; color: #a855f7;">৳${parseFloat(order.total_amount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Order Metadata -->
                    <div class="order-detail-section">
                        <div class="order-section-header">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <h3>Order Information</h3>
                        </div>
                        <div class="order-detail-content">
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Order Date</label>
                                    <span>${formatDate(order.created_at)}</span>
                                </div>
                                <div class="info-item">
                                    <label>Last Updated</label>
                                    <span>${formatTimeAgo(order.updated_at || order.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn-secondary" onclick="document.getElementById('orderDetailModal').remove()">
                    Close
                </button>
                <button class="btn-danger" onclick="deleteOrderAdmin('${order.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete Order
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

async function updateOrderStatus(orderId) {
    const selectElement = document.getElementById('orderStatusSelect');
    if (!selectElement) return;
    
    const newStatus = selectElement.value;
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        showNotification('Order not found', 'error');
        return;
    }

    if (order.status === newStatus) {
        showNotification('Status is already ' + newStatus, 'info');
        return;
    }

    try {
        showLoading(true);
        
        const response = await apiRequest(`/admin/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });

        if (response.success) {
            // Update local data
            order.status = newStatus;
            order.updated_at = new Date().toISOString();
            
            showNotification(`Order status updated to ${newStatus}`, 'success');
            
            // Reload orders table
            renderOrdersTable();
            
            // Close and reopen modal to show updated status
            document.getElementById('orderDetailModal')?.remove();
            setTimeout(() => viewOrderDetails(orderId), 300);
        }
    } catch (error) {
        console.error('Update order status error:', error);
        showNotification('Failed to update order status', 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteOrderAdmin(orderId) {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
        return;
    }

    try {
        showLoading(true);
        
        const response = await apiRequest(`/admin/orders/${orderId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            // Remove from local array
            orders = orders.filter(o => o.id !== orderId);
            
            // Close modal
            document.getElementById('orderDetailModal')?.remove();
            
            // Reload table
            renderOrdersTable();
            
            showNotification('Order deleted successfully', 'success');
        }
    } catch (error) {
        console.error('Delete order error:', error);
        showNotification('Failed to delete order', 'error');
    } finally {
        showLoading(false);
    }
}

// ═══════════════════════════════════════════════════════════════════════
// ✅ LIVE SUPPORT CHAT - COMPLETELY FIXED
// ═══════════════════════════════════════════════════════════════════════

async function loadSupportConversations() {
    try {
        console.log('=== LOADING SUPPORT CONVERSATIONS ===');

        const response = await fetch(`${API_URL}/support/admin/conversations`, {
            headers: AuthService.getHeaders()   // ✅ FIXED: was getAuthHeaders()
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data.success) {
            supportConversations = data.data || [];
            console.log('✅ Loaded conversations:', supportConversations.length);
            renderSupportConversations();
            updateSupportBadge();
            updateSupportPageStats();
        }
    } catch (error) {
        console.error('Load support conversations error:', error);
        supportConversations = [];
        renderSupportConversations();
    }
}

function updateSupportPageStats() {
    const openCount = supportConversations.filter(c => c.status === 'open').length;
    const unreadCount = supportConversations.reduce((s, c) => s + (c.unread_count || 0), 0);
    const openEl = document.getElementById('supportOpenCount');
    const unreadEl = document.getElementById('supportUnreadCount');
    if (openEl) openEl.textContent = openCount;
    if (unreadEl) unreadEl.textContent = unreadCount;
}

function renderSupportConversations() {
    const container = document.getElementById('supportConversationsList');
    if (!container) return;

    // Apply filter
    let filtered = supportConversations;
    if (supportFilterActive !== 'all') {
        filtered = supportConversations.filter(c => c.status === supportFilterActive);
    }

    if (!filtered.length) {
        container.innerHTML = `
            <div class="support-empty">
                <div class="support-empty-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                </div>
                <h3>No conversations${supportFilterActive !== 'all' ? ` marked "${supportFilterActive}"` : ' yet'}</h3>
                <p>When users start a live chat, their conversations will appear here.</p>
            </div>`;
        return;
    }

    container.innerHTML = filtered.map(conv => {
        const user      = conv.profiles;
        const userName  = user?.full_name || user?.username || 'Anonymous User';
        const userEmail = user?.email || '';
        const initials  = getUserInitials(userName);
        const hasUnread = conv.unread_count > 0;

        const statusConfig = {
            open:     { class: 'sc-pill-open',     label: 'Open'     },
            closed:   { class: 'sc-pill-closed',   label: 'Closed'   },
            resolved: { class: 'sc-pill-resolved', label: 'Resolved' }
        };
        const sc = statusConfig[conv.status] || statusConfig.open;

        return `
        <div class="sc-conv-card ${hasUnread ? 'has-unread' : ''}" onclick="openSupportChat('${conv.id}')">
            <div class="sc-conv-avatar-wrap">
                <div class="sc-conv-avatar">${initials}</div>
                ${hasUnread ? '<div class="sc-conv-online-dot"></div>' : ''}
            </div>
            <div class="sc-conv-body">
                <div class="sc-conv-row1">
                    <span class="sc-conv-name">${userName}</span>
                    <span class="sc-conv-time">${formatRelativeTime(conv.last_message_at)}</span>
                </div>
                <div class="sc-conv-row2">
                    <span class="sc-conv-email">${userEmail}</span>
                    <div class="sc-conv-meta">
                        ${hasUnread ? `<span class="sc-conv-unread-badge">${conv.unread_count}</span>` : ''}
                        <span class="sc-status-pill ${sc.class}">${sc.label}</span>
                    </div>
                </div>
            </div>
            <div class="sc-conv-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
        </div>`;
    }).join('');
}

function updateSupportBadge() {
    const badge = document.getElementById('supportChatBadge');
    if (!badge) return;
    const total = supportConversations.reduce((s, c) => s + (c.unread_count || 0), 0);
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
}

async function openSupportChat(conversationId) {
    try {
        console.log('=== OPENING SUPPORT CHAT ===', conversationId);
        activeSupportChat = conversationId;

        // Show modal immediately
        const modal = document.getElementById('supportChatModal');
        modal.classList.add('active');

        // Reset to loading state
        document.getElementById('supportChatUsername').textContent = 'Loading…';
        document.getElementById('scUserEmail').textContent = '';
        document.getElementById('scUserAvatar').textContent = '…';
        document.getElementById('supportChatMessages').innerHTML = `
            <div class="sc-loading">
                <div class="sc-spinner"></div>
                <span>Loading conversation…</span>
            </div>`;

        const response = await fetch(
            `${API_URL}/support/admin/conversation/${conversationId}/messages`,
            { headers: AuthService.getHeaders() }   // ✅ FIXED
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.success && data.data) {
            const { conversation, messages } = data.data;
            const user     = conversation.profiles;
            const userName = user?.full_name || user?.username || 'Anonymous User';
            const initials = getUserInitials(userName);

            // Update header
            document.getElementById('supportChatUsername').textContent = userName;
            document.getElementById('scUserEmail').textContent = user?.email || 'Customer';
            document.getElementById('scUserAvatar').textContent = initials;

            // Status badge
            const statusBadge = document.getElementById('scStatusBadge');
            const statusConfig = {
                open:     { class: 'sc-badge-open',     label: '● Open'     },
                closed:   { class: 'sc-badge-closed',   label: '● Closed'   },
                resolved: { class: 'sc-badge-resolved', label: '● Resolved' }
            };
            const sc = statusConfig[conversation.status] || statusConfig.open;
            statusBadge.textContent = sc.label;
            statusBadge.className   = `sc-status-badge ${sc.class}`;

            renderSupportMessages(messages);
            await loadSupportConversations();
        }
    } catch (error) {
        console.error('openSupportChat error:', error);
        showNotification('Failed to load conversation', 'error');
    }
}

function closeSupportModal() {
    document.getElementById('supportChatModal').classList.remove('active');
    activeSupportChat = null;
}

function renderSupportMessages(messages) {
    const container = document.getElementById('supportChatMessages');
    if (!container) return;

    if (!messages.length) {
        container.innerHTML = `
            <div class="sc-no-messages">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p>No messages yet. Say hello!</p>
            </div>`;
        return;
    }

    // Group messages by date
    let lastDate = null;
    const html = messages.map(msg => {
        const isAdmin  = msg.sender_type === 'admin';
        const isSystem = msg.sender_type === 'system';
        const msgDate  = new Date(msg.created_at).toDateString();
        const time     = new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

        let dateSep = '';
        if (msgDate !== lastDate) {
            lastDate = msgDate;
            const dateLabel = msgDate === new Date().toDateString() ? 'Today'
                : msgDate === new Date(Date.now()-86400000).toDateString() ? 'Yesterday'
                : new Date(msg.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric' });
            dateSep = `<div class="sc-date-sep"><span>${dateLabel}</span></div>`;
        }

        if (isSystem) {
            return `${dateSep}
            <div class="sc-msg-system">
                <span>${escapeHtml(msg.message)}</span>
            </div>`;
        }

        return `${dateSep}
        <div class="sc-msg-row ${isAdmin ? 'sc-msg-right' : 'sc-msg-left'}">
            ${!isAdmin ? `<div class="sc-msg-avatar-sm">U</div>` : ''}
            <div class="sc-msg-col">
                <div class="sc-msg-bubble ${isAdmin ? 'sc-bubble-admin' : 'sc-bubble-user'}">${escapeHtml(msg.message)}</div>
                <div class="sc-msg-time">${time}</div>
            </div>
            ${isAdmin ? `<div class="sc-msg-avatar-sm sc-av-admin">A</div>` : ''}
        </div>`;
    }).join('');

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

async function sendSupportReply() {
    const input = document.getElementById('supportChatInput');
    if (!input || !activeSupportChat) return;
    const message = input.value.trim();
    if (!message) return;

    const container = document.getElementById('supportChatMessages');
    const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

    // Optimistic render
    container.insertAdjacentHTML('beforeend', `
        <div class="sc-msg-row sc-msg-right">
            <div class="sc-msg-col">
                <div class="sc-msg-bubble sc-bubble-admin">${escapeHtml(message)}</div>
                <div class="sc-msg-time">${time}</div>
            </div>
            <div class="sc-msg-avatar-sm sc-av-admin">A</div>
        </div>`);
    container.scrollTop = container.scrollHeight;
    input.value = '';

    try {
        const res = await fetch(
            `${API_URL}/support/admin/conversation/${activeSupportChat}/reply`,
            {
                method: 'POST',
                headers: AuthService.getHeaders(),   // ✅ FIXED
                body: JSON.stringify({ message })
            }
        );
        if (!res.ok) throw new Error('Failed');
        showNotification('Reply sent ✓', 'success');
        await loadSupportConversations();
    } catch (err) {
        console.error('sendSupportReply error:', err);
        showNotification('Failed to send reply', 'error');
    }
}

async function updateSupportStatus(status) {
    if (!activeSupportChat) return;
    try {
        const res = await fetch(
            `${API_URL}/support/admin/conversation/${activeSupportChat}/status`,
            {
                method: 'PUT',
                headers: AuthService.getHeaders(),   // ✅ FIXED
                body: JSON.stringify({ status })
            }
        );
        if (!res.ok) throw new Error('Failed');

        const badge = document.getElementById('scStatusBadge');
        const config = {
            open:     { class: 'sc-badge-open',     label: '● Open'     },
            closed:   { class: 'sc-badge-closed',   label: '● Closed'   },
            resolved: { class: 'sc-badge-resolved', label: '● Resolved' }
        };
        const sc = config[status] || config.open;
        if (badge) { badge.textContent = sc.label; badge.className = `sc-status-badge ${sc.class}`; }

        showNotification(`Marked as ${status}`, 'success');
        await loadSupportConversations();
    } catch (err) {
        showNotification('Failed to update status', 'error');
    }
}

// ─── EVENT LISTENERS ──────────────────────────────────────────────────
function setupEventListeners() {
    // Nav section switching
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const section = item.dataset.section;
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.content-section').forEach(c => c.classList.remove('active'));
            document.getElementById(`${section}-section`)?.classList.add('active');

            // Update page title
            const titles = { dashboard:'Dashboard', users:'User Management', products:'Products', orders:'Orders', activity:'Activity Log', messages:'Messages', support:'Live Support', settings:'Settings' };
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) pageTitle.textContent = titles[section] || section;

            // Load support when switching to that section
            if (section === 'support') loadSupportConversations();
        });
    });

    // Filter dropdowns
    ['userStatusFilter','productStatusFilter','orderStatusFilter','activityTypeFilter','messageTypeFilter'].forEach(f => {
        const el = document.getElementById(f);
        if (el) el.addEventListener('change', e => {
            if (f.includes('user')) renderUsersTable(e.target.value);
            else if (f.includes('product')) renderProductsGrid(e.target.value);
            else if (f.includes('order')) renderOrdersTable(e.target.value);
            else if (f.includes('activity')) renderActivityTimeline(e.target.value);
            else if (f.includes('message')) renderMessages(e.target.value);
        });
    });

    // Support filter buttons
    document.querySelectorAll('.support-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.support-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            supportFilterActive = btn.dataset.filter;
            renderSupportConversations();
        });
    });

    // Support chat modal buttons
    document.getElementById('supportChatSendBtn')?.addEventListener('click', sendSupportReply);
    document.getElementById('supportChatInput')?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSupportReply(); }
    });
    document.getElementById('closeSupportChat')?.addEventListener('click', closeSupportModal);
    document.getElementById('supportChatModal')?.addEventListener('click', e => {
        if (e.target === document.getElementById('supportChatModal')) closeSupportModal();
    });
    document.getElementById('markSupportResolved')?.addEventListener('click', () => updateSupportStatus('resolved'));
    document.getElementById('closeSupportConv')?.addEventListener('click', () => updateSupportStatus('closed'));
    document.getElementById('reopenSupportConv')?.addEventListener('click', () => updateSupportStatus('open'));

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => { if (confirm('Logout?')) AuthService.logout(); });

    // Mobile menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('open');
    });
}

// ─── INIT ─────────────────────────────────────────────────────────────
async function initAdminDashboard() {
    try {
        initTheme(); // ✅ ADD THIS LINE
        showLoading(true);
        await Promise.all([loadStats(), loadUsers(), loadProducts(), loadOrders(), loadActivityLog(), loadMessages()]);
        renderAll();
        setupEventListeners();
    } catch (error) {
        console.error('Init error:', error);
        showNotification('Failed to load dashboard', 'error');
    } finally {
        showLoading(false);
    }
}

// Auto-refresh support every 15 seconds
setInterval(() => {
    const supportSection = document.getElementById('support-section');
    if (supportSection?.classList.contains('active')) {
        loadSupportConversations();
    }
}, 15000);

// Globals
window.openSupportChat = openSupportChat;
window.changeUserStatus = changeUserStatus;
window.deleteUser = deleteUser;
window.viewUserDetail = viewUserDetail;
window.approveProduct = approveProduct;
window.suspendProduct = suspendProduct;
window.deleteProduct = deleteProduct;
window.viewOrderDetails = viewOrderDetails;
window.replyToContactMessage = replyToContactMessage;
window.sendContactReply = sendContactReply;
window.markContactMessageRead = markContactMessageRead;
window.deleteContactMessage = deleteContactMessage;
window.markAllMessagesRead = markAllMessagesRead;
window.viewProductDetails = viewProductDetails;
window.viewOrderDetails = viewOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.deleteOrderAdmin = deleteOrderAdmin;

const style = document.createElement('style');
style.textContent = '@keyframes spin{to{transform:rotate(360deg)}} @keyframes notifSlide{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}';
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', initAdminDashboard);


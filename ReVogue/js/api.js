// Create a new file: /ReVogue/js/api.js

const API_URL = 'http://localhost:3000/api';

// Storage for auth token
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
    
    getHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    },
    
    getMultipartHeaders() {
        const token = this.getToken();
        return {
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }
};

// API Service
const API = {
    // Auth endpoints
    async register(email, password, username, fullName) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, username, fullName })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    async login(email, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        // Store token
        if (data.session?.access_token) {
            AuthService.setToken(data.session.access_token);
        }
        return data;
    },

    async logout() {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: AuthService.getHeaders()
        });
        AuthService.removeToken();
        return response.json();
    },

    async getProfile() {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: AuthService.getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    async updateProfile(profileData) {
        const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: AuthService.getHeaders(),
            body: JSON.stringify(profileData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    // Product endpoints
    async getProducts(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_URL}/products?${params}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    async getProduct(id) {
        const response = await fetch(`${API_URL}/products/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    async createProduct(formData) {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: AuthService.getMultipartHeaders(),
            body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    async updateProduct(id, formData) {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: AuthService.getMultipartHeaders(),
            body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    async deleteProduct(id) {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: AuthService.getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    async addToFavorites(productId) {
        const response = await fetch(`${API_URL}/products/${productId}/favorite`, {
            method: 'POST',
            headers: AuthService.getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    async removeFromFavorites(productId) {
        const response = await fetch(`${API_URL}/products/${productId}/favorite`, {
            method: 'DELETE',
            headers: AuthService.getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    async getFavorites() {
        const response = await fetch(`${API_URL}/products/favorites`, {
            headers: AuthService.getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    // Message endpoints
    async getConversations() {
        const response = await fetch(`${API_URL}/messages/conversations`, {
            headers: AuthService.getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    async getMessages(conversationId) {
        const response = await fetch(`${API_URL}/messages/${conversationId}`, {
            headers: AuthService.getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    async sendMessage(messageData) {
        const response = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: AuthService.getHeaders(),
            body: JSON.stringify(messageData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    // Notification endpoints
    async getNotifications() {
        const response = await fetch(`${API_URL}/notifications`, {
            headers: AuthService.getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    async markNotificationAsRead(id) {
        const response = await fetch(`${API_URL}/notifications/${id}/read`, {
            method: 'PUT',
            headers: AuthService.getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    async markAllNotificationsAsRead() {
        const response = await fetch(`${API_URL}/notifications/read-all`, {
            method: 'PUT',
            headers: AuthService.getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    },

    async getUnreadCount() {
        const response = await fetch(`${API_URL}/notifications/unread-count`, {
            headers: AuthService.getHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    }
};

// Example usage in your existing index.js:

// Update the loadProducts function
async function loadProducts() {
    try {
        const filters = {
            category: currentCategory,
            condition: currentCondition,
            maxPrice: currentMaxPrice,
            sortBy: currentSort,
            search: currentSearch
        };

        const products = await API.getProducts(filters);
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products');
    }
}

// Update the sell form submission
document.getElementById('sellForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const formData = new FormData();
        formData.append('name', document.getElementById('productName').value);
        formData.append('description', document.getElementById('productDescription').value);
        formData.append('price', document.getElementById('productPrice').value);
        formData.append('category', document.getElementById('productCategory').value);
        formData.append('condition', document.getElementById('productCondition').value);
        formData.append('size', document.getElementById('productSize').value);
        formData.append('usageTime', document.getElementById('productUsageTime').value);
        
        const imageInput = document.getElementById('imageInput');
        if (imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }

        const result = await API.createProduct(formData);
        alert('Product listed successfully!');
        closeSellModal();
        loadProducts(); // Reload products
    } catch (error) {
        console.error('Error creating product:', error);
        alert('Failed to create product: ' + error.message);
    }
});

// Add to favorites
async function toggleFavorite(productId) {
    try {
        // Check if already favorited (you'll need to track this)
        const isFavorited = false; // Implement your logic
        
        if (isFavorited) {
            await API.removeFromFavorites(productId);
        } else {
            await API.addToFavorites(productId);
        }
        
        // Update UI
        updateFavoriteButton(productId);
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Please login to add favorites');
    }
}
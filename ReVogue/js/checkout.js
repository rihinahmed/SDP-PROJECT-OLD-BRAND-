// /ReVogue/js/checkout.js - DYNAMIC VERSION WITH DATABASE
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

// Data State
let cart = [];
let product = null;
let discount = 0;
let discountCode = "";
let orderNumber = '';

// Valid Promo Codes
const PROMO_CODES = {
    'REVOGUE10': 0.10, // 10%
    'WELCOME20': 0.20, // 20%
    'FREESHIP': 'shipping' // Free Shipping
};

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 1rem;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Check authentication
function checkAuth() {
    if (!AuthService.isAuthenticated()) {
        showNotification('Please login to checkout', 'error');
        setTimeout(() => window.location.href = '/ReVogue/Pages/login.html', 1500);
        return false;
    }
    return true;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    loadCartData();
    prefillUserData();
    setupEventListeners();
});

// Load Cart Data from localStorage
function loadCartData() {
    console.log('=== LOADING CART DATA ===');
    
    // Get cart from localStorage
    const storedCart = localStorage.getItem('revogueCart');
    
    if (!storedCart) {
        showNotification('Your cart is empty', 'error');
        setTimeout(() => window.location.href = '/ReVogue/Pages/shop.html', 1500);
        return;
    }
    
    try {
        cart = JSON.parse(storedCart);
        console.log('Cart loaded:', cart);
        
        if (cart.length === 0) {
            showNotification('Your cart is empty', 'error');
            setTimeout(() => window.location.href = '/ReVogue/Pages/shop.html', 1500);
            return;
        }
        
        // For now, checkout first item (you can modify for multiple items)
        product = cart[0];
        
        // Set default shipping
        if (!product.shipping) {
            product.shipping = 120.00;
        }
        
        console.log('Product for checkout:', product);
        
        // Populate UI
        populateProductUI();
        calculateTotals();
        
    } catch (error) {
        console.error('Error loading cart:', error);
        showNotification('Error loading cart data', 'error');
    }
}

// Populate Product UI
function populateProductUI() {
    if (!product) return;
    
    document.getElementById('summaryName').textContent = product.name || 'Product';
    document.getElementById('summaryCondition').textContent = product.condition || 'N/A';
    document.getElementById('summarySize').textContent = product.size || 'N/A';
    document.getElementById('summaryPrice').textContent = formatCurrency(product.price);
    document.getElementById('summaryImage').src = product.image_url || product.image || 'https://via.placeholder.com/400';
    document.getElementById('lightboxImg').src = product.image_url || product.image || 'https://via.placeholder.com/400';
    
    // Style the condition badge
    const badge = document.getElementById('summaryCondition');
    const condition = (product.condition || '').toLowerCase();
    if (condition.includes('new')) {
        badge.style.background = '#d1fae5';
        badge.style.color = '#065f46';
    } else if (condition.includes('good')) {
        badge.style.background = '#dbeafe';
        badge.style.color = '#1e40af';
    } else if (condition.includes('fair')) {
        badge.style.background = '#fef3c7';
        badge.style.color = '#92400e';
    }
}

// Prefill user data if logged in
async function prefillUserData() {
    try {
        const user = AuthService.getUser();
        
        if (user && user.email) {
            document.getElementById('email').value = user.email;
        }
        
        // Try to load profile data
        const response = await fetch(`${API_URL}/dashboard/profile`, {
            headers: AuthService.getHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            const profile = data.data || data;
            
            if (profile.full_name) {
                const names = profile.full_name.split(' ');
                document.getElementById('firstName').value = names[0] || '';
                document.getElementById('lastName').value = names.slice(1).join(' ') || '';
            }
            
            if (profile.phone) {
                // Remove +880 prefix if present
                const phone = profile.phone.replace('+880', '').replace(/^880/, '');
                document.getElementById('phone').value = phone;
            }
            
            if (profile.location) {
                // Try to parse location into address fields
                document.getElementById('address').value = profile.location;
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Calculate Totals
function calculateTotals() {
    if (!product) return;
    
    let subtotal = parseFloat(product.price);
    let shipping = parseFloat(product.shipping || 120);
    let discountAmount = 0;

    // Apply discount logic
    if (discountCode === 'FREESHIP') {
        discountAmount = shipping;
        shipping = 0;
    } else if (discount > 0) {
        discountAmount = subtotal * discount;
    }

    let total = subtotal + shipping - discountAmount;

    // Render
    document.getElementById('costSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('costShipping').textContent = formatCurrency(product.shipping);
    
    // Discount Row
    const discountRow = document.getElementById('discountRow');
    if (discountAmount > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('costDiscount').textContent = formatCurrency(discountAmount);
        document.getElementById('discountCodeName').textContent = `(${discountCode})`;
        
        // Strikethrough shipping if free
        if (discountCode === 'FREESHIP') {
            document.getElementById('costShipping').innerHTML = `<span style="text-decoration: line-through; color: #9ca3af;">${formatCurrency(product.shipping)}</span> <span style="color: #10b981; font-weight: 600;">Free</span>`;
        }
    } else {
        discountRow.style.display = 'none';
    }

    document.getElementById('costTotal').textContent = formatCurrency(total);
    document.getElementById('mobileTotalBtn').textContent = formatCurrency(total);
    
    // Store for later use
    product.calculatedTotal = total;
    product.calculatedShipping = shipping;
    product.calculatedDiscount = discountAmount;
}

// Format Currency
function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Event Listeners
function setupEventListeners() {
    // Promo Code
    document.getElementById('applyPromoBtn').addEventListener('click', handlePromoCode);
    
    // Image Lightbox
    const imgWrapper = document.getElementById('productImgWrapper');
    const lightbox = document.getElementById('imageLightbox');
    const closeBtn = document.querySelector('.lightbox-close');

    imgWrapper.addEventListener('click', () => {
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // Form Submission
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
}

// Handle Promo Code
function handlePromoCode() {
    const input = document.getElementById('promoCode');
    const msg = document.getElementById('promoMessage');
    const code = input.value.trim().toUpperCase();

    msg.className = 'promo-message';

    if (PROMO_CODES.hasOwnProperty(code)) {
        discount = PROMO_CODES[code] === 'shipping' ? 0 : PROMO_CODES[code];
        discountCode = code;
        
        msg.textContent = "✅ Promo code applied successfully!";
        msg.classList.add('success');
        
        calculateTotals();
    } else {
        msg.textContent = "❌ Invalid promo code.";
        msg.classList.add('error');
        
        discount = 0;
        discountCode = "";
        calculateTotals();
    }
}

// Handle Checkout Submission
async function handleCheckout(e) {
    e.preventDefault();
    
    if (!checkAuth()) return;
    
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('btnSpinner');
    const button = document.querySelector('.btn-checkout-desktop');
    const mobileBtn = document.querySelector('.btn-checkout-mobile');

    // Loading State
    btnText.style.display = 'none';
    spinner.style.display = 'block';
    button.disabled = true;
    mobileBtn.disabled = true;
    mobileBtn.textContent = 'Processing...';

    try {
        // Collect form data
        const orderData = {
            // Product info
            product_id: product.id,
            product_name: product.name,
            product_price: parseFloat(product.price),
            product_image: product.image_url || product.image,
            
            // Customer info
            email: document.getElementById('email').value,
            first_name: document.getElementById('firstName').value,
            last_name: document.getElementById('lastName').value,
            
            // Shipping address
            address: document.getElementById('address').value,
            apartment: document.getElementById('apartment').value || null,
            city: document.getElementById('city').value,
            postal_code: document.getElementById('postalCode').value,
            phone: '+880' + document.getElementById('phone').value,
            
            // Payment
            payment_method: document.querySelector('input[name="payment"]:checked').value,
            
            // Pricing
            subtotal: parseFloat(product.price),
            shipping_cost: parseFloat(product.calculatedShipping || product.shipping),
            discount_amount: parseFloat(product.calculatedDiscount || 0),
            discount_code: discountCode || null,
            total_amount: parseFloat(product.calculatedTotal),
            
            // Additional
            newsletter: document.getElementById('newsletter').checked,
            status: 'pending'
        };
        
        console.log('=== CREATING ORDER ===');
        console.log('Order data:', orderData);
        
        // Create order via API
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: AuthService.getHeaders(),
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create order');
        }
        
        console.log('Order created:', data);
        
        // Generate order number
        orderNumber = data.data?.order_number || `RV-${Date.now().toString().slice(-6)}`;
        
        // Clear cart
        const updatedCart = cart.filter(item => item.id !== product.id);
        localStorage.setItem('revogueCart', JSON.stringify(updatedCart));
        
        // Show success modal
        showSuccessModal();
        
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification(error.message || 'Failed to place order. Please try again.', 'error');
        
        // Reset button state
        btnText.style.display = 'block';
        spinner.style.display = 'none';
        button.disabled = false;
        mobileBtn.disabled = false;
        mobileBtn.textContent = `Pay BDT ${formatCurrency(product.calculatedTotal)}`;
    }
}

// Show Success Modal
function showSuccessModal() {
    const successModal = document.getElementById('successModal');
    const orderNumberElement = successModal.querySelector('p');
    
    // Update order number in message
    if (orderNumberElement) {
        orderNumberElement.innerHTML = `Thank you for giving this item a second life. Your order <strong>#${orderNumber}</strong> is being processed.`;
    }
    
    successModal.classList.add('active');
    
    // Optional: Confetti effect
    if (typeof confetti !== 'undefined') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
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
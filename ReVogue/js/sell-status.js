// BLOCK SELLING FOR PENDING/SUSPENDED USERS
// Add this to your product listing/creation page

// Example 1: Product Listing Page
// File: /ReVogue/Pages/sell.html or create-listing.html

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    console.log('User can_sell status:', user.can_sell);
    console.log('User status:', user.status);
    
    // Check if user can sell
    if (!user || !user.can_sell) {
        // Show warning banner
        const warningBanner = document.createElement('div');
        warningBanner.style.cssText = `
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border: 2px solid #f59e0b;
            padding: 1.5rem;
            border-radius: 12px;
            margin: 1rem auto;
            max-width: 600px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        
        if (user.status === 'pending') {
            warningBanner.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
                <h2 style="color: #92400e; margin-bottom: 0.5rem;">Verification Pending</h2>
                <p style="color: #78350f; margin-bottom: 1rem;">
                    Your account is pending verification. Please submit your documents to start selling.
                </p>
                <a href="/ReVogue/Pages/settings.html#verification" 
                   style="display: inline-block; background: #f59e0b; color: white; padding: 0.75rem 1.5rem; 
                          border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Submit Verification Documents
                </a>
            `;
        } else if (user.status === 'suspended') {
            warningBanner.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 1rem;">🚫</div>
                <h2 style="color: #92400e; margin-bottom: 0.5rem;">Selling Suspended</h2>
                <p style="color: #78350f; margin-bottom: 1rem;">
                    Your selling privileges have been suspended. You can still browse and buy products.
                </p>
                <p style="color: #78350f; font-size: 0.9rem;">
                    Contact support for more information.
                </p>
            `;
        } else {
            warningBanner.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <h2 style="color: #92400e; margin-bottom: 0.5rem;">Cannot Sell</h2>
                <p style="color: #78350f;">
                    You are not authorized to sell products at this time.
                </p>
            `;
        }
        
        // Insert banner at the top of the page
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(warningBanner, container.firstChild);
        
        // Disable the product form
        const productForm = document.getElementById('productForm') || document.querySelector('form');
        if (productForm) {
            productForm.style.pointerEvents = 'none';
            productForm.style.opacity = '0.5';
            productForm.style.filter = 'blur(2px)';
        }
        
        // Disable submit button
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Selling Disabled';
        }
    }
});

// Example 2: Sell Button in Navigation/Dashboard
// Add this check before allowing user to navigate to selling page

function navigateToSellPage() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user.can_sell) {
        if (user.status === 'pending') {
            if (confirm('You need to verify your account to sell. Go to settings?')) {
                window.location.href = '/ReVogue/Pages/settings.html#verification';
            }
        } else if (user.status === 'suspended') {
            alert('Your selling privileges are currently suspended. Contact support for assistance.');
        } else {
            alert('You are not authorized to sell products.');
        }
        return;
    }
    
    // User can sell - proceed to selling page
    window.location.href = '/ReVogue/Pages/sell.html';
}

// Example 3: Check on Dashboard Load
// Show selling status indicator

function showSellingStatus() {
    const user = JSON.parse(localStorage.getItem('user'));
    const statusIndicator = document.getElementById('sellingStatus');
    
    if (!statusIndicator) return;
    
    if (user.can_sell) {
        statusIndicator.innerHTML = `
            <span style="color: #10b981; font-weight: 600;">
                ✓ Verified Seller
            </span>
        `;
    } else if (user.status === 'pending') {
        statusIndicator.innerHTML = `
            <span style="color: #f59e0b; font-weight: 600;">
                ⏳ Verification Pending
            </span>
            <a href="/ReVogue/Pages/settings.html#verification" style="margin-left: 0.5rem; color: #3b82f6;">
                Submit Documents
            </a>
        `;
    } else if (user.status === 'suspended') {
        statusIndicator.innerHTML = `
            <span style="color: #ef4444; font-weight: 600;">
                🚫 Selling Suspended
            </span>
        `;
    }
}

// Example 4: Product Form Submission Check
// Add this to your product creation form

document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Final check before submission
    if (!user.can_sell) {
        alert('You cannot sell products. Please verify your account first.');
        return;
    }
    
    // Proceed with product creation
    // ... your existing code
});

// Example 5: Hide/Show Selling Features Based on can_sell

function updateUIBasedOnSellingStatus() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Hide "Sell" buttons if user can't sell
    if (!user.can_sell) {
        document.querySelectorAll('.sell-button, .list-product-btn').forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Show verification badge instead
        const badge = document.createElement('div');
        badge.className = 'verification-badge';
        badge.innerHTML = user.status === 'pending' 
            ? '⏳ Verify Account to Sell' 
            : '🚫 Selling Disabled';
        badge.style.cssText = `
            background: ${user.status === 'pending' ? '#fef3c7' : '#fee2e2'};
            color: ${user.status === 'pending' ? '#92400e' : '#991b1b'};
            padding: 0.5rem 1rem;
            border-radius: 8px;
            display: inline-block;
            font-weight: 600;
        `;
        
        document.querySelector('.sell-section')?.prepend(badge);
    }
}

// Example 6: API Request with Error Handling

async function createProduct(productData) {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Client-side check
    if (!user.can_sell) {
        throw new Error('You are not authorized to sell products');
    }
    
    // Make API request
    const response = await fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(productData)
    });
    
    const data = await response.json();
    
    // Handle backend rejection (double check)
    if (!response.ok) {
        if (data.error === 'Cannot sell while pending/suspended') {
            alert('Your account is not authorized to sell products.');
            window.location.href = '/ReVogue/Pages/settings.html';
        }
        throw new Error(data.error);
    }
    
    return data;
}

// Call these on page load
document.addEventListener('DOMContentLoaded', () => {
    showSellingStatus();
    updateUIBasedOnSellingStatus();
});
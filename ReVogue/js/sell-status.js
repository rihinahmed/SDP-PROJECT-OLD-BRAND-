// REDESIGNED SELL STATUS CHECKER - COOL THEME MATCHED DESIGN
// Matches purple-pink gradient theme with smooth animations

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    console.log('User can_sell status:', user?.can_sell);
    console.log('User status:', user?.status);
    
    // Only show if user cannot sell
    if (user && !user.can_sell) {
        showSellingStatusNotification(user);
    }
});

function showSellingStatusNotification(user) {
    // Create floating status card
    const statusCard = document.createElement('div');
    statusCard.id = 'sellingStatusCard';
    statusCard.className = 'selling-status-card';
    
    let content = '';
    let statusColor = '';
    let statusGradient = '';
    let icon = '';
    let actionButton = '';
    
    if (user.status === 'pending') {
        statusColor = '#f59e0b';
        statusGradient = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
        icon = `
            <div class="status-icon-circle pending-pulse">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            </div>
        `;
        actionButton = `
            <a href="/ReVogue/Pages/settings.html#verification" class="status-action-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Verify Now
            </a>
        `;
        content = `
            <h4 class="status-title">Verification Pending</h4>
            <p class="status-description">Complete your verification to start selling on ReVogue</p>
        `;
    } else if (user.status === 'suspended') {
        statusColor = '#ef4444';
        statusGradient = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
        icon = `
            <div class="status-icon-circle suspended-shake">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            </div>
        `;
        actionButton = `
            <button class="status-action-btn secondary" onclick="window.location.href='mailto:support@revogue.com'">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Contact Support
            </button>
        `;
        content = `
            <h4 class="status-title">Selling Suspended</h4>
            <p class="status-description">Your selling privileges are temporarily suspended. Contact support for assistance.</p>
        `;
    } else {
        statusColor = '#6b7280';
        statusGradient = 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
        icon = `
            <div class="status-icon-circle">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            </div>
        `;
        content = `
            <h4 class="status-title">Cannot Sell</h4>
            <p class="status-description">You are not authorized to sell products at this time.</p>
        `;
    }
    
    statusCard.innerHTML = `
        <div class="status-card-content">
            ${icon}
            <div class="status-text">
                ${content}
            </div>
            <button class="status-close-btn" onclick="document.getElementById('sellingStatusCard').remove()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        ${actionButton ? `<div class="status-actions">${actionButton}</div>` : ''}
    `;
    
    // Append to body
    document.body.appendChild(statusCard);
    
    // Add styles
    injectSellingStatusStyles();
    
    // Disable selling features
    disableSellingFeatures();
}

function injectSellingStatusStyles() {
    if (document.getElementById('sellingStatusStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'sellingStatusStyles';
    styles.textContent = `
        .selling-status-card {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            max-width: 400px;
            background: white;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #e9d5ff;
            z-index: 999;
            overflow: hidden;
            animation: slideInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(100px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .status-card-content {
            padding: 1.5rem;
            position: relative;
            background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%);
            display: flex;
            gap: 1rem;
            align-items: flex-start;
        }
        
        .status-icon-circle {
            width: 3rem;
            height: 3rem;
            border-radius: 9999px;
            background: linear-gradient(135deg, #a855f7, #ec4899);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 4px 6px rgba(168, 85, 247, 0.3);
        }
        
        .pending-pulse {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);
            }
            50% {
                transform: scale(1.05);
                box-shadow: 0 6px 12px rgba(245, 158, 11, 0.5);
            }
        }
        
        .suspended-shake {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            animation: shake 0.5s;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        .status-text {
            flex: 1;
        }
        
        .status-title {
            font-size: 1.125rem;
            font-weight: 700;
            background: linear-gradient(to right, #9333ea, #db2777);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 0 0 0.5rem 0;
        }
        
        .status-description {
            font-size: 0.875rem;
            color: #6b7280;
            margin: 0;
            line-height: 1.5;
        }
        
        .status-close-btn {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            width: 2rem;
            height: 2rem;
            border-radius: 9999px;
            background: rgba(255, 255, 255, 0.8);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            transition: all 0.3s;
        }
        
        .status-close-btn:hover {
            background: white;
            color: #374151;
            transform: rotate(90deg);
        }
        
        .status-actions {
            padding: 1rem 1.5rem;
            background: white;
            border-top: 1px solid #e9d5ff;
        }
        
        .status-action-btn {
            width: 100%;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(to right, #a855f7, #ec4899);
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            text-decoration: none;
            transition: all 0.3s;
        }
        
        .status-action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(168, 85, 247, 0.3);
        }
        
        .status-action-btn:active {
            transform: translateY(0);
        }
        
        .status-action-btn.secondary {
            background: white;
            color: #9333ea;
            border: 2px solid #e9d5ff;
        }
        
        .status-action-btn.secondary:hover {
            background: #faf5ff;
            border-color: #d8b4fe;
        }
        
        /* Disabled Form Overlay */
        .form-disabled-overlay {
            position: relative;
        }
        
        .form-disabled-overlay::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(236, 72, 153, 0.05));
            backdrop-filter: blur(2px);
            border-radius: 1rem;
            pointer-events: none;
            z-index: 10;
        }
        
        /* Badge for Disabled Buttons */
        .sell-btn-disabled-badge {
            position: relative;
            display: inline-block;
        }
        
        .sell-btn-disabled-badge::before {
            content: '🔒';
            position: absolute;
            top: -8px;
            right: -8px;
            font-size: 1.25rem;
            animation: bounce 1s infinite;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        
        /* Responsive */
        @media (max-width: 640px) {
            .selling-status-card {
                bottom: 1rem;
                right: 1rem;
                left: 1rem;
                max-width: none;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

function disableSellingFeatures() {
    // Disable product forms with smooth overlay
    const productForms = document.querySelectorAll('#productForm, #sellForm, form[data-type="product"]');
    productForms.forEach(form => {
        form.classList.add('form-disabled-overlay');
        form.style.pointerEvents = 'none';
        form.style.position = 'relative';
        
        // Disable all inputs
        form.querySelectorAll('input, textarea, select, button').forEach(input => {
            input.disabled = true;
        });
    });
    
    // Update submit buttons with better styling
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(btn => {
        if (btn.closest('form')) {
            btn.disabled = true;
            btn.style.background = 'linear-gradient(to right, #d1d5db, #9ca3af)';
            btn.style.cursor = 'not-allowed';
            btn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Selling Disabled
            `;
        }
    });
    
    // Add badges to sell buttons
    document.querySelectorAll('.sell-button, .list-product-btn, #sellBtn').forEach(btn => {
        if (!btn.classList.contains('sell-btn-disabled-badge')) {
            btn.classList.add('sell-btn-disabled-badge');
            btn.style.opacity = '0.6';
            btn.style.pointerEvents = 'none';
            btn.title = 'Verify your account to sell';
        }
    });
}

// Navigation Guard for Sell Pages
function navigateToSellPage() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || !user.can_sell) {
        if (user?.status === 'pending') {
            showStylishConfirmation(
                'Account Verification Required',
                'You need to verify your account to start selling. Would you like to go to settings?',
                () => {
                    window.location.href = '/ReVogue/Pages/settings.html#verification';
                }
            );
        } else if (user?.status === 'suspended') {
            showStylishAlert(
                'Selling Suspended',
                'Your selling privileges are currently suspended. Please contact support for assistance.',
                'warning'
            );
        } else {
            showStylishAlert(
                'Cannot Sell',
                'You are not authorized to sell products at this time.',
                'error'
            );
        }
        return false;
    }
    
    window.location.href = '/ReVogue/Pages/sell.html';
    return true;
}

// Stylish Alert Function
function showStylishAlert(title, message, type = 'info') {
    const alertModal = document.createElement('div');
    alertModal.className = 'stylish-alert-modal';
    alertModal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;
    
    const icons = {
        warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
        error: '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>',
        info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'
    };
    
    alertModal.innerHTML = `
        <div style="
            background: white;
            border-radius: 1rem;
            padding: 2rem;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            text-align: center;
            animation: scaleUp 0.3s ease;
        ">
            <div style="
                width: 4rem;
                height: 4rem;
                border-radius: 9999px;
                background: linear-gradient(135deg, #a855f7, #ec4899);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;
            ">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${icons[type]}
                </svg>
            </div>
            <h3 style="
                font-size: 1.5rem;
                font-weight: 700;
                background: linear-gradient(to right, #9333ea, #db2777);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin: 0 0 1rem 0;
            ">${title}</h3>
            <p style="color: #6b7280; margin: 0 0 1.5rem 0; line-height: 1.6;">${message}</p>
            <button onclick="this.closest('.stylish-alert-modal').remove()" style="
                width: 100%;
                padding: 0.75rem 1.5rem;
                background: linear-gradient(to right, #a855f7, #ec4899);
                color: white;
                border: none;
                border-radius: 0.5rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s;
            ">Got it</button>
        </div>
    `;
    
    document.body.appendChild(alertModal);
    
    alertModal.addEventListener('click', (e) => {
        if (e.target === alertModal) alertModal.remove();
    });
}

// Stylish Confirmation Function
function showStylishConfirmation(title, message, onConfirm) {
    const confirmModal = document.createElement('div');
    confirmModal.className = 'stylish-confirm-modal';
    confirmModal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;
    
    confirmModal.innerHTML = `
        <div style="
            background: white;
            border-radius: 1rem;
            padding: 2rem;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            text-align: center;
            animation: scaleUp 0.3s ease;
        ">
            <div style="
                width: 4rem;
                height: 4rem;
                border-radius: 9999px;
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;
            ">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            </div>
            <h3 style="
                font-size: 1.5rem;
                font-weight: 700;
                background: linear-gradient(to right, #9333ea, #db2777);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin: 0 0 1rem 0;
            ">${title}</h3>
            <p style="color: #6b7280; margin: 0 0 1.5rem 0; line-height: 1.6;">${message}</p>
            <div style="display: flex; gap: 0.75rem;">
                <button onclick="this.closest('.stylish-confirm-modal').remove()" style="
                    flex: 1;
                    padding: 0.75rem 1.5rem;
                    background: white;
                    color: #9333ea;
                    border: 2px solid #e9d5ff;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                ">Cancel</button>
                <button class="confirm-yes-btn" style="
                    flex: 1;
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(to right, #a855f7, #ec4899);
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                ">Yes, Go to Settings</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmModal);
    
    confirmModal.querySelector('.confirm-yes-btn').addEventListener('click', () => {
        confirmModal.remove();
        onConfirm();
    });
    
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) confirmModal.remove();
    });
}

// Add animation keyframes
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes scaleUp {
        from {
            opacity: 0;
            transform: scale(0.9);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`;
document.head.appendChild(animationStyles);

// Export for use in other files
window.navigateToSellPage = navigateToSellPage;
window.showStylishAlert = showStylishAlert;
window.showStylishConfirmation = showStylishConfirmation;

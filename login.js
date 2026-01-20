// /ReVogue/js/login.js - Complete Supabase Integration
const API_URL = 'http://localhost:3000/api';

// Auth Service
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
    
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },
    
    removeUser() {
        localStorage.removeItem('user');
    },
    
    isAuthenticated() {
        return !!this.getToken();
    },

    logout() {
        this.removeToken();
        this.removeUser();
        localStorage.removeItem('revogueUser');
        sessionStorage.removeItem('revogueUser');
    }
};

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Tab Switching
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const tabIndicator = document.getElementById('tabIndicator');
const successMessage = document.getElementById('successMessage');

loginTab.addEventListener('click', () => {
    switchToLogin();
});

signupTab.addEventListener('click', () => {
    switchToSignup();
});

function switchToLogin() {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    tabIndicator.classList.remove('signup');
}

function switchToSignup() {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
    tabIndicator.classList.add('signup');
}

// Toggle Password Visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
}

// Login Form Submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Show loading state
    const submitBtn = e.target.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Logging in...</span>';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        console.log('Login successful:', data);

        // Store token and user data
        AuthService.setToken(data.session.access_token);
        AuthService.setUser(data.user);

        // Also store profile and session info
        const user = {
            email: data.user.email,
            id: data.user.id,
            profile: data.profile,
            loggedIn: true,
            timestamp: new Date().toISOString()
        };

        if (rememberMe) {
            localStorage.setItem('revogueUser', JSON.stringify(user));
        } else {
            sessionStorage.setItem('revogueUser', JSON.stringify(user));
        }

        showNotification('Login successful! Redirecting to dashboard...', 'success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Login failed. Please check your credentials.', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Signup Form Submission
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById('signupFirstName').value;
    const lastName = document.getElementById('signupLastName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validation
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }
    
    if (password.length < 8) {
        showNotification('Password must be at least 8 characters long!', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showNotification('Please agree to the Terms of Service and Privacy Policy!', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Creating account...</span>';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                username: email.split('@')[0] + Math.random().toString(36).substring(7), // Generate unique username
                fullName: `${firstName} ${lastName}`
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        console.log('Registration successful:', data);
        showNotification('Account created successfully!', 'success');

        // Hide forms and show success message
        loginForm.classList.remove('active');
        signupForm.classList.remove('active');
        successMessage.classList.add('active');

        // Auto-login after successful registration
        setTimeout(async () => {
            try {
                const loginResponse = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const loginData = await loginResponse.json();

                if (loginResponse.ok) {
                    AuthService.setToken(loginData.session.access_token);
                    AuthService.setUser(loginData.user);
                    
                    const user = {
                        email: loginData.user.email,
                        id: loginData.user.id,
                        profile: loginData.profile,
                        firstName,
                        lastName,
                        loggedIn: true,
                        timestamp: new Date().toISOString()
                    };
                    
                    localStorage.setItem('revogueUser', JSON.stringify(user));
                    
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    // If auto-login fails, redirect to login page
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error('Auto-login error:', error);
                // Redirect to login page if auto-login fails
                window.location.href = 'login.html';
            }
        }, 2000);

    } catch (error) {
        console.error('Signup error:', error);
        showNotification(error.message || 'Registration failed. Please try again.', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Forgot Password Handler
document.querySelector('.forgot-password')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'forgot-password.html';
});

// Social Login Handlers
document.querySelectorAll('.google-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showNotification('Google Sign-In coming soon!', 'info');
    });
});

document.querySelectorAll('.facebook-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showNotification('Facebook Sign-In coming soon!', 'info');
    });
});

// Real-time Password Validation
document.getElementById('signupPassword')?.addEventListener('input', (e) => {
    const password = e.target.value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (password.length > 0 && password.length < 8) {
        e.target.classList.add('error');
        e.target.classList.remove('success');
    } else if (password.length >= 8) {
        e.target.classList.add('success');
        e.target.classList.remove('error');
    } else {
        e.target.classList.remove('error', 'success');
    }
    
    // Check if passwords match
    if (confirmPassword && confirmPassword !== password) {
        document.getElementById('signupConfirmPassword').classList.add('error');
        document.getElementById('signupConfirmPassword').classList.remove('success');
    } else if (confirmPassword && confirmPassword === password) {
        document.getElementById('signupConfirmPassword').classList.add('success');
        document.getElementById('signupConfirmPassword').classList.remove('error');
    }
});

document.getElementById('signupConfirmPassword')?.addEventListener('input', (e) => {
    const confirmPassword = e.target.value;
    const password = document.getElementById('signupPassword').value;
    
    if (confirmPassword !== password) {
        e.target.classList.add('error');
        e.target.classList.remove('success');
    } else if (confirmPassword === password && confirmPassword.length >= 8) {
        e.target.classList.add('success');
        e.target.classList.remove('error');
    } else {
        e.target.classList.remove('error', 'success');
    }
});

// Email Validation
document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('blur', (e) => {
        const email = e.target.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            e.target.classList.add('error');
            e.target.classList.remove('success');
        } else if (email && emailRegex.test(email)) {
            e.target.classList.add('success');
            e.target.classList.remove('error');
        } else {
            e.target.classList.remove('error', 'success');
        }
    });
});

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    if (AuthService.isAuthenticated()) {
        const user = AuthService.getUser();
        console.log('User already logged in:', user.email);
        
        // Redirect to dashboard if already logged in
        showNotification('You are already logged in. Redirecting...', 'info');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }
});

// Add floating label effect
document.querySelectorAll('.form-group input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
});

// Add CSS for notifications
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
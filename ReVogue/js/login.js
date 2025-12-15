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
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Show loading state
    const submitBtn = e.target.querySelector('.btn-submit');
    submitBtn.classList.add('loading');
    
    // Simulate API call
    setTimeout(() => {
        submitBtn.classList.remove('loading');
        
        // Store user session (for demo purposes)
        const user = {
            email: email,
            loggedIn: true,
            timestamp: new Date().toISOString()
        };
        
        if (rememberMe) {
            localStorage.setItem('revogueUser', JSON.stringify(user));
        } else {
            sessionStorage.setItem('revogueUser', JSON.stringify(user));
        }
        
        // Show success and redirect
        alert('Login successful! Welcome back to ReVogue.');
        window.location.href = 'index.html';
    }, 1500);
});

// Signup Form Submission
document.getElementById('signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById('signupFirstName').value;
    const lastName = document.getElementById('signupLastName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validation
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    if (password.length < 8) {
        alert('Password must be at least 8 characters long!');
        return;
    }
    
    if (!agreeTerms) {
        alert('Please agree to the Terms of Service and Privacy Policy!');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('.btn-submit');
    submitBtn.classList.add('loading');
    
    // Simulate API call
    setTimeout(() => {
        submitBtn.classList.remove('loading');
        
        // Store new user (for demo purposes)
        const user = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            loggedIn: true,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('revogueUser', JSON.stringify(user));
        
        // Hide forms and show success message
        loginForm.classList.remove('active');
        signupForm.classList.remove('active');
        successMessage.classList.add('active');
        
        // Redirect after 3 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    }, 1500);
});

// Social Login Handlers
document.querySelectorAll('.google-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        alert('Google Sign-In coming soon! This will integrate with Google OAuth.');
    });
});

document.querySelectorAll('.facebook-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        alert('Facebook Sign-In coming soon! This will integrate with Facebook Login.');
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
    const user = localStorage.getItem('revogueUser') || sessionStorage.getItem('revogueUser');
    
    if (user) {
        const userData = JSON.parse(user);
        if (userData.loggedIn) {
            // User is already logged in, could redirect or show a message
            console.log('User already logged in:', userData.email);
        }
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

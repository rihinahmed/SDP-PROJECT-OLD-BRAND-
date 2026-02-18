// /ReVogue/js/admin-login.js - DYNAMIC VERSION WITH BACKEND
const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in as admin
    checkExistingAuth();
    
    // Initialize all animations
    initParticles();
    initCursorTrail();
    init3DCardTilt();
    initMagneticButton();
    initFormHandling();
});

// Check if user is already authenticated as admin
function checkExistingAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        try {
            const userData = JSON.parse(user);
            if (userData.role === 'admin') {
                // Already logged in as admin, redirect to dashboard
                window.location.href = '/ReVogue/Pages/admin.html';
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
}

// ========================
// PARTICLE BACKGROUND WITH MOUSE INTERACTION
// ========================
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    const mouse = { x: 0, y: 0 };
    const particles = [];
    const particleCount = 80;

    // Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
        }

        update() {
            // Mouse interaction
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 150;

            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                this.vx -= (dx / distance) * force * 0.2;
                this.vy -= (dy / distance) * force * 0.2;
            }

            // Update position
            this.x += this.vx;
            this.y += this.vy;

            // Apply friction
            this.vx *= 0.99;
            this.vy *= 0.99;

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            // Keep in bounds
            this.x = Math.max(0, Math.min(width, this.x));
            this.y = Math.max(0, Math.min(height, this.y));
        }

        draw() {
            ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Track mouse position
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    // Handle resize
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * (1 - dist / 120)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}

// ========================
// CURSOR TRAIL EFFECT
// ========================
function initCursorTrail() {
    const canvas = document.getElementById('cursorTrail');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const trail = [];
    const maxTrailLength = 20;

    window.addEventListener('mousemove', (e) => {
        trail.push({
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now()
        });

        if (trail.length > maxTrailLength) {
            trail.shift();
        }
    });

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const now = Date.now();
        
        // Remove old trail points
        for (let i = trail.length - 1; i >= 0; i--) {
            if (now - trail[i].timestamp > 500) {
                trail.splice(i, 1);
            }
        }

        // Draw trail
        trail.forEach((point, index) => {
            const age = now - point.timestamp;
            const opacity = 1 - (age / 500);
            const size = 8 * opacity;

            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(236, 72, 153, ${opacity * 0.3})`;
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }

    animate();
}

// ========================
// 3D CARD TILT EFFECT
// ========================
function init3DCardTilt() {
    const card = document.getElementById('glassCard');
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        mouseX = ((e.clientX - centerX) / rect.width) * 10;
        mouseY = ((e.clientY - centerY) / rect.height) * -10;
    });

    card.addEventListener('mouseleave', () => {
        mouseX = 0;
        mouseY = 0;
    });

    function animate() {
        // Smooth interpolation
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;

        card.style.transform = `perspective(1000px) rotateX(${currentY}deg) rotateY(${currentX}deg)`;

        requestAnimationFrame(animate);
    }

    animate();
}

// ========================
// MAGNETIC BUTTON EFFECT
// ========================
function initMagneticButton() {
    const button = document.getElementById('loginBtn');
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    button.addEventListener('mousemove', (e) => {
        const rect = button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        mouseX = (e.clientX - centerX) * 0.3;
        mouseY = (e.clientY - centerY) * 0.3;
    });

    button.addEventListener('mouseleave', () => {
        mouseX = 0;
        mouseY = 0;
    });

    // Ripple effect on click
    button.addEventListener('click', (e) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = '10px';
        ripple.style.height = '10px';

        const rippleContainer = button.querySelector('.ripple-container');
        rippleContainer.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });

    function animate() {
        // Smooth interpolation
        currentX += (mouseX - currentX) * 0.15;
        currentY += (mouseY - currentY) * 0.15;

        button.style.transform = `translate(${currentX}px, ${currentY}px)`;

        requestAnimationFrame(animate);
    }

    animate();
}

// ========================
// FORM HANDLING - DYNAMIC WITH API
// ========================
function initFormHandling() {
    const form = document.getElementById('adminForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const errorBanner = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const loginBtn = document.getElementById('loginBtn');

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = togglePassword.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Form submission - DYNAMIC VERSION
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        console.log('=== ADMIN LOGIN ATTEMPT ===');
        
        // Hide error
        errorBanner.classList.remove('show');
        
        // Show loading state
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        try {
            console.log('Attempting login for:', email);
            
            // Call login API
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok && data.success) {
                console.log('=== LOGIN SUCCESS ===');
                console.log('Full response:', data);
                
                // Get OUR backend's token (NOT Supabase's session token!)
                const token = data.token;  // This is OUR JWT token
                const profileData = data.profile;  // This has the role
                
                console.log('Token (first 30 chars):', token ? token.substring(0, 30) + '...' : 'MISSING');
                console.log('Profile data:', profileData);
                console.log('Profile role:', profileData?.role);
                
                // Check if user has admin role
                if (profileData && profileData.role === 'admin') {
                    console.log('✅ Admin login successful!');
                    
                    // Store OUR token (not Supabase's!)
                    localStorage.setItem('authToken', token);
                    localStorage.setItem('user', JSON.stringify(profileData));
                    
                    // Verify what was stored
                    console.log('Stored token:', localStorage.getItem('authToken').substring(0, 30) + '...');
                    console.log('Stored user:', JSON.parse(localStorage.getItem('user')));
                    
                    // Show success animation
                    loginBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                    showSuccessNotification('Welcome back, Admin!');
                    
                    // Redirect to admin dashboard
                    setTimeout(() => {
                        window.location.href = '/ReVogue/Pages/admin.html';
                    }, 1000);
                    
                } else {
                    console.log('❌ Access denied: Not an admin');
                    console.log('Full profile object:', profileData);
                    console.log('Profile keys:', profileData ? Object.keys(profileData) : 'null');
                    console.log('Received role:', profileData?.role);
                    throw new Error('Access denied: Admin privileges required');
                }
            } else {
                throw new Error(data.error || 'Invalid credentials');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Show error
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            
            errorText.textContent = error.message || 'Invalid credentials. Please try again.';
            errorBanner.classList.add('show');
            
            // Shake animation
            errorBanner.style.animation = 'none';
            errorBanner.offsetHeight; // Trigger reflow
            errorBanner.style.animation = 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both';
            
            // Shake the card too
            const card = document.getElementById('glassCard');
            card.style.animation = 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both';
            setTimeout(() => {
                card.style.animation = '';
            }, 400);
        }
    });

    // Input animations on focus
    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateX(5px)';
        });

        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateX(0)';
        });
    });
}

// Success notification
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    `;
    
    notification.innerHTML = `
        <i class="fa-solid fa-circle-check" style="font-size: 1.25rem;"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Add animations CSS
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
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);
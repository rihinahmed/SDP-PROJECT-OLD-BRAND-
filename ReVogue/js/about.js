// /ReVogue/js/about.js - Dynamic with Supabase
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

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 6rem;
        right: 1rem;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : 'linear-gradient(to right, var(--purple-500), var(--pink-500))'};
        color: white;
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

// Particle Animation
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
const particleCount = 60;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 4 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = Math.random() > 0.5 ? '168, 85, 247' : '236, 72, 153';
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }

    draw() {
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

initParticles();
animateParticles();

// Load Dynamic Stats from API
async function loadDynamicStats() {
    try {
        // Get total users
        const usersResponse = await fetch(`${API_URL}/products`);
        const products = await usersResponse.json();
        
        // Calculate real stats
        const totalProducts = products.length;
        const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
        const avgPrice = products.reduce((sum, p) => sum + parseFloat(p.price), 0) / totalProducts;
        
        // Estimate CO2 saved (avg 5kg per clothing item)
        const co2Saved = (totalProducts * 5);
        
        return [
            {
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
                value: totalViews > 1000 ? `${Math.floor(totalViews/1000)}K+` : `${totalViews}+`,
                label: 'Total Views'
            },
            {
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
                value: `${totalProducts}+`,
                label: 'Items Available'
            },
            {
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
                value: co2Saved > 1000 ? `${Math.floor(co2Saved/1000)}K+` : `${co2Saved}+`,
                label: 'CO2 Saved (kg)'
            },
            {
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
                value: '95%',
                label: 'Satisfaction Rate'
            }
        ];
    } catch (error) {
        console.error('Error loading stats:', error);
        // Return default stats if API fails
        return [
            {
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
                value: '50K+',
                label: 'Happy Customers'
            },
            {
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
                value: '100K+',
                label: 'Items Sold'
            },
            {
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
                value: '2M+',
                label: 'CO2 Saved (kg)'
            },
            {
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
                value: '95%',
                label: 'Satisfaction Rate'
            }
        ];
    }
}

// Values Data
const values = [
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        title: 'Sustainability',
        description: 'Every purchase extends the life of clothing and reduces waste.',
        gradient: 'linear-gradient(135deg, #4ade80 0%, #059669 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
        title: 'Community',
        description: 'Building a community of conscious consumers who care.',
        gradient: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>',
        title: 'Quality',
        description: 'Curated selection of pre-loved items in excellent condition.',
        gradient: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
        title: 'Accessibility',
        description: 'Making sustainable fashion affordable and accessible to all.',
        gradient: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)'
    }
];

// Team Data
const team = [
    { name: 'Sarah Johnson', role: 'Founder & CEO', avatar: '👩‍💼' },
    { name: 'Michael Chen', role: 'Head of Operations', avatar: '👨‍💻' },
    { name: 'Emma Williams', role: 'Community Manager', avatar: '👩‍🎨' },
    { name: 'James Rodriguez', role: 'Sustainability Lead', avatar: '👨‍🔬' }
];

// Render Stats
async function renderStats() {
    const grid = document.getElementById('statsGrid');
    const stats = await loadDynamicStats();
    
    grid.innerHTML = stats.map((stat, index) => `
        <div class="stat-card" style="animation-delay: ${index * 0.1}s">
            <div class="stat-icon">${stat.icon}</div>
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
        </div>
    `).join('');
}

// Render Values
function renderValues() {
    const grid = document.getElementById('valuesGrid');
    grid.innerHTML = values.map((value, index) => `
        <div class="value-card" data-index="${index}">
            <div class="value-icon" style="background: ${value.gradient}">
                ${value.icon}
            </div>
            <h4 class="value-title">${value.title}</h4>
            <p class="value-description">${value.description}</p>
        </div>
    `).join('');

    // Add hover handlers
    document.querySelectorAll('.value-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            document.querySelectorAll('.value-card').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Render Team
function renderTeam() {
    const grid = document.getElementById('teamGrid');
    grid.innerHTML = team.map(member => `
        <div class="team-card">
            <div class="team-avatar">${member.avatar}</div>
            <h4 class="team-name">${member.name}</h4>
            <p class="team-role">${member.role}</p>
            <div class="team-social">
                <button class="social-btn">LinkedIn</button>
                <button class="social-btn">Twitter</button>
            </div>
        </div>
    `).join('');
}

// Intersection Observer for Stats Animation
function observeStats() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.stat-card').forEach(card => {
                    card.classList.add('visible');
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        observer.observe(statsSection);
    }
}

// Animate stat numbers
function animateStatNumbers() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach((card, index) => {
        setTimeout(() => {
            const valueElement = card.querySelector('.stat-value');
            const finalValue = valueElement.textContent;
            
            // Extract number and suffix
            const numMatch = finalValue.match(/(\d+)/);
            const suffix = finalValue.replace(/\d+/, '');
            
            if (numMatch) {
                const targetNum = parseInt(numMatch[0]);
                let currentNum = 0;
                const increment = Math.ceil(targetNum / 30);
                
                const counter = setInterval(() => {
                    currentNum += increment;
                    if (currentNum >= targetNum) {
                        currentNum = targetNum;
                        clearInterval(counter);
                    }
                    valueElement.textContent = currentNum + suffix;
                }, 50);
            }
        }, index * 200);
    });
}

// Intersection Observer for stat number animation
function observeStatsNumbers() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStatNumbers();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) {
        observer.observe(statsGrid);
    }
}

// CTA Button click handler
document.querySelector('.cta-button')?.addEventListener('click', () => {
    if (AuthService.isAuthenticated()) {
        window.location.href = 'shop.html';
    } else {
        window.location.href = 'login.html';
    }
});

// Sell Button Handler
document.getElementById('sellBtn')?.addEventListener('click', () => {
    if (!AuthService.isAuthenticated()) {
        showNotification('Please login to sell items', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    // Redirect to index or show sell modal
    window.location.href = 'index.html';
});

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

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await renderStats();
    renderValues();
    renderTeam();
    observeStats();
    observeStatsNumbers();
    
    // Floating animation enhancement for cards
    document.querySelectorAll('.floating-card').forEach((card, index) => {
        card.style.animationDelay = `${index}s`;
    });
    
    // Update UI based on auth state
    if (AuthService.isAuthenticated()) {
        console.log('User logged in');
    }
});
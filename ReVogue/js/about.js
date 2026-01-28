// /ReVogue/js/about.js
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
    }
};

// Scroll Reveal Logic
class ScrollReveal {
    constructor() {
        this.init();
    }

    init() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        // Elements to animate
        document.querySelectorAll('.scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-bottom, .scroll-reveal-popup, .scroll-reveal-zoom').forEach(el => {
            observer.observe(el);
        });
    }
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
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1.5 - 0.75;
        this.speedY = Math.random() * 1.5 - 0.75;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = Math.random() > 0.5 ? '168, 85, 247' : '236, 72, 153';
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
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

// Data - Stats
// Fallback stats are used immediately to prevent layout shift, then updated if API succeeds
const defaultStats = [
    {
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        value: '150K+',
        label: 'Community Members'
    },
    {
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
        value: '85K+',
        label: 'Treasures Rehomed'
    },
    {
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        value: '450K',
        label: 'kg CO2 Prevented'
    },
    {
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
        value: '4.9/5',
        label: 'Trust Score'
    }
];

// Data - Values
const values = [
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        title: 'Radical Sustainability',
        description: 'We don’t just minimize harm; we actively regenerate. Every sale funds local green initiatives.',
        gradient: 'linear-gradient(135deg, #4ade80 0%, #059669 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
        title: 'Community First',
        description: 'We are powered by you. A collective of rebels, stylists, and changemakers.',
        gradient: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>',
        title: 'Authenticity',
        description: 'No fakes. No fast fashion. Just genuine, high-quality pieces with a story to tell.',
        gradient: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
        title: 'Inclusivity',
        description: 'Style knows no boundaries. We champion fashion for every body, identity, and budget.',
        gradient: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)'
    }
];

// Data - Team
const team = [
    { name: 'Sultan Bin Alam', role: 'FrontEnd Engineer and Concept', avatar: '👨' },
    { name: 'Md. Mahfuz Ahmed Rihin', role: 'Full Stack Developer', avatar: '🧙‍♂️' },
    { name: 'Ajmain Taki', role: 'Business Planner and Database', avatar: '🎨' },
    { name: 'Sadequr Rahman', role: 'Backend Developer', avatar: '🌱' }
];

// Render Functions
function renderStats() {
    const grid = document.getElementById('statsGrid');
    grid.innerHTML = defaultStats.map((stat, index) => `
        <div class="stat-card">
            <div class="stat-icon">${stat.icon}</div>
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
        </div>
    `).join('');
}

function renderValues() {
    const grid = document.getElementById('valuesGrid');
    grid.innerHTML = values.map((value, index) => `
        <div class="value-card scroll-reveal-bottom">
            <div class="value-icon" style="background: ${value.gradient}">
                ${value.icon}
            </div>
            <h4 class="value-title">${value.title}</h4>
            <p class="value-description">${value.description}</p>
        </div>
    `).join('');
}

function renderTeam() {
    const grid = document.getElementById('teamGrid');
    grid.innerHTML = team.map((member, index) => `
        <div class="team-card scroll-reveal-bottom">
            <div class="team-avatar">${member.avatar}</div>
            <h4 class="team-name">${member.name}</h4>
            <p class="team-role">${member.role}</p>
            <div class="team-social">
                <button class="social-btn">LinkedIn</button>
                <button class="social-btn">GitHub</button>
            </div>
        </div>
    `).join('');
}

// Stats Counter Animation
function animateStatNumbers() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach((card, index) => {
        const valueElement = card.querySelector('.stat-value');
        const finalValueStr = valueElement.textContent;
        const numMatch = finalValueStr.match(/(\d+(\.\d+)?)/);
        
        if (numMatch) {
            const finalValue = parseFloat(numMatch[0]);
            const suffix = finalValueStr.replace(numMatch[0], '');
            let startValue = 0;
            const duration = 2000;
            const startTime = performance.now();

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out quart
                const ease = 1 - Math.pow(1 - progress, 4);
                
                const current = startValue + (finalValue - startValue) * ease;
                
                // Format logic: if original had decimal, keep it. If int, keep int.
                const formatted = finalValue % 1 === 0 ? Math.floor(current) : current.toFixed(1);
                
                valueElement.textContent = formatted + suffix;

                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            }
            
            requestAnimationFrame(update);
        }
    });
}

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
    if (statsGrid) observer.observe(statsGrid);
}

// CTA & Sell Buttons
document.querySelector('.cta-button')?.addEventListener('click', () => {
    window.location.href = AuthService.isAuthenticated() ? 'shop.html' : 'login.html';
});

document.getElementById('sellBtn')?.addEventListener('click', () => {
    window.location.href = AuthService.isAuthenticated() ? 'index.html' : 'login.html';
});

// Init
document.addEventListener('DOMContentLoaded', () => {
    renderStats();
    renderValues();
    renderTeam();
    
    // Initialize Scroll Reveal after rendering content
    setTimeout(() => {
        new ScrollReveal();
        observeStatsNumbers();
    }, 100);
});
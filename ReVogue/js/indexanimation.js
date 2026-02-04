// ========================================
// SCROLL REVEAL ANIMATIONS
// ========================================

class ScrollReveal {
    constructor() {
        this.init();
    }

    init() {
        // Add scroll reveal to all elements
        this.setupScrollReveal();
        
        // Add magnetic effect to buttons
        this.addMagneticEffect();
        
        // Add 3D tilt to cards
        this.addCardTiltEffect();
    }

    setupScrollReveal() {
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

        // Product Cards - Alternate animations
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach((card, index) => {
            const animationType = index % 4;
            
            switch(animationType) {
                case 0:
                    card.classList.add('scroll-reveal-left');
                    break;
                case 1:
                    card.classList.add('scroll-reveal-right');
                    break;
                case 2:
                    card.classList.add('scroll-reveal-popup');
                    break;
                case 3:
                    card.classList.add('scroll-reveal-zoom');
                    break;
            }
            
            observer.observe(card);
        });

        // Filter Groups
        const filterGroups = document.querySelectorAll('.filter-group');
        filterGroups.forEach((group) => {
            group.classList.add('scroll-reveal-left');
            observer.observe(group);
        });

        // Category Buttons
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach((btn) => {
            btn.classList.add('scroll-reveal-popup');
            observer.observe(btn);
        });

        // Categories Container
        const categoriesContainer = document.querySelector('.categories-container');
        if (categoriesContainer) {
            categoriesContainer.classList.add('scroll-reveal-bottom');
            observer.observe(categoriesContainer);
        }

        // Filter Sidebar
        const filterSidebar = document.querySelector('.filter-sidebar');
        if (filterSidebar) {
            filterSidebar.classList.add('scroll-reveal-left');
            observer.observe(filterSidebar);
        }

        // No Products Message
        const noProducts = document.getElementById('noProducts');
        if (noProducts) {
            noProducts.classList.add('scroll-reveal-popup');
            observer.observe(noProducts);
        }
    }

    addMagneticEffect() {
        const buttons = document.querySelectorAll('.btn-primary, .category-btn');
        
        buttons.forEach(button => {
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const deltaX = (x - centerX) / centerX;
                const deltaY = (y - centerY) / centerY;
                
                const currentTransform = button.style.transform || '';
                const scaleMatch = currentTransform.match(/scale\([\d.]+\)/);
                const currentScale = scaleMatch ? scaleMatch[0] : 'scale(1)';
                
                button.style.transform = `translate(${deltaX * 10}px, ${deltaY * 10}px) ${currentScale}`;
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = '';
            });
        });
    }

    addCardTiltEffect() {
        // Target both product cards (Index) and listing cards (Dashboard)
        const cards = document.querySelectorAll('.product-card, .listing-card');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                // Remove transition instantly so the card follows mouse without lag
                card.style.transition = 'none';
            });

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Subtler rotation (higher divisor = less rotation)
                const rotateX = (y - centerY) / 25;
                const rotateY = (centerX - x) / 25;

                // "Lower" movement: reduced translateY and scale
                card.style.transform = `
                    perspective(1000px) 
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg) 
                    translateY(-5px) 
                    scale(1.01)
                `;
            });
            
            card.addEventListener('mouseleave', () => {
                // Add smooth ease-out transition for the return animation
                card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
                card.style.transform = 'translateY(0) scale(1) rotateX(0) rotateY(0)';
                
                // Clear inline styles after animation to keep CSS clean
                setTimeout(() => {
                    card.style.transition = '';
                }, 600);
            });
        });
    }
}

// ========================================
// ENHANCED PARTICLE SYSTEM
// ========================================

class EnhancedParticles {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = window.innerWidth < 768 ? 30 : 60;
        this.mouse = { x: null, y: null, radius: 150 };
        
        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.animate();
        this.addEventListeners();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new EnhancedParticle(this.canvas));
        }
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.x;
            this.mouse.y = e.y;
        });

        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => {
            particle.update(this.mouse);
            particle.draw(this.ctx);
        });

        this.connectParticles();
        requestAnimationFrame(() => this.animate());
    }

    connectParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    this.ctx.strokeStyle = `rgba(168, 85, 247, ${0.2 * (1 - distance / 120)})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }
}

class EnhancedParticle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.size = Math.random() * 4 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.color = Math.random() > 0.5 ? 
            `rgba(168, 85, 247, ${this.opacity})` : 
            `rgba(236, 72, 153, ${this.opacity})`;
    }

    update(mouse) {
        if (mouse.x != null && mouse.y != null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouse.radius) {
                const force = (mouse.radius - distance) / mouse.radius;
                const angle = Math.atan2(dy, dx);
                this.x -= Math.cos(angle) * force * 5;
                this.y -= Math.sin(angle) * force * 5;
            }
        }

        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > this.canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > this.canvas.height || this.y < 0) this.speedY *= -1;

        if (this.x < 0) this.x = 0;
        if (this.x > this.canvas.width) this.x = this.canvas.width;
        if (this.y < 0) this.y = 0;
        if (this.y > this.canvas.height) this.y = this.canvas.height;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// ========================================
// CURSOR TRAIL EFFECT
// ========================================

class CursorTrail {
    constructor() {
        this.trail = [];
        this.trailLength = 15;
        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            this.addTrailPoint(e.clientX, e.clientY);
        });
        this.animate();
    }

    addTrailPoint(x, y) {
        this.trail.push({ x, y, life: 1 });
        if (this.trail.length > this.trailLength) {
            this.trail.shift();
        }
    }

    animate() {
        document.querySelectorAll('.cursor-trail').forEach(el => el.remove());

        this.trail.forEach((point) => {
            const el = document.createElement('div');
            el.className = 'cursor-trail';
            el.style.cssText = `
                position: fixed;
                width: ${point.life * 8}px;
                height: ${point.life * 8}px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(168, 85, 247, ${point.life * 0.4}), transparent);
                pointer-events: none;
                z-index: 9999;
                left: ${point.x}px;
                top: ${point.y}px;
                transform: translate(-50%, -50%);
                transition: opacity 0.3s;
            `;
            document.body.appendChild(el);
            point.life -= 0.05;
            setTimeout(() => el.remove(), 300);
        });

        this.trail = this.trail.filter(point => point.life > 0);
        requestAnimationFrame(() => this.animate());
    }
}

// ========================================
// RIPPLE CLICK EFFECT
// ========================================

function addRippleEffect() {
    document.querySelectorAll('.btn-primary, .btn-secondary, .category-btn, .product-card, .listing-card').forEach(element => {
        element.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                animation: ripple 0.6s ease-out;
            `;

            const currentPosition = window.getComputedStyle(this).position;
            if (currentPosition === 'static') {
                this.style.position = 'relative';
            }
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// ========================================
// SMOOTH SCROLL
// ========================================

function addSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ========================================
// PAGE LOAD FADE IN
// ========================================

function pageLoadAnimation() {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.8s ease';
        document.body.style.opacity = '1';
    }, 100);
}

// ========================================
// RE-INITIALIZE ON PRODUCT FILTER
// ========================================

let originalFilterProducts = null;

function setupFilterProductsOverride() {
    if (typeof window.filterProducts === 'function') {
        originalFilterProducts = window.filterProducts;
        
        window.filterProducts = function() {
            if (originalFilterProducts) {
                originalFilterProducts();
            }
            
            setTimeout(() => {
                new ScrollReveal();
                addRippleEffect();
            }, 100);
        };
    }
}

// ========================================
// INITIALIZE ALL ANIMATIONS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    pageLoadAnimation();
    
    setTimeout(() => {
        new ScrollReveal();
        new EnhancedParticles();
        if (window.innerWidth > 1024) {
            new CursorTrail();
        }
        addRippleEffect();
        addSmoothScroll();
        setupFilterProductsOverride();
        
        console.log('🎨 ReVogue Animations Loaded!');
    }, 200);
});

const productsGrid = document.getElementById('productsGrid');
if (productsGrid) {
    const observer = new MutationObserver(() => {
        setTimeout(() => {
            new ScrollReveal();
            addRippleEffect();
        }, 50);
    });
    observer.observe(productsGrid, { childList: true });
}

// Also observe Dashboard Grid if present
const myListingsGrid = document.getElementById('myListingsGrid');
if (myListingsGrid) {
    const observer = new MutationObserver(() => {
        setTimeout(() => {
            new ScrollReveal();
            addRippleEffect();
        }, 50);
    });
    observer.observe(myListingsGrid, { childList: true });
}
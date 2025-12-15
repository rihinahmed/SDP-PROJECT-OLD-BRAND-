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

// Contact Methods Data
const contactMethods = [
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
        title: 'Email Us',
        details: 'support@revogue.com',
        subtext: 'We reply within 24 hours',
        gradient: 'linear-gradient(135deg, #a78bfa 0%, #db2777 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
        title: 'Call Us',
        details: '+1 (555) 123-4567',
        subtext: 'Mon-Fri 9AM-6PM EST',
        gradient: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
        title: 'Visit Us',
        details: '123 Fashion Street',
        subtext: 'New York, NY 10001',
        gradient: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)'
    },
    {
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
        title: 'Live Chat',
        details: 'Chat with our team',
        subtext: 'Available 24/7',
        gradient: 'linear-gradient(135deg, #4ade80 0%, #059669 100%)'
    }
];

// FAQs Data
const faqs = [
    {
        question: 'How do I sell on ReVogue?',
        answer: 'Click the "Sell Item" button, fill out the listing form with details and photos, and your item will be live!'
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, PayPal, and Apple Pay for secure transactions.'
    },
    {
        question: 'How long does shipping take?',
        answer: 'Standard shipping takes 3-5 business days. Express shipping is available for faster delivery.'
    },
    {
        question: 'What is your return policy?',
        answer: "We offer a 14-day return policy for items that don't match the description."
    }
];

// Render Contact Methods
function renderContactMethods() {
    const grid = document.getElementById('contactMethodsGrid');
    grid.innerHTML = contactMethods.map((method, index) => `
        <div class="contact-method-card" data-index="${index}">
            <div class="contact-method-icon" style="background: ${method.gradient}">
                ${method.icon}
            </div>
            <h4 class="contact-method-title">${method.title}</h4>
            <p class="contact-method-details">${method.details}</p>
            <p class="contact-method-subtext">${method.subtext}</p>
        </div>
    `).join('');

    // Add hover handlers
    let activeCard = null;
    document.querySelectorAll('.contact-method-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (activeCard) activeCard.classList.remove('active');
            this.classList.add('active');
            activeCard = this;
        });

        card.addEventListener('mouseleave', function() {
            this.classList.remove('active');
            activeCard = null;
        });
    });
}

// Render FAQs
function renderFAQs() {
    const grid = document.getElementById('faqGrid');
    grid.innerHTML = faqs.map(faq => `
        <div class="faq-card">
            <h4 class="faq-question">${faq.question}</h4>
            <p class="faq-answer">${faq.answer}</p>
        </div>
    `).join('');
}

// Contact Form Handler
const contactForm = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Hide form and show success message
    contactForm.style.display = 'none';
    successMessage.style.display = 'block';
    
    // Animate success icon
    const successIcon = successMessage.querySelector('.success-icon');
    successIcon.style.animation = 'successPulse 0.6s ease-out';
    
    // Reset after 3 seconds
    setTimeout(() => {
        successMessage.style.display = 'none';
        contactForm.style.display = 'block';
        contactForm.reset();
    }, 3000);
});

// Add success animation
const style = document.createElement('style');
style.textContent = `
    @keyframes successPulse {
        0% {
            transform: scale(0);
            opacity: 0;
        }
        50% {
            transform: scale(1.2);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Newsletter Form Handler
const newsletterForm = document.querySelector('.newsletter-form');
const newsletterButton = newsletterForm.querySelector('.newsletter-button');

newsletterButton.addEventListener('click', (e) => {
    e.preventDefault();
    const input = newsletterForm.querySelector('.newsletter-input');
    
    if (input.value && input.value.includes('@')) {
        // Show success feedback
        const originalHTML = newsletterButton.innerHTML;
        newsletterButton.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        newsletterButton.style.background = '#059669';
        
        setTimeout(() => {
            newsletterButton.innerHTML = originalHTML;
            newsletterButton.style.background = '';
            input.value = '';
        }, 2000);
    } else {
        input.style.borderColor = '#ef4444';
        setTimeout(() => {
            input.style.borderColor = '';
        }, 1000);
    }
});

// Social Links Handlers
document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('click', () => {
        const platform = link.textContent;
        alert(`This would open ReVogue's ${platform} page!`);
    });
});

// Map Button Handler
const mapButton = document.querySelector('.map-button');
if (mapButton) {
    mapButton.addEventListener('click', () => {
        alert('This would open Google Maps with our store location!');
    });
}

// Animate contact method cards on scroll
function observeContactMethods() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.contact-method-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });
}

// Animate FAQ cards
function observeFAQs() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.faq-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });
}

// Initialize
renderContactMethods();
renderFAQs();
observeContactMethods();
observeFAQs();

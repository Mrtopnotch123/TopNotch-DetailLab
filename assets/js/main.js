/* ===================================
   TOPNOTCH DETAILLAB - MAIN JAVASCRIPT
   =================================== */

// DOM Elements
const header = document.getElementById('header');
const headerNav = document.getElementById('headerNav');
const menuToggle = document.getElementById('menuToggle');
const backToTop = document.getElementById('backToTop');

// Mobile Menu Toggle
function toggleMenu() {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    
    if (!isExpanded) {
        headerNav.style.transform = 'translateX(0)';
    } else {
        headerNav.style.transform = 'translateX(-100%)';
    }
}

// Close menu when link is clicked
function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    headerNav.style.transform = 'translateX(-100%)';
}

// Close menu when escape key is pressed
function handleEscape(e) {
    if (e.key === 'Escape') {
        closeMenu();
    }
}

// Close menu when clicking outside
function handleClickOutside(e) {
    if (!headerNav.contains(e.target) && !menuToggle.contains(e.target)) {
        closeMenu();
    }
}

// Close menu on resize to desktop
function handleResize() {
    if (window.innerWidth > 768) {
        closeMenu();
    }
}

// Add navigation link click listeners
document.querySelectorAll('.header-nav a').forEach(link => {
    link.addEventListener('click', closeMenu);
});

// Menu toggle event listeners
menuToggle.addEventListener('click', toggleMenu);
document.addEventListener('keydown', handleEscape);
document.addEventListener('click', handleClickOutside);
window.addEventListener('resize', handleResize);

/* ===================================
   HEADER SCROLL BEHAVIOR
   =================================== */

let lastScrollY = 0;

function updateHeaderOnScroll() {
    const scrollY = window.scrollY;
    
    if (scrollY > 50) {
        header.style.padding = '0.5rem var(--spacing-lg)';
    } else {
        header.style.padding = 'var(--spacing-md) var(--spacing-lg)';
    }
    
    lastScrollY = scrollY;
}

window.addEventListener('scroll', updateHeaderOnScroll, { passive: true });

/* ===================================
   BACK TO TOP BUTTON
   =================================== */

function updateBackToTopVisibility() {
    if (window.scrollY > 300) {
        backToTop.classList.add('show');
    } else {
        backToTop.classList.remove('show');
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
backToTop.addEventListener('click', scrollToTop);

/* ===================================
   INTERSECTION OBSERVER FOR ANIMATIONS
   =================================== */

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for fade-in animation
document.querySelectorAll('.package-card, .why-card, .trust-item, .step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

/* ===================================
   CURRENT YEAR IN FOOTER
   =================================== */

document.getElementById('currentYear').textContent = new Date().getFullYear();

/* ===================================
   PAGE SPECIFIC NAVIGATION
   =================================== */

function setActivePage() {
    const currentPath = window.location.pathname;
    
    document.querySelectorAll('.header-nav a').forEach(link => {
        const href = link.getAttribute('href');
        
        if (href === currentPath || 
            (currentPath === '/' && href === '/') ||
            (currentPath.startsWith(href) && href !== '/')) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

setActivePage();

/* ===================================
   SMOOTH SCROLL PERFORMANCE
   =================================== */

let ticking = false;

function updateScroll() {
    updateHeaderOnScroll();
    updateBackToTopVisibility();
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
    }
}, { passive: true });

/* ===================================
   BUTTON INTERACTION FEEDBACK
   =================================== */

document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousedown', function() {
        this.style.transform = 'scale(0.98)';
    });
    
    btn.addEventListener('mouseup', function() {
        this.style.transform = '';
    });
    
    btn.addEventListener('mouseleave', function() {
        this.style.transform = '';
    });
});

/* ===================================
   ACCESSIBILITY ENHANCEMENTS
   =================================== */

// Ensure keyboard navigation works
document.querySelectorAll('.header-nav a, .btn, .action-link').forEach(link => {
    link.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            if (link.classList.contains('header-nav')) {
                link.click();
            }
        }
    });
});

/* ===================================
   MOBILE ACTION BAR POSITIONING
   =================================== */

function adjustMobileActionBar() {
    const actionBar = document.querySelector('.mobile-action-bar');
    
    if (window.innerWidth <= 768 && actionBar) {
        // Ensure it stays above browser controls
        actionBar.style.position = 'fixed';
        actionBar.style.bottom = '0';
    }
}

window.addEventListener('resize', adjustMobileActionBar);
adjustMobileActionBar();

/* ===================================
   SAFE INITIALIZATION
   =================================== */

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setActivePage();
        updateBackToTopVisibility();
    });
} else {
    setActivePage();
    updateBackToTopVisibility();
}

/* ===================================
   PREFERS REDUCED MOTION
   =================================== */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelectorAll('[style*="transition"]').forEach(el => {
        el.style.transition = 'none';
    });
}

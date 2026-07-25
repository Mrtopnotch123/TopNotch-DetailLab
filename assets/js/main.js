const siteHeader = document.getElementById('siteHeader');
const scrollProgress = document.getElementById('scrollProgress');
const backToTop = document.getElementById('backToTop');
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

function handleScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  if (scrollProgress) scrollProgress.style.width = progress + '%';
  if (siteHeader) siteHeader.classList.toggle('scrolled', scrollTop > 12);
  if (backToTop) backToTop.style.display = scrollTop > 240 ? 'block' : 'none';
}

window.addEventListener('scroll', handleScroll);
window.addEventListener('load', handleScroll);

if (backToTop) {
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.addEventListener('click', (event) => {
    if (!mainNav.classList.contains('open')) return;
    const withinMenu = mainNav.contains(event.target);
    const withinToggle = menuToggle.contains(event.target);
    if (!withinMenu && !withinToggle) {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Reveal on scroll
const revealSections = document.querySelectorAll('.section-fade, .section-reveal');

function handleReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  revealSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const inView = rect.top < window.innerHeight - 80;
    if (inView) {
      if (prefersReducedMotion) {
        section.style.opacity = 1;
        section.style.transform = 'none';
      } else {
        section.classList.add('section-visible');
      }
    }
  });
}

window.addEventListener('scroll', handleReveal);
window.addEventListener('load', handleReveal);

// Footer year
const footerYear = document.getElementById('footerYear');
if (footerYear) footerYear.textContent = new Date().getFullYear();

// FAQ animation is handled via <details> native behavior.
// Pointer effects could be added lightly if desired (no gaming effects).

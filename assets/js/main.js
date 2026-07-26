/* =========================================================
   TOPNOTCH DETAILLAB — MAIN.JS
   Global behavior only. No prices, package logic, or backend.
========================================================= */

(function () {
  'use strict';

  document.documentElement.classList.add('js');

  const progressBar = document.getElementById('scrollProgress');
  const header = document.getElementById('siteHeader');
  const backToTop = document.getElementById('backToTop');
  const menuToggle = document.getElementById('menuToggle');
  const siteNav = document.getElementById('siteNav');
  const footerYear = document.getElementById('currentYear');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  let ticking = false;

  function handleScroll() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (progressBar && docHeight > 0) {
      const pct = Math.min(100, (scrollY / docHeight) * 100);
      progressBar.style.width = pct + '%';
    }

    if (header) header.classList.toggle('scrolled', scrollY > 28);
    if (backToTop) backToTop.classList.toggle('show', scrollY > 420);
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      if (prefersReducedMotion) {
        window.scrollTo(0, 0);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  function openNav() {
    if (!siteNav || !menuToggle) return;
    siteNav.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
  }

  function closeNav() {
    if (!siteNav || !menuToggle) return;
    siteNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  }

  function isNavOpen() {
    return !!(siteNav && siteNav.classList.contains('open'));
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      if (isNavOpen()) closeNav();
      else openNav();
    });
  }

  if (siteNav) {
    siteNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
  }

  document.addEventListener('click', function (event) {
    if (!isNavOpen()) return;
    if (header && header.contains(event.target)) return;
    closeNav();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isNavOpen()) {
      closeNav();
      if (menuToggle) menuToggle.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 860 && isNavOpen()) closeNav();
  });

  function setupReveal() {
    const reveals = Array.from(document.querySelectorAll('.reveal'));
    if (!reveals.length) return;
    const staggerContainers = new Map();

    reveals.forEach(function (el) {
      let revealClass = 'reveal-copy';
      if (el.matches('.eyebrow') || el.querySelector(':scope > .eyebrow')) revealClass = 'reveal-eyebrow';
      if (el.matches('h1, h2, h3') || el.querySelector(':scope > h1, :scope > h2')) revealClass = 'reveal-title';
      if (el.matches('.hero-actions')) revealClass = 'reveal-actions';
      else if (el.matches('.hero-trust, .hero-trust li')) revealClass = 'reveal-trust';
      else if (el.matches('.hero-visual')) revealClass = 'reveal-stage';
      else if (el.closest('.final-cta')) revealClass = 'reveal-cta';
      else if (el.matches('.service-card, .why-card, .about-card, .trust-item, .coming-soon, .finder-card, .booking-form, .selection-banner, .local-preview-note, .recovery-panel, .process-grid li, .faq-list details, .builder-panel, .builder-summary-card, .booking-selection-summary, .booking-no-selection')) revealClass = 'reveal-card';
      el.classList.add(revealClass);

      const container = el.closest('.hero-grid, .trust-grid, .service-grid, .why-grid, .about-grid, .process-grid, .tool-grid, .faq-list, .final-cta, .builder-layout, .section, .page-hero, .selection-banner-actions, .hero-trust') || document.body;
      const index = staggerContainers.get(container) || 0;
      const revealDelay = Math.min(280, index * 72);
      el.style.setProperty('--reveal-delay', revealDelay + 'ms');
      staggerContainers.set(container, index + 1);
    });

    if (prefersReducedMotion) {
      reveals.forEach(function (el) {
        el.style.removeProperty('--reveal-delay');
        el.classList.add('visible');
      });
      return;
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      reveals.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      reveals.forEach(function (el) {
        el.classList.add('visible');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupReveal();

    const faqList = document.querySelector('.faq-list');
    if (faqList) {
      faqList.addEventListener('toggle', function (event) {
        if (!event.target.matches('details') || !event.target.open) return;
        faqList.querySelectorAll('details[open]').forEach(function (item) {
          if (item !== event.target) item.removeAttribute('open');
        });
      }, true);
    }

    if (footerYear) footerYear.textContent = new Date().getFullYear();

    document.querySelectorAll('.button').forEach(function (btn) {
      btn.addEventListener('pointerdown', function () { btn.classList.add('pressed'); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (evt) {
        btn.addEventListener(evt, function () { btn.classList.remove('pressed'); });
      });
    });

    document.querySelectorAll('.mobile-actions a').forEach(function (link) {
      const href = link.getAttribute('href');
      if (!href) return;
      const absolute = new URL(href, window.location.href);
      if (absolute.pathname === window.location.pathname) link.setAttribute('aria-current', 'page');
    });
  });

  document.addEventListener('DOMContentLoaded', function () {
    const glow = document.getElementById('cursorGlow');
    if (!glow || !finePointer) return;
    let glowVisible = false;

    document.addEventListener('mousemove', function (event) {
      glow.style.left = event.clientX + 'px';
      glow.style.top = event.clientY + 'px';
      if (!glowVisible) {
        glow.style.opacity = '1';
        glowVisible = true;
      }
    });

    document.addEventListener('mouseleave', function () {
      glow.style.opacity = '0';
      glowVisible = false;
    });
  });

  handleScroll();
})();

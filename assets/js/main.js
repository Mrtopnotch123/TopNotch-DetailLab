/* =========================================================
   TOPNOTCH DETAILLAB — MAIN.JS
   Global behavior only. No prices, package logic, or backend.
========================================================= */

(function () {
  'use strict';

  /* ---------- JS class on <html> ---------- */
  document.documentElement.classList.add('js');

  /* ---------- DOM references ---------- */
  const progressBar = document.getElementById('scrollProgress');
  const header = document.getElementById('siteHeader');
  const backToTop = document.getElementById('backToTop');
  const menuToggle = document.getElementById('menuToggle');
  const siteNav = document.getElementById('siteNav');
  const footerYear = document.getElementById('currentYear');

  /* ---------- Reduced-motion check ---------- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll handling ---------- */
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }

  function handleScroll() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    /* Scroll progress bar */
    if (progressBar && docHeight > 0) {
      const pct = Math.min(100, (scrollY / docHeight) * 100);
      progressBar.style.width = pct + '%';
    }

    /* Sticky header scrolled state */
    if (header) {
      header.classList.toggle('scrolled', scrollY > 40);
    }

    /* Back-to-top visibility */
    if (backToTop) {
      backToTop.classList.toggle('show', scrollY > 400);
    }

    ticking = false;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Back to top ---------- */
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      if (prefersReducedMotion) {
        window.scrollTo(0, 0);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  /* ---------- Mobile menu ---------- */
  function openNav() {
    if (!siteNav || !menuToggle) return;
    siteNav.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeNav() {
    if (!siteNav || !menuToggle) return;
    siteNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  function isNavOpen() {
    return siteNav && siteNav.classList.contains('open');
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      if (isNavOpen()) {
        closeNav();
      } else {
        openNav();
      }
    });
  }

  /* Close after selecting a nav link */
  if (siteNav) {
    siteNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
  }

  /* Close on outside click */
  document.addEventListener('click', function (e) {
    if (!isNavOpen()) return;
    if (header && header.contains(e.target)) return;
    closeNav();
  });

  /* Close on Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isNavOpen()) {
      closeNav();
      if (menuToggle) menuToggle.focus();
    }
  });

  /* Close when resizing to desktop */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 860 && isNavOpen()) {
      closeNav();
    }
  });

  /* ---------- Page-ready class ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('page-ready');
  });

  /* ---------- Reveal on scroll ---------- */
  function setupReveal() {
    const reveals = Array.from(document.querySelectorAll('.reveal'));
    if (!reveals.length) return;

    const staggerContainers = new Map();

    reveals.forEach(function (el) {
      let revealClass = 'reveal-copy';

      if (el.matches('.hero-copy')) {
        revealClass = 'reveal-copy';
      } else if (el.matches('.hero-visual')) {
        revealClass = 'reveal-stage';
      } else if (el.closest('.final-cta')) {
        revealClass = 'reveal-cta';
      } else if (
        el.matches(
          '.service-card, .why-card, .about-card, .trust-item, .coming-soon, .finder-card, .booking-form, .recovery-panel, .process-grid li, .faq-list details, .builder-panel, .builder-summary-card'
        )
      ) {
        revealClass = 'reveal-card';
      }

      el.classList.add(revealClass);

      const container =
        el.closest('.hero-grid, .trust-grid, .service-grid, .why-grid, .about-grid, .process-grid, .tool-grid, .faq-list, .final-cta, .builder-layout, .section, .page-hero') ||
        document.body;
      const index = staggerContainers.get(container) || 0;
      el.style.setProperty('--reveal-delay', Math.min(index * 70, 280) + 'ms');
      staggerContainers.set(container, index + 1);
    });

    /* Reduced motion: show everything immediately */
    if (prefersReducedMotion) {
      reveals.forEach(function (el) {
        el.style.removeProperty('--reveal-delay');
        el.classList.add('visible');
      });
      return;
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
      reveals.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      /* Fallback: reveal immediately */
      reveals.forEach(function (el) {
        el.classList.add('visible');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', setupReveal);

  /* ---------- FAQ single-open behavior ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    const faqList = document.querySelector('.faq-list');
    if (!faqList) return;

    faqList.addEventListener('toggle', function (e) {
      if (!e.target.matches('details') || !e.target.open) return;
      faqList.querySelectorAll('details[open]').forEach(function (d) {
        if (d !== e.target) d.removeAttribute('open');
      });
    }, true);
  });

  /* ---------- Desktop cursor glow ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    const glow = document.getElementById('cursorGlow');
    if (!glow) return;
    /* Only activate on fine-pointer devices */
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let glowVisible = false;

    document.addEventListener('mousemove', function (e) {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
      if (!glowVisible) {
        glow.style.opacity = '1';
        glowVisible = true;
      }
    });

    document.addEventListener('mouseleave', function () {
      glow.style.opacity = '0';
      glowVisible = false;
    });

    /* Card glow coordinates */
    const cards = document.querySelectorAll('.service-card, .why-card, .about-card');
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', x + '%');
        card.style.setProperty('--my', y + '%');
      });
    });
  });

  /* ---------- Button pressed state ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.button').forEach(function (btn) {
      btn.addEventListener('pointerdown', function () {
        btn.classList.add('pressed');
      });
      btn.addEventListener('pointerup', function () {
        btn.classList.remove('pressed');
      });
      btn.addEventListener('pointerleave', function () {
        btn.classList.remove('pressed');
      });
    });
  });

  /* ---------- Footer year ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (footerYear) {
      footerYear.textContent = new Date().getFullYear();
    }
  });

  /* ---------- Run scroll once on load ---------- */
  handleScroll();
})();

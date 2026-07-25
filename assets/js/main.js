(() => {
  "use strict";

  document.documentElement.classList.add("js");
  const $ = (s, scope = document) => scope.querySelector(s);
  const $$ = (s, scope = document) => [...scope.querySelectorAll(s)];

  const header = $("#siteHeader");
  const progress = $("#scrollProgress");
  const back = $("#backToTop");
  const menu = $("#menuToggle");
  const nav = $("#siteNav");
  let ticking = false;

  function updateScroll() {
    const top = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? Math.min(100, top / max * 100) : 0}%`;
    header?.classList.toggle("scrolled", top > 30);
    back?.classList.toggle("show", top > 650);
    ticking = false;
  }

  addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateScroll);
      ticking = true;
    }
  }, { passive: true });
  updateScroll();

  back?.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  menu?.addEventListener("click", () => {
    const open = nav?.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(Boolean(open)));
  });

  $$("#siteNav a").forEach(a =>
    a.addEventListener("click", () => {
      nav?.classList.remove("open");
      menu?.setAttribute("aria-expanded", "false");
    })
  );

  document.addEventListener("click", event => {
    if (!nav?.classList.contains("open")) return;

    const clickedInsideNav = nav.contains(event.target);
    const clickedMenu = menu?.contains(event.target);

    if (!clickedInsideNav && !clickedMenu) {
      nav.classList.remove("open");
      menu?.setAttribute("aria-expanded", "false");
    }
  });

  addEventListener("resize", () => {
    if (innerWidth > 860) {
      nav?.classList.remove("open");
      menu?.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      nav?.classList.remove("open");
      menu?.setAttribute("aria-expanded", "false");
    }
  });

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = $$(".reveal");

  reveals.forEach((element, index) => {
    element.style.setProperty("--reveal-order", String(index % 4));
  });

  requestAnimationFrame(() => {
    document.body.classList.add("page-ready");
  });

  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach(el => el.classList.add("visible"));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -35px 0px"
    });

    reveals.forEach(el => observer.observe(el));
  }

  $$(".faq-list details").forEach(item =>
    item.addEventListener("toggle", () => {
      if (item.open) {
        $$(".faq-list details").forEach(other => {
          if (other !== item) other.open = false;
        });
      }
    })
  );

  if (!reduced && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".preview-card, .service-card, .why-card, .story-card").forEach(card => {
      card.addEventListener("pointermove", event => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
        card.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
      });
    });
  }

  $$(".button").forEach(button => {
    button.addEventListener("pointerdown", () => button.classList.add("is-pressed"));
    button.addEventListener("pointerup", () => button.classList.remove("is-pressed"));
    button.addEventListener("pointercancel", () => button.classList.remove("is-pressed"));
    button.addEventListener("pointerleave", () => button.classList.remove("is-pressed"));
  });

  const year = $("#currentYear");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
})();

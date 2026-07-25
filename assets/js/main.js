(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const $ = (selector, scope = document) =>
    scope.querySelector(selector);

  const $$ = (selector, scope = document) =>
    [...scope.querySelectorAll(selector)];

  const header = $("#siteHeader");
  const progress = $("#scrollProgress");
  const backToTop = $("#backToTop");
  const menuToggle = $("#menuToggle");
  const siteNav = $("#siteNav");

  let scrollFramePending = false;

  function updateScrollInterface() {
    const scrollTop = window.scrollY;

    const scrollableHeight =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const percentage =
      scrollableHeight > 0
        ? Math.min(
            100,
            (scrollTop / scrollableHeight) * 100
          )
        : 0;

    if (progress) {
      progress.style.width = `${percentage}%`;
    }

    header?.classList.toggle(
      "scrolled",
      scrollTop > 30
    );

    backToTop?.classList.toggle(
      "show",
      scrollTop > 650
    );

    scrollFramePending = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (scrollFramePending) {
        return;
      }

      scrollFramePending = true;

      window.requestAnimationFrame(
        updateScrollInterface
      );
    },
    {
      passive: true
    }
  );

  updateScrollInterface();

  backToTop?.addEventListener(
    "click",
    () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  );

  function closeNavigation() {
    siteNav?.classList.remove("open");

    menuToggle?.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  menuToggle?.addEventListener(
    "click",
    () => {
      const isOpen =
        siteNav?.classList.toggle("open");

      menuToggle.setAttribute(
        "aria-expanded",
        String(Boolean(isOpen))
      );
    }
  );

  $$("#siteNav a").forEach((link) => {
    link.addEventListener(
      "click",
      closeNavigation
    );
  });

  document.addEventListener(
    "click",
    (event) => {
      if (
        !siteNav?.classList.contains("open")
      ) {
        return;
      }

      const clickedInsideNavigation =
        siteNav.contains(event.target);

      const clickedMenuButton =
        menuToggle?.contains(event.target);

      if (
        !clickedInsideNavigation &&
        !clickedMenuButton
      ) {
        closeNavigation();
      }
    }
  );

  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 860) {
        closeNavigation();
      }
    }
  );
    document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeNavigation();
      }
    }
  );

  const prefersReducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  const revealElements =
    $$(".reveal");

  revealElements.forEach(
    (element, index) => {
      element.style.setProperty(
        "--reveal-order",
        String(index % 4)
      );
    }
  );

  window.requestAnimationFrame(
    () => {
      document.body.classList.add(
        "page-ready"
      );
    }
  );

  if (
    prefersReducedMotion ||
    !("IntersectionObserver" in window)
  ) {
    revealElements.forEach(
      (element) => {
        element.classList.add("visible");
      }
    );
  } else {
    const revealObserver =
      new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add(
              "visible"
            );

            observer.unobserve(
              entry.target
            );
          });
        },
        {
          threshold: 0.12,
          rootMargin:
            "0px 0px -35px 0px"
        }
      );

    revealElements.forEach(
      (element) => {
        revealObserver.observe(element);
      }
    );
  }

  const faqItems =
    $$(".faq-list details");

  faqItems.forEach((item) => {
    item.addEventListener(
      "toggle",
      () => {
        if (!item.open) {
          return;
        }

        faqItems.forEach(
          (otherItem) => {
            if (otherItem !== item) {
              otherItem.open = false;
            }
          }
        );
      }
    );
  });

  const supportsFinePointer =
    window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

  if (
    !prefersReducedMotion &&
    supportsFinePointer
  ) {
    $$(
      ".preview-card, " +
      ".service-card, " +
      ".why-card, " +
      ".story-card"
    ).forEach((card) => {
      card.addEventListener(
        "pointermove",
        (event) => {
          const rectangle =
            card.getBoundingClientRect();

          card.style.setProperty(
            "--pointer-x",
            `${
              event.clientX -
              rectangle.left
            }px`
          );

          card.style.setProperty(
            "--pointer-y",
            `${
              event.clientY -
              rectangle.top
            }px`
          );
        }
      );
    });
  }

  $$(".button").forEach(
    (button) => {
      button.addEventListener(
        "pointerdown",
        () => {
          button.classList.add(
            "is-pressed"
          );
        }
      );

      button.addEventListener(
        "pointerup",
        () => {
          button.classList.remove(
            "is-pressed"
          );
        }
      );

      button.addEventListener(
        "pointercancel",
        () => {
          button.classList.remove(
            "is-pressed"
          );
        }
      );

      button.addEventListener(
        "pointerleave",
        () => {
          button.classList.remove(
            "is-pressed"
          );
        }
      );
    }
  );

  const currentYear =
    $("#currentYear");

  if (currentYear) {
    currentYear.textContent =
      String(new Date().getFullYear());
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const scrollProgress = document.getElementById("scrollProgress");
  const backToTop = document.getElementById("backToTop");
  const footerYear = document.getElementById("footerYear");
  const mobileNavToggle = document.getElementById("mobileNavToggle");
  const siteNav = document.getElementById("siteNav");

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  function updateScrollProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = `${progress}%`;
    if (backToTop) {
      backToTop.style.display = scrollTop > 300 ? "flex" : "none";
    }
  }

  window.addEventListener("scroll", updateScrollProgress);
  updateScrollProgress();

  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (mobileNavToggle && siteNav) {
    mobileNavToggle.addEventListener("click", () => {
      const expanded = mobileNavToggle.getAttribute("aria-expanded") === "true";
      mobileNavToggle.setAttribute("aria-expanded", (!expanded).toString());
      siteNav.classList.toggle("tn-nav-open");
    });
  }

  const revealElements = document.querySelectorAll("[data-reveal]");
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("tn-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealElements.forEach(el => observer.observe(el));
});

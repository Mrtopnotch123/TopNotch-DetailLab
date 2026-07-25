(() => {
  "use strict";

  /* =========================================================
     TOPNOTCH DETAILLAB — FINAL SCRIPT.JS
     Built for the finalized index.html and style.css
  ========================================================= */

  const BUSINESS_PHONE = "+13177901060";

  const PACKAGE_PRICES = Object.freeze({
    "Quick Reset": 40,
    "Full Reset": 90,
    "Deep Reset": 180
  });

  const ADDON_PRICES = Object.freeze({
    "Cargo Area Reset": 20,
    "Spot Extraction": 25,
    "Leather Conditioning": 25,
    "Pet Hair Removal": 30,
    "Odor Treatment": 40
  });

  /*
   * Deep Reset always includes the cargo area.
   * Extraction and leather conditioning remain selectable because
   * applicability depends on the vehicle's interior materials.
   * Recovery is custom-quoted, so separate add-ons are assessed together.
   */
  const LOCKED_ADDONS = Object.freeze({
    "Quick Reset": [],
    "Full Reset": [],
    "Deep Reset": ["Cargo Area Reset"],
    "Recovery": [
      "Cargo Area Reset",
      "Spot Extraction",
      "Leather Conditioning",
      "Pet Hair Removal",
      "Odor Treatment"
    ]
  });

  const SELECTORS = Object.freeze({
    header: "#siteHeader",
    progress: "#scrollProgress",
    backToTop: "#backToTop",
    cursorGlow: "#cursorGlow",
    menuToggle: "#menuToggle",
    siteNav: "#siteNav",
    packageFinder: "#packageFinder",
    finderCondition: "#finderCondition",
    finderSpecial: "#finderSpecial",
    finderResult: "#finderResult",
    priceEstimator: "#priceEstimator",
    estimatePackage: "#estimatePackage",
    estimateTotal: "#estimateTotal",
    estimateNote: "#estimateNote",
    useEstimate: "#useEstimate",
    bookingForm: "#bookingForm",
    bookingProgress: "#bookingProgress",
    bookPackage: "#bookPackage",
    bookingSummary: "#bookingSummary",
    bookingStatus: "#bookingStatus",
    bookDate: "#bookDate",
    reviewForm: "#reviewForm",
    reviewStatus: "#reviewStatus",
    currentYear: "#currentYear"
  });

  const $ = (selector, scope = document) => scope.querySelector(selector);

  const $$ = (selector, scope = document) =>
    Array.from(scope.querySelectorAll(selector));

  const elements = {
    header: $(SELECTORS.header),
    progress: $(SELECTORS.progress),
    backToTop: $(SELECTORS.backToTop),
    cursorGlow: $(SELECTORS.cursorGlow),
    menuToggle: $(SELECTORS.menuToggle),
    siteNav: $(SELECTORS.siteNav),
    packageFinder: $(SELECTORS.packageFinder),
    finderCondition: $(SELECTORS.finderCondition),
    finderSpecial: $(SELECTORS.finderSpecial),
    finderResult: $(SELECTORS.finderResult),
    priceEstimator: $(SELECTORS.priceEstimator),
    estimatePackage: $(SELECTORS.estimatePackage),
    estimateTotal: $(SELECTORS.estimateTotal),
    estimateNote: $(SELECTORS.estimateNote),
    useEstimate: $(SELECTORS.useEstimate),
    bookingForm: $(SELECTORS.bookingForm),
    bookingProgress: $(SELECTORS.bookingProgress),
    bookPackage: $(SELECTORS.bookPackage),
    bookingSummary: $(SELECTORS.bookingSummary),
    bookingStatus: $(SELECTORS.bookingStatus),
    bookDate: $(SELECTORS.bookDate),
    reviewForm: $(SELECTORS.reviewForm),
    reviewStatus: $(SELECTORS.reviewStatus),
    currentYear: $(SELECTORS.currentYear)
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  function buildSmsUrl(message) {
    const separator = isIOS ? "&" : "?";

    return `sms:${BUSINESS_PHONE}${separator}body=${encodeURIComponent(
      message
    )}`;
  }

  function formatMoney(amount, includePlus = false) {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(amount);

    return includePlus ? `${formatted}+` : formatted;
  }

  function setStatus(element, message, isError = false) {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.dataset.state = isError ? "error" : "success";
  }

  function scrollToBooking() {
    document.querySelector("#book")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  /* ---------- Scroll progress, header, and back-to-top ---------- */

  let scrollFramePending = false;

  function updateScrollInterface() {
    const scrollTop = window.scrollY;

    const scrollableHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    const percentage =
      scrollableHeight > 0
        ? (scrollTop / scrollableHeight) * 100
        : 0;

    if (elements.progress) {
      elements.progress.style.width = `${Math.min(
        100,
        Math.max(0, percentage)
      )}%`;
    }

    elements.header?.classList.toggle(
      "scrolled",
      scrollTop > 30
    );

    elements.backToTop?.classList.toggle(
      "show",
      scrollTop > 650
    );

    scrollFramePending = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollFramePending) {
        scrollFramePending = true;

        window.requestAnimationFrame(
          updateScrollInterface
        );
      }
    },
    {
      passive: true
    }
  );

  updateScrollInterface();

  elements.backToTop?.addEventListener(
    "click",
    () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  );

  /* ---------- Desktop cursor glow ---------- */

  const supportsFinePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );

  if (
    elements.cursorGlow &&
    supportsFinePointer.matches
  ) {
    document.addEventListener(
      "pointermove",
      (event) => {
        elements.cursorGlow.style.opacity = "1";

        elements.cursorGlow.style.left =
          `${event.clientX}px`;

        elements.cursorGlow.style.top =
          `${event.clientY}px`;
      },
      {
        passive: true
      }
    );

    document.addEventListener(
      "pointerleave",
      () => {
        elements.cursorGlow.style.opacity = "0";
      }
    );
  }

  /* ---------- Mobile navigation ---------- */

  function closeNavigation() {
    if (
      !elements.siteNav ||
      !elements.menuToggle
    ) {
      return;
    }

    elements.siteNav.classList.remove("open");

    elements.menuToggle.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  elements.menuToggle?.addEventListener(
    "click",
    () => {
      if (!elements.siteNav) {
        return;
      }

      const isOpen =
        elements.siteNav.classList.toggle("open");

      elements.menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
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
        !elements.siteNav?.classList.contains("open")
      ) {
        return;
      }

      const clickedInsideNavigation =
        elements.siteNav.contains(event.target);

      const clickedMenuButton =
        elements.menuToggle?.contains(event.target);

      if (
        !clickedInsideNavigation &&
        !clickedMenuButton
      ) {
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

  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 860) {
        closeNavigation();
      }
    }
  );

  /* ---------- Reveal-on-scroll effects ---------- */

  const revealElements = $$(".reveal");

  const prefersReducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  if (
    prefersReducedMotion ||
    !("IntersectionObserver" in window)
  ) {
    revealElements.forEach((element) => {
      element.classList.add("visible");
    });
  } else {
    const revealObserver =
      new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add("visible");

            observer.unobserve(entry.target);
          });
        },
        {
          threshold: 0.12,
          rootMargin: "0px 0px -40px 0px"
        }
      );

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  }

  /* ---------- Package selection ---------- */

  function choosePackage(
    packageName,
    shouldScroll = true
  ) {
    if (!packageName) {
      return;
    }

    if (elements.bookPackage) {
      elements.bookPackage.value = packageName;

      elements.bookPackage.dispatchEvent(
        new Event("change", {
          bubbles: true
        })
      );
    }

    if (elements.estimatePackage) {
      elements.estimatePackage.value =
        packageName;

      updateEstimator();
    }

    if (shouldScroll) {
      scrollToBooking();
    }
  }

  $$(".package-select").forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        choosePackage(
          button.dataset.package || ""
        );
      }
    );
  });
    /* ---------- Package finder ---------- */

  elements.packageFinder?.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      if (
        !elements.packageFinder.checkValidity()
      ) {
        elements.packageFinder.reportValidity();
        return;
      }

      const condition =
        elements.finderCondition?.value || "";

      const specialCondition =
        elements.finderSpecial?.value || "";

      let packageName = "Quick Reset";

      let recommendation =
        "Quick Reset fits a maintained interior that only needs trash removal and vacuuming.";

      if (
        condition === "severe" ||
        specialCondition === "heavy"
      ) {
        packageName = "Recovery";

        recommendation =
          "Recovery photo review is recommended. The condition sounds beyond a normal package and should be assessed before pricing.";
      } else if (
        condition === "deep" ||
        specialCondition === "some"
      ) {
        packageName = "Deep Reset";

        recommendation =
          "Deep Reset is the strongest starting match for an interior needing detailed cleaning, extraction, or additional correction.";
      } else if (
        condition === "normal"
      ) {
        packageName = "Full Reset";

        recommendation =
          "Full Reset is the TopNotch Recommended choice for normal everyday buildup.";
      }

      if (elements.finderResult) {
        elements.finderResult.textContent =
          recommendation;
      }

      choosePackage(
        packageName,
        false
      );
    }
  );

  /* ---------- Starting-price estimator ---------- */

  const estimatorAddons = $$(
    'input[type="checkbox"][data-addon]',
    elements.priceEstimator || document
  );

  function getLockedAddons(packageName) {
    return LOCKED_ADDONS[packageName] || [];
  }

  function updateEstimatorLocks() {
    const packageName =
      elements.estimatePackage?.value || "";

    const lockedAddons =
      getLockedAddons(packageName);

    estimatorAddons.forEach((input) => {
      const addonName =
        input.dataset.addon || "";

      const isLocked =
        lockedAddons.includes(addonName);

      const label =
        input.closest("label");

      input.disabled = isLocked;

      if (isLocked) {
        input.checked = false;
      }

      label?.classList.toggle(
        "is-disabled",
        isLocked
      );

      if (label) {
        label.title =
          packageName === "Recovery" &&
          isLocked
            ? "Recovery is custom-quoted as one complete assessment."
            : isLocked
              ? "Included in the selected package."
              : "";
      }
    });
  }

  function updateEstimator() {
    if (
      !elements.estimatePackage ||
      !elements.estimateTotal
    ) {
      return;
    }

    const packageName =
      elements.estimatePackage.value;

    updateEstimatorLocks();

    if (packageName === "Recovery") {
      elements.estimateTotal.textContent =
        "Custom quote";

      if (elements.estimateNote) {
        elements.estimateNote.textContent =
          "Recovery requires photos or an inspection before pricing.";
      }

      return;
    }

    const addonTotal =
      estimatorAddons.reduce(
        (total, input) => {
          if (
            !input.checked ||
            input.disabled
          ) {
            return total;
          }

          return (
            total +
            Number(input.value || 0)
          );
        },
        0
      );

    const basePrice =
      PACKAGE_PRICES[packageName] || 0;

    const estimatedTotal =
      basePrice + addonTotal;

    const needsPlusSign =
      packageName !== "Quick Reset" ||
      addonTotal > 0;

    elements.estimateTotal.textContent =
      formatMoney(
        estimatedTotal,
        needsPlusSign
      );

    if (elements.estimateNote) {
      elements.estimateNote.textContent =
        "Final pricing depends on vehicle size, condition, materials, and labor.";
    }
  }

  elements.estimatePackage?.addEventListener(
    "change",
    updateEstimator
  );

  estimatorAddons.forEach((input) => {
    input.addEventListener(
      "change",
      updateEstimator
    );
  });

  /* ---------- Booking form and smart add-on adjustment ---------- */

  const bookingAddons = $$(
    'input[type="checkbox"][name="addons"]',
    elements.bookingForm || document
  );

  function updateBookingAddonLocks() {
    const packageName =
      elements.bookPackage?.value || "";

    const lockedAddons =
      getLockedAddons(packageName);

    bookingAddons.forEach((input) => {
      const isLocked =
        lockedAddons.includes(input.value);

      const label =
        input.closest("label");

      input.disabled = isLocked;

      if (isLocked) {
        input.checked = false;
      }

      label?.classList.toggle(
        "is-disabled",
        isLocked
      );

      if (label) {
        label.title =
          packageName === "Recovery" &&
          isLocked
            ? "Recovery is custom-quoted as one complete assessment."
            : isLocked
              ? "Included in the selected package."
              : "";
      }
    });

    const note =
      $("#addonLockNote");

    if (!note) {
      return;
    }

    if (packageName === "Recovery") {
      note.textContent =
        "Recovery is custom-quoted as one complete assessment, so separate add-ons are not selected here.";
    } else if (
      packageName === "Deep Reset"
    ) {
      note.textContent =
        "Cargo-area service is included. Extraction and leather care remain subject to interior material and condition.";
    } else {
      note.textContent =
        "Add-ons already included or applicable to your selected service will be adjusted during booking.";
    }
  }

  function getSelectedBookingAddons() {
    return bookingAddons
      .filter(
        (input) =>
          input.checked &&
          !input.disabled
      )
      .map(
        (input) => input.value
      );
  }

  function getPackagePriceLabel(
    packageName
  ) {
    if (packageName === "Recovery") {
      return "Custom quote";
    }

    if (packageName === "Quick Reset") {
      return formatMoney(40);
    }

    const basePrice =
      PACKAGE_PRICES[packageName];

    return basePrice
      ? `From ${formatMoney(basePrice)}`
      : "";
  }
    function updateBookingSummary() {
    if (
      !elements.bookingSummary ||
      !elements.bookPackage
    ) {
      return;
    }

    const packageName =
      elements.bookPackage.value;

    if (!packageName) {
      elements.bookingSummary.textContent =
        "Select a package to begin your booking summary.";

      return;
    }

    const selectedAddons =
      getSelectedBookingAddons();

    const wrapper =
      document.createDocumentFragment();

    const packageLine =
      document.createElement("strong");

    const priceLine =
      document.createTextNode(
        ` · ${getPackagePriceLabel(
          packageName
        )}`
      );

    packageLine.textContent =
      packageName;

    wrapper.append(
      packageLine,
      priceLine
    );

    if (selectedAddons.length > 0) {
      wrapper.append(
        document.createElement("br")
      );

      wrapper.append(
        document.createTextNode(
          `Add-ons: ${selectedAddons.join(
            ", "
          )}`
        )
      );
    }

    elements.bookingSummary.replaceChildren(
      wrapper
    );
  }

  function updateBookingProgress() {
    if (
      !elements.bookingForm ||
      !elements.bookingProgress
    ) {
      return;
    }

    const requiredFields = $$(
      "[required]",
      elements.bookingForm
    );

    let completedCount = 0;

    requiredFields.forEach((field) => {
      if (
        field.type === "checkbox" ||
        field.type === "radio"
      ) {
        if (field.checked) {
          completedCount += 1;
        }

        return;
      }

      if (
        String(field.value).trim() !== ""
      ) {
        completedCount += 1;
      }
    });

    const percentage =
      requiredFields.length > 0
        ? (
            completedCount /
            requiredFields.length
          ) * 100
        : 0;

    elements.bookingProgress.style.width =
      `${Math.min(
        100,
        Math.max(0, percentage)
      )}%`;
  }

  elements.bookPackage?.addEventListener(
    "change",
    () => {
      updateBookingAddonLocks();
      updateBookingSummary();
      updateBookingProgress();
    }
  );

  bookingAddons.forEach((input) => {
    input.addEventListener(
      "change",
      updateBookingSummary
    );
  });

  $$(
    "input, select, textarea",
    elements.bookingForm || document
  ).forEach((field) => {
    field.addEventListener(
      "input",
      updateBookingProgress
    );

    field.addEventListener(
      "change",
      updateBookingProgress
    );
  });

  elements.useEstimate?.addEventListener(
    "click",
    () => {
      if (
        !elements.estimatePackage ||
        !elements.bookPackage
      ) {
        return;
      }

      elements.bookPackage.value =
        elements.estimatePackage.value;

      const selectedEstimatorAddons =
        estimatorAddons
          .filter(
            (input) =>
              input.checked &&
              !input.disabled
          )
          .map(
            (input) =>
              input.dataset.addon
          );

      bookingAddons.forEach((input) => {
        input.checked =
          selectedEstimatorAddons.includes(
            input.value
          );
      });

      elements.bookPackage.dispatchEvent(
        new Event("change", {
          bubbles: true
        })
      );

      scrollToBooking();
    }
  );

  /* ---------- Minimum booking date ---------- */

  if (elements.bookDate) {
    const now = new Date();

    const localDate = new Date(
      now.getTime() -
      now.getTimezoneOffset() * 60_000
    )
      .toISOString()
      .split("T")[0];

    elements.bookDate.min =
      localDate;
  }

  /* ---------- Booking SMS generation ---------- */

  elements.bookingForm?.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      if (
        !elements.bookingForm.checkValidity()
      ) {
        elements.bookingForm.reportValidity();

        setStatus(
          elements.bookingStatus,
          "Please complete every required field.",
          true
        );

        return;
      }

      const selectedAddons =
        getSelectedBookingAddons();

      const message = [
        "TOPNOTCH DETAILLAB — BOOKING REQUEST",
        "",
        `Name: ${
          $("#bookName")?.value.trim() || ""
        }`,
        `Phone: ${
          $("#bookPhone")?.value.trim() || ""
        }`,
        `Vehicle: ${
          $("#vehicleYear")?.value.trim() || ""
        } ${
          $("#vehicleMake")?.value.trim() || ""
        } ${
          $("#vehicleModel")?.value.trim() || ""
        }`.trim(),
        `Vehicle type: ${
          $("#vehicleType")?.value || ""
        }`,
        `Package: ${
          elements.bookPackage?.value || ""
        }`,
        `Add-ons: ${
          selectedAddons.length
            ? selectedAddons.join(", ")
            : "None"
        }`,
        `Preferred date: ${
          elements.bookDate?.value || ""
        }`,
        `Preferred time: ${
          $("#bookTime")?.value || ""
        }`,
        `Location: ${
          $("#bookLocation")?.value.trim() || ""
        }`,
        `Condition: ${
          $("#bookCondition")?.value || ""
        }`,
        `Pet hair: ${
          $("#bookPetHair")?.value || ""
        }`,
        `Odor: ${
          $("#bookOdor")?.value || ""
        }`,
        `Spills/staining: ${
          $("#bookStains")?.value || ""
        }`,
        `Notes: ${
          $("#bookNotes")?.value.trim() ||
          "None"
        }`,
        "",
        "I understand this request does not confirm an appointment or final price."
      ].join("\n");

      setStatus(
        elements.bookingStatus,
        "Opening your messaging app with the booking request prepared."
      );

      window.location.href =
        buildSmsUrl(message);
    }
  );

  /* ---------- Customer review SMS generation ---------- */

  elements.reviewForm?.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      if (
        !elements.reviewForm.checkValidity()
      ) {
        elements.reviewForm.reportValidity();

        setStatus(
          elements.reviewStatus,
          "Please complete the required review fields.",
          true
        );

        return;
      }

      const selectedRating = $(
        'input[name="rating"]:checked',
        elements.reviewForm
      )?.value;

      const message = [
        "TOPNOTCH DETAILLAB — CUSTOMER REVIEW",
        "",
        `Name: ${
          $("#reviewName")?.value.trim() || ""
        }`,
        `Service: ${
          $("#reviewService")?.value || ""
        }`,
        `Rating: ${
          selectedRating || ""
        }/5`,
        `Review: ${
          $("#reviewText")?.value.trim() || ""
        }`,
        `Permission to feature: ${
          $("#reviewPermission")?.checked
            ? "Yes"
            : "No"
        }`
      ].join("\n");

      setStatus(
        elements.reviewStatus,
        "Opening your messaging app with the review prepared."
      );

      window.location.href =
        buildSmsUrl(message);
    }
  );
    /* ---------- FAQ behavior ---------- */

  const faqItems = $$("#faq details");

  faqItems.forEach((item) => {
    item.addEventListener(
      "toggle",
      () => {
        if (!item.open) {
          return;
        }

        faqItems.forEach((otherItem) => {
          if (otherItem !== item) {
            otherItem.open = false;
          }
        });
      }
    );
  });

  /* ---------- Footer year ---------- */

  if (elements.currentYear) {
    elements.currentYear.textContent =
      String(new Date().getFullYear());
  }

  /* ---------- Initial state ---------- */

  updateEstimator();
  updateBookingAddonLocks();
  updateBookingSummary();
  updateBookingProgress();
})();

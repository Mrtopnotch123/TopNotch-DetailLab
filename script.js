"use strict";

/* =========================================================
   TOPNOTCH DETAILLAB — FINAL SCRIPT.JS
   Matches the latest index.html and style.css
========================================================= */


/* =========================================================
   1. BUSINESS SETTINGS
========================================================= */

const BUSINESS_PHONE_DISPLAY = "317-790-1060";
const BUSINESS_PHONE_SMS = "+13177901060";
const MOBILE_BREAKPOINT = 900;


/* =========================================================
   2. ELEMENT REFERENCES
========================================================= */

const body = document.body;

const loadingScreen =
  document.getElementById("loading-screen");

const siteHeader =
  document.getElementById("site-header");

const menuToggle =
  document.getElementById("menu-toggle");

const navMenu =
  document.getElementById("nav-menu");

const navLinks =
  document.querySelectorAll(".nav-link");

const revealElements =
  document.querySelectorAll(".reveal");

const faqItems =
  document.querySelectorAll(".faq-item");

const packageButtons =
  document.querySelectorAll(".package-select");

const bookingForm =
  document.getElementById("booking-form");

const bookingStatus =
  document.getElementById("booking-status");

const bookingPackage =
  document.getElementById("booking-package");

const preferredDate =
  document.getElementById("preferred-date");

const reviewForm =
  document.getElementById("review-form");

const reviewStatus =
  document.getElementById("review-status");

const backToTopButton =
  document.getElementById("back-to-top");

const currentYear =
  document.getElementById("current-year");


/* =========================================================
   3. LOADING SCREEN
========================================================= */

body.classList.add("loading");

function hideLoadingScreen() {
  if (!loadingScreen) {
    body.classList.remove("loading");
    return;
  }

  loadingScreen.classList.add("hidden");
  body.classList.remove("loading");

  setTimeout(() => {
    loadingScreen.remove();
  }, 700);
}

window.addEventListener("load", () => {
  setTimeout(hideLoadingScreen, 550);
});

/*
  Fallback:
  prevents the loading screen from remaining visible
  if a browser delays or fails to fire the load event.
*/

setTimeout(hideLoadingScreen, 3500);


/* =========================================================
   4. CURRENT YEAR
========================================================= */

if (currentYear) {
  currentYear.textContent =
    new Date().getFullYear();
}


/* =========================================================
   5. MOBILE MENU
========================================================= */

function openMobileMenu() {
  if (!menuToggle || !navMenu) {
    return;
  }

  menuToggle.classList.add("active");
  navMenu.classList.add("active");
  body.classList.add("menu-open");

  menuToggle.setAttribute(
    "aria-expanded",
    "true"
  );

  menuToggle.setAttribute(
    "aria-label",
    "Close navigation menu"
  );
}

function closeMobileMenu() {
  if (!menuToggle || !navMenu) {
    return;
  }

  menuToggle.classList.remove("active");
  navMenu.classList.remove("active");
  body.classList.remove("menu-open");

  menuToggle.setAttribute(
    "aria-expanded",
    "false"
  );

  menuToggle.setAttribute(
    "aria-label",
    "Open navigation menu"
  );
}

function toggleMobileMenu() {
  if (!navMenu) {
    return;
  }

  const isOpen =
    navMenu.classList.contains("active");

  if (isOpen) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

if (menuToggle) {
  menuToggle.addEventListener(
    "click",
    toggleMobileMenu
  );
}

navLinks.forEach((link) => {
  link.addEventListener(
    "click",
    closeMobileMenu
  );
});

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  }
);

document.addEventListener(
  "click",
  (event) => {
    if (!menuToggle || !navMenu) {
      return;
    }

    const clickedToggle =
      menuToggle.contains(event.target);

    const clickedMenu =
      navMenu.contains(event.target);

    const menuIsOpen =
      navMenu.classList.contains("active");

    if (
      menuIsOpen &&
      !clickedToggle &&
      !clickedMenu
    ) {
      closeMobileMenu();
    }
  }
);

window.addEventListener(
  "resize",
  () => {
    if (
      window.innerWidth >
      MOBILE_BREAKPOINT
    ) {
      closeMobileMenu();
    }
  }
);


/* =========================================================
   6. HEADER SCROLL EFFECT
========================================================= */

function updateHeader() {
  if (!siteHeader) {
    return;
  }

  siteHeader.classList.toggle(
    "scrolled",
    window.scrollY > 25
  );
}

window.addEventListener(
  "scroll",
  updateHeader,
  {
    passive: true
  }
);

updateHeader();


/* =========================================================
   7. SCROLL REVEAL ANIMATIONS
========================================================= */

const prefersReducedMotion =
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

if (
  prefersReducedMotion ||
  !("IntersectionObserver" in window)
) {
  revealElements.forEach((element) => {
    element.classList.add("is-visible");
  });
} else {
  const revealObserver =
    new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add(
            "is-visible"
          );

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin:
          "0px 0px -45px 0px"
      }
    );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });
}


/* =========================================================
   8. ACTIVE NAVIGATION LINK
========================================================= */

const observedSections =
  document.querySelectorAll(
    "main section[id]"
  );

if (
  "IntersectionObserver" in window &&
  observedSections.length > 0
) {
  const navigationObserver =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const sectionID =
            entry.target.id;

          navLinks.forEach((link) => {
            const target =
              link.getAttribute("href");

            link.classList.toggle(
              "active",
              target === `#${sectionID}`
            );
          });
        });
      },
      {
        threshold: 0.2,
        rootMargin:
          "-28% 0px -58% 0px"
      }
    );

  observedSections.forEach((section) => {
    navigationObserver.observe(section);
  });
}


/* =========================================================
   9. SMOOTH INTERNAL LINKS
========================================================= */

document
  .querySelectorAll('a[href^="#"]')
  .forEach((link) => {
    link.addEventListener(
      "click",
      (event) => {
        const targetID =
          link.getAttribute("href");

        if (
          !targetID ||
          targetID === "#"
        ) {
          return;
        }

        const target =
          document.querySelector(targetID);

        if (!target) {
          return;
        }

        event.preventDefault();
        closeMobileMenu();

        target.scrollIntoView({
          behavior: prefersReducedMotion
            ? "auto"
            : "smooth",
          block: "start"
        });

        try {
          history.replaceState(
            null,
            "",
            targetID
          );
        } catch (error) {
          /*
            The page still scrolls correctly if
            browser history cannot be updated.
          */
        }
      }
    );
  });


/* =========================================================
   10. FAQ ACCORDION
========================================================= */

faqItems.forEach((item) => {
  const question =
    item.querySelector(".faq-question");

  if (!question) {
    return;
  }

  question.addEventListener(
    "click",
    () => {
      const isAlreadyOpen =
        item.classList.contains("active");

      faqItems.forEach((otherItem) => {
        const otherQuestion =
          otherItem.querySelector(
            ".faq-question"
          );

        otherItem.classList.remove(
          "active"
        );

        if (otherQuestion) {
          otherQuestion.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      });

      if (!isAlreadyOpen) {
        item.classList.add("active");

        question.setAttribute(
          "aria-expanded",
          "true"
        );
      }
    }
  );
});


/* =========================================================
   11. PACKAGE SELECTION
========================================================= */

packageButtons.forEach((button) => {
  button.addEventListener(
    "click",
    () => {
      if (!bookingPackage) {
        return;
      }

      const selectedPackage =
        button.dataset.package;

      if (!selectedPackage) {
        return;
      }

      const matchingOption =
        Array.from(
          bookingPackage.options
        ).find((option) =>
          option.textContent.includes(
            selectedPackage
          )
        );

      if (matchingOption) {
        bookingPackage.value =
          matchingOption.value;

        bookingPackage.dispatchEvent(
          new Event("change", {
            bubbles: true
          })
        );
      }

      setTimeout(() => {
        bookingPackage.focus({
          preventScroll: true
        });
      }, 700);
    }
  );
});


/* =========================================================
   12. BOOKING DATE SETTINGS
========================================================= */

function setBookingDateMinimum() {
  if (!preferredDate) {
    return;
  }

  const currentDate =
    new Date();

  const localDate =
    new Date(
      currentDate.getTime() -
      currentDate.getTimezoneOffset() *
        60000
    );

  preferredDate.min =
    localDate
      .toISOString()
      .split("T")[0];
}

setBookingDateMinimum();


/* =========================================================
   13. HELPER FUNCTIONS
========================================================= */

function cleanText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function showStatus(
  statusElement,
  message,
  type
) {
  if (!statusElement) {
    return;
  }

  statusElement.textContent = message;

  statusElement.classList.remove(
    "success",
    "error"
  );

  statusElement.classList.add(type);

  statusElement.scrollIntoView({
    behavior: prefersReducedMotion
      ? "auto"
      : "smooth",
    block: "nearest"
  });
}

function clearStatus(statusElement) {
  if (!statusElement) {
    return;
  }

  statusElement.textContent = "";

  statusElement.classList.remove(
    "success",
    "error"
  );
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not provided";
  }

  const dateParts =
    dateValue.split("-");

  if (dateParts.length !== 3) {
    return dateValue;
  }

  const year =
    Number(dateParts[0]);

  const month =
    Number(dateParts[1]) - 1;

  const day =
    Number(dateParts[2]);

  const date =
    new Date(
      year,
      month,
      day
    );

  if (
    Number.isNaN(date.getTime())
  ) {
    return dateValue;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }
  );
}

function openPreparedText(message) {
  const encodedMessage =
    encodeURIComponent(message);

  const isiOS =
    /iPad|iPhone|iPod/.test(
      navigator.userAgent
    );

  const separator =
    isiOS ? "&" : "?";

  const smsLink =
    `sms:${BUSINESS_PHONE_SMS}` +
    `${separator}body=${encodedMessage}`;

  window.location.href = smsLink;
}

function setSubmitButtonState(
  button,
  isSubmitting,
  submittingText
) {
  if (!button) {
    return;
  }

  if (
    !button.dataset.originalText
  ) {
    button.dataset.originalText =
      button.textContent.trim();
  }

  button.disabled = isSubmitting;

  button.textContent =
    isSubmitting
      ? submittingText
      : button.dataset.originalText;
}


/* =========================================================
   14. BOOKING FORM
========================================================= */

if (bookingForm) {
  const bookingSubmitButton =
    bookingForm.querySelector(
      'button[type="submit"]'
    );

  bookingForm.addEventListener(
    "input",
    () => {
      clearStatus(bookingStatus);
    }
  );

  bookingForm.addEventListener(
    "change",
    () => {
      clearStatus(bookingStatus);
    }
  );

  bookingForm.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      clearStatus(bookingStatus);

      if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity();

        showStatus(
          bookingStatus,
          "Please complete every required field and accept the booking-request agreement.",
          "error"
        );

        return;
      }

      setSubmitButtonState(
        bookingSubmitButton,
        true,
        "Preparing Message..."
      );

      const formData =
        new FormData(bookingForm);

      const name =
        cleanText(
          formData.get("name")
        );

      const phone =
        cleanText(
          formData.get("phone")
        );

      const vehicleYear =
        cleanText(
          formData.get("vehicleYear")
        );

      const vehicleMake =
        cleanText(
          formData.get("vehicleMake")
        );

      const vehicleModel =
        cleanText(
          formData.get("vehicleModel")
        );

      const vehicleType =
        cleanText(
          formData.get("vehicleType")
        );

      const servicePackage =
        cleanText(
          formData.get(
            "servicePackage"
          )
        );

      const selectedDate =
        cleanText(
          formData.get(
            "preferredDate"
          )
        );

      const selectedTime =
        cleanText(
          formData.get(
            "preferredWindow"
          )
        );

      const details =
        cleanText(
          formData.get("details")
        );

      const selectedIssues =
        formData.getAll("issues");

      const issueText =
        selectedIssues.length > 0
          ? selectedIssues.join(", ")
          : "None selected";

      const bookingMessage = [
        "TOPNOTCH DETAILLAB BOOKING REQUEST",
        "",
        `Name: ${name}`,
        `Phone: ${phone}`,
        "",
        `Vehicle: ${vehicleYear} ${vehicleMake} ${vehicleModel}`,
        `Vehicle type: ${vehicleType}`,
        "",
        `Requested package: ${servicePackage}`,
        `Preferred date: ${formatDate(selectedDate)}`,
        `Preferred time: ${selectedTime}`,
        "",
        `Interior concerns: ${issueText}`,
        "",
        "Interior details:",
        details,
        "",
        "I understand this is a booking request. My appointment is not official until TopNotch DetailLab confirms the date, service, availability, and final price."
      ].join("\n");

      showStatus(
        bookingStatus,
        `Your request is ready. Your Messages app will open with the details prepared for ${BUSINESS_PHONE_DISPLAY}. Tap Send to finish.`,
        "success"
      );

      setTimeout(() => {
        openPreparedText(
          bookingMessage
        );
      }, 500);

      setTimeout(() => {
        setSubmitButtonState(
          bookingSubmitButton,
          false,
          ""
        );
      }, 2200);
    }
  );
}


/* =========================================================
   15. REVIEW FORM
========================================================= */

if (reviewForm) {
  const reviewSubmitButton =
    reviewForm.querySelector(
      'button[type="submit"]'
    );

  reviewForm.addEventListener(
    "input",
    () => {
      clearStatus(reviewStatus);
    }
  );

  reviewForm.addEventListener(
    "change",
    () => {
      clearStatus(reviewStatus);
    }
  );

  reviewForm.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      clearStatus(reviewStatus);

      if (!reviewForm.checkValidity()) {
        reviewForm.reportValidity();

        showStatus(
          reviewStatus,
          "Please complete your name, service, star rating, written review, and permission checkbox.",
          "error"
        );

        return;
      }

      setSubmitButtonState(
        reviewSubmitButton,
        true,
        "Preparing Review..."
      );

      const formData =
        new FormData(reviewForm);

      const customerName =
        cleanText(
          formData.get(
            "reviewName"
          )
        );

      const serviceReceived =
        cleanText(
          formData.get(
            "reviewService"
          )
        );

      const rating =
        Number(
          formData.get("rating")
        );

      const writtenReview =
        cleanText(
          formData.get(
            "reviewMessage"
          )
        );

      const safeRating =
        Number.isFinite(rating)
          ? Math.min(
              5,
              Math.max(1, rating)
            )
          : 1;

      const starDisplay =
        "★".repeat(safeRating) +
        "☆".repeat(
          5 - safeRating
        );

      const reviewMessage = [
        "TOPNOTCH DETAILLAB CUSTOMER REVIEW",
        "",
        `Customer: ${customerName}`,
        `Service: ${serviceReceived}`,
        `Rating: ${safeRating}/5 ${starDisplay}`,
        "",
        "Review:",
        writtenReview,
        "",
        "I give TopNotch DetailLab permission to contact me and feature this honest review on its website or social media."
      ].join("\n");

      showStatus(
        reviewStatus,
        `Your review is ready. Your Messages app will open with the review prepared for ${BUSINESS_PHONE_DISPLAY}. Tap Send to submit it.`,
        "success"
      );

      setTimeout(() => {
        openPreparedText(
          reviewMessage
        );
      }, 500);

      setTimeout(() => {
        setSubmitButtonState(
          reviewSubmitButton,
          false,
          ""
        );
      }, 2200);
    }
  );
}


/* =========================================================
   16. BACK-TO-TOP BUTTON
========================================================= */

function updateBackToTopButton() {
  if (!backToTopButton) {
    return;
  }

  backToTopButton.classList.toggle(
    "visible",
    window.scrollY > 650
  );
}

window.addEventListener(
  "scroll",
  updateBackToTopButton,
  {
    passive: true
  }
);

if (backToTopButton) {
  backToTopButton.addEventListener(
    "click",
    () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion
          ? "auto"
          : "smooth"
      });
    }
  );
}

updateBackToTopButton();


/* =========================================================
   17. IMAGE ERROR PROTECTION
========================================================= */

document
  .querySelectorAll("img")
  .forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        image.setAttribute(
          "aria-hidden",
          "true"
        );

        image.style.visibility =
          "hidden";
      },
      {
        once: true
      }
    );
  });


/* =========================================================
   18. EXTERNAL-LINK SECURITY
========================================================= */

document
  .querySelectorAll(
    'a[target="_blank"]'
  )
  .forEach((link) => {
    const currentRel =
      link.getAttribute("rel") || "";

    const relValues =
      new Set(
        currentRel
          .split(/\s+/)
          .filter(Boolean)
      );

    relValues.add("noopener");
    relValues.add("noreferrer");

    link.setAttribute(
      "rel",
      Array.from(relValues).join(" ")
    );
  });


/* =========================================================
   19. INITIAL PAGE STATE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    updateHeader();
    updateBackToTopButton();
    setBookingDateMinimum();
  }
);

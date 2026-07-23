"use strict";

/* =========================================================
   TOPNOTCH DETAILLAB — FINAL SCRIPT.JS
   Matches the final index.html and style.css
========================================================= */


/* =========================================================
   1. ELEMENT REFERENCES
========================================================= */

const body = document.body;
const siteHeader = document.getElementById("site-header");
const menuToggle = document.getElementById("menu-toggle");
const navMenu = document.getElementById("nav-menu");
const navLinks = document.querySelectorAll(".nav-link");
const revealElements = document.querySelectorAll(".reveal");
const faqItems = document.querySelectorAll(".faq-item");
const packageButtons = document.querySelectorAll(".package-select");
const bookingForm = document.getElementById("booking-form");
const bookingStatus = document.getElementById("booking-status");
const reviewForm = document.getElementById("leave-review");
const reviewStatus = document.getElementById("review-status");
const bookingPackage = document.getElementById("booking-package");
const preferredDate = document.getElementById("preferred-date");
const backToTopButton = document.getElementById("back-to-top");
const currentYear = document.getElementById("current-year");

const businessPhoneDisplay = "317-790-1060";
const businessPhoneSMS = "+13177901060";


/* =========================================================
   2. CURRENT YEAR
========================================================= */

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}


/* =========================================================
   3. MOBILE MENU
========================================================= */

function openMobileMenu() {
  if (!menuToggle || !navMenu) {
    return;
  }

  menuToggle.classList.add("active");
  navMenu.classList.add("active");
  body.classList.add("menu-open");

  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "Close navigation menu");
}


function closeMobileMenu() {
  if (!menuToggle || !navMenu) {
    return;
  }

  menuToggle.classList.remove("active");
  navMenu.classList.remove("active");
  body.classList.remove("menu-open");

  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
}


function toggleMobileMenu() {
  if (!navMenu) {
    return;
  }

  const menuIsOpen = navMenu.classList.contains("active");

  if (menuIsOpen) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}


if (menuToggle) {
  menuToggle.addEventListener("click", toggleMobileMenu);
}


navLinks.forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});


document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileMenu();
  }
});


document.addEventListener("click", (event) => {
  if (!menuToggle || !navMenu) {
    return;
  }

  const clickedInsideMenu = navMenu.contains(event.target);
  const clickedMenuButton = menuToggle.contains(event.target);

  if (
    navMenu.classList.contains("active") &&
    !clickedInsideMenu &&
    !clickedMenuButton
  ) {
    closeMobileMenu();
  }
});


window.addEventListener("resize", () => {
  if (window.innerWidth > 900) {
    closeMobileMenu();
  }
});


/* =========================================================
   4. HEADER SCROLL EFFECT
========================================================= */

function updateHeaderState() {
  if (!siteHeader) {
    return;
  }

  if (window.scrollY > 30) {
    siteHeader.classList.add("scrolled");
  } else {
    siteHeader.classList.remove("scrolled");
  }
}

window.addEventListener("scroll", updateHeaderState, {
  passive: true
});

updateHeaderState();


/* =========================================================
   5. SCROLL REVEAL ANIMATIONS
========================================================= */

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -45px 0px"
    }
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach((element) => {
    element.classList.add("is-visible");
  });
}


/* =========================================================
   6. ACTIVE NAVIGATION LINK
========================================================= */

const pageSections = document.querySelectorAll(
  "main section[id]"
);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const currentSectionId = entry.target.id;

        navLinks.forEach((link) => {
          const target = link.getAttribute("href");

          link.classList.toggle(
            "active",
            target === `#${currentSectionId}`
          );
        });
      });
    },
    {
      threshold: 0.35,
      rootMargin: "-25% 0px -55% 0px"
    }
  );

  pageSections.forEach((section) => {
    sectionObserver.observe(section);
  });
}


/* =========================================================
   7. FAQ ACCORDION
========================================================= */

faqItems.forEach((item) => {
  const questionButton = item.querySelector(".faq-question");

  if (!questionButton) {
    return;
  }

  questionButton.addEventListener("click", () => {
    const itemIsOpen = item.classList.contains("active");

    faqItems.forEach((otherItem) => {
      const otherButton =
        otherItem.querySelector(".faq-question");

      otherItem.classList.remove("active");

      if (otherButton) {
        otherButton.setAttribute(
          "aria-expanded",
          "false"
        );
      }
    });

    if (!itemIsOpen) {
      item.classList.add("active");

      questionButton.setAttribute(
        "aria-expanded",
        "true"
      );
    }
  });
});


/* =========================================================
   8. PACKAGE SELECTION
========================================================= */

packageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!bookingPackage) {
      return;
    }

    const packageName = button.dataset.package;

    const matchingOption = Array.from(
      bookingPackage.options
    ).find((option) =>
      option.textContent.includes(packageName)
    );

    if (matchingOption) {
      bookingPackage.value = matchingOption.value;
    }

    setTimeout(() => {
      bookingPackage.focus({
        preventScroll: true
      });
    }, 700);
  });
});


/* =========================================================
   9. BOOKING DATE LIMIT
========================================================= */

if (preferredDate) {
  const today = new Date();

  const localToday = new Date(
    today.getTime() -
    today.getTimezoneOffset() * 60000
  );

  preferredDate.min = localToday
    .toISOString()
    .split("T")[0];
}


/* =========================================================
   10. HELPER FUNCTIONS
========================================================= */

function cleanText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}


function showFormStatus(
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
    behavior: "smooth",
    block: "nearest"
  });
}


function clearFormStatus(statusElement) {
  if (!statusElement) {
    return;
  }

  statusElement.textContent = "";
  statusElement.classList.remove(
    "success",
    "error"
  );
}


function openTextMessage(message) {
  const encodedMessage =
    encodeURIComponent(message);

  const isiPhoneOrIPad =
    /iPhone|iPad|iPod/i.test(
      navigator.userAgent
    );

  const separator =
    isiPhoneOrIPad ? "&" : "?";

  const smsURL =
    `sms:${businessPhoneSMS}` +
    `${separator}body=${encodedMessage}`;

  window.location.href = smsURL;
}


function formatDate(dateValue) {
  if (!dateValue) {
    return "Not provided";
  }

  const parts = dateValue.split("-");

  if (parts.length !== 3) {
    return dateValue;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  const date = new Date(
    year,
    month,
    day
  );

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


/* =========================================================
   11. BOOKING FORM
========================================================= */

if (bookingForm) {
  bookingForm.addEventListener(
    "input",
    () => {
      clearFormStatus(bookingStatus);
    }
  );


  bookingForm.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      clearFormStatus(bookingStatus);

      if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity();

        showFormStatus(
          bookingStatus,
          "Please complete every required field before sending your booking request.",
          "error"
        );

        return;
      }


      const formData =
        new FormData(bookingForm);

      const name = cleanText(
        formData.get("name")
      );

      const phone = cleanText(
        formData.get("phone")
      );

      const vehicleYear = cleanText(
        formData.get("vehicleYear")
      );

      const vehicleMake = cleanText(
        formData.get("vehicleMake")
      );

      const vehicleModel = cleanText(
        formData.get("vehicleModel")
      );

      const vehicleType = cleanText(
        formData.get("vehicleType")
      );

      const servicePackage = cleanText(
        formData.get("servicePackage")
      );

      const date = cleanText(
        formData.get("preferredDate")
      );

      const timeWindow = cleanText(
        formData.get("preferredWindow")
      );

      const details = cleanText(
        formData.get("details")
      );

      const issues =
        formData.getAll("issues");

      const issueList =
        issues.length > 0
          ? issues.join(", ")
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
        `Package: ${servicePackage}`,
        `Preferred date: ${formatDate(date)}`,
        `Preferred time: ${timeWindow}`,
        "",
        `Interior concerns: ${issueList}`,
        "",
        "Additional details:",
        details,
        "",
        "I understand this is a booking request and is not confirmed until TopNotch DetailLab approves the date, service, and final price."
      ].join("\n");


      showFormStatus(
        bookingStatus,
        `Your booking request is ready. Your Messages app should open with the details prepared for ${businessPhoneDisplay}. Tap Send to finish.`,
        "success"
      );


      setTimeout(() => {
        openTextMessage(bookingMessage);
      }, 450);
    }
  );
}


/* =========================================================
   12. REVIEW FORM
========================================================= */

if (reviewForm) {
  reviewForm.addEventListener(
    "input",
    () => {
      clearFormStatus(reviewStatus);
    }
  );


  reviewForm.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      clearFormStatus(reviewStatus);

      if (!reviewForm.checkValidity()) {
        reviewForm.reportValidity();

        showFormStatus(
          reviewStatus,
          "Please complete your name, service, star rating, review, and permission checkbox.",
          "error"
        );

        return;
      }


      const formData =
        new FormData(reviewForm);

      const customerName = cleanText(
        formData.get("reviewName")
      );

      const service = cleanText(
        formData.get("reviewService")
      );

      const rating = cleanText(
        formData.get("rating")
      );

      const reviewMessage = cleanText(
        formData.get("reviewMessage")
      );


      const stars =
        "★".repeat(Number(rating)) +
        "☆".repeat(5 - Number(rating));


      const preparedReview = [
        "TOPNOTCH DETAILLAB CUSTOMER REVIEW",
        "",
        `Customer: ${customerName}`,
        `Service: ${service}`,
        `Rating: ${rating}/5 ${stars}`,
        "",
        "Review:",
        reviewMessage,
        "",
        "I give TopNotch DetailLab permission to contact me and feature this honest review on its website or social media."
      ].join("\n");


      showFormStatus(
        reviewStatus,
        `Your review is ready. Your Messages app should open with the review prepared for ${businessPhoneDisplay}. Tap Send to submit it.`,
        "success"
      );


      setTimeout(() => {
        openTextMessage(preparedReview);
      }, 450);
    }
  );
}


/* =========================================================
   13. BACK TO TOP BUTTON
========================================================= */

function updateBackToTopButton() {
  if (!backToTopButton) {
    return;
  }

  if (window.scrollY > 650) {
    backToTopButton.classList.add(
      "visible"
    );
  } else {
    backToTopButton.classList.remove(
      "visible"
    );
  }
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
        behavior: "smooth"
      });
    }
  );
}

updateBackToTopButton();


/* =========================================================
   14. SMOOTH INTERNAL LINKS
========================================================= */

document.querySelectorAll(
  'a[href^="#"]'
).forEach((link) => {
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
        behavior: "smooth",
        block: "start"
      });

      history.replaceState(
        null,
        "",
        targetID
      );
    }
  );
});


/* =========================================================
   15. PROTECT AGAINST DOUBLE SUBMISSIONS
========================================================= */

document.querySelectorAll("form").forEach(
  (form) => {
    let submitting = false;

    form.addEventListener(
      "submit",
      () => {
        if (submitting) {
          return;
        }

        submitting = true;

        const submitButton =
          form.querySelector(
            'button[type="submit"]'
          );

        if (submitButton) {
          const originalText =
            submitButton.textContent;

          submitButton.disabled = true;
          submitButton.textContent =
            "Preparing Message...";

          setTimeout(() => {
            submitButton.disabled = false;
            submitButton.textContent =
              originalText;

            submitting = false;
          }, 1800);
        } else {
          submitting = false;
        }
      }
    );
  }
);


/* =========================================================
   16. INITIAL PAGE STATE
========================================================= */

window.addEventListener("load", () => {
  document.body.classList.add(
    "page-loaded"
  );

  updateHeaderState();
  updateBackToTopButton();
});

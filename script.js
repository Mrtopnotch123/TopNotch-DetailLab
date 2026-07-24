/* =========================================================
   TOPNOTCH DETAIL LAB
   FINAL MATCHING JAVASCRIPT
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       1. BUSINESS SETTINGS
       ===================================================== */

    const BUSINESS_PHONE_DISPLAY = "317-790-1060";
    const BUSINESS_PHONE_SMS = "+13177901060";

    const packagePrices = {
        "Quick Clean": {
            car: 35,
            suv: 45,
            xl: 55
        },

        "Refresh": {
            car: 70,
            suv: 85,
            xl: 100
        },

        "Deep Clean": {
            car: 120,
            suv: 145,
            xl: 165
        },

        "Restoration": {
            car: 180,
            suv: 210,
            xl: 240
        },

        "Recovery": {
            car: 275,
            suv: 275,
            xl: 275
        }
    };

    const vehicleLabels = {
        car: "Car, Coupe or Sedan",
        suv: "SUV, Crossover or Standard Truck",
        xl: "3-Row SUV, Van or Large Truck"
    };


    /* =====================================================
       2. HELPER FUNCTIONS
       ===================================================== */

    const getElement = (id) => document.getElementById(id);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0
        }).format(amount);
    };

    const smoothScrollTo = (target) => {
        if (!target) {
            return;
        }

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    };

    const openSmsMessage = (message) => {
        const encodedMessage = encodeURIComponent(message);
        const smsLink = `sms:${BUSINESS_PHONE_SMS}?&body=${encodedMessage}`;

        window.location.href = smsLink;
    };

    const escapeText = (value) => {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    };


    /* =====================================================
       3. CURRENT YEAR
       ===================================================== */

    const currentYear = getElement("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    /* =====================================================
       4. HEADER SCROLL EFFECT
       ===================================================== */

    const siteHeader = getElement("siteHeader");

    const updateHeaderState = () => {
        if (!siteHeader) {
            return;
        }

        if (window.scrollY > 24) {
            siteHeader.classList.add("scrolled");
        } else {
            siteHeader.classList.remove("scrolled");
        }
    };

    updateHeaderState();

    window.addEventListener("scroll", updateHeaderState, {
        passive: true
    });


    /* =====================================================
       5. MOBILE NAVIGATION
       ===================================================== */

    const mobileMenuButton = getElement("mobileMenuButton");
    const navigationMenu = getElement("navigationMenu");

    const closeMobileMenu = () => {
        if (!mobileMenuButton || !navigationMenu) {
            return;
        }

        mobileMenuButton.classList.remove("is-open");
        navigationMenu.classList.remove("is-open");
        document.body.classList.remove("menu-open");

        mobileMenuButton.setAttribute("aria-expanded", "false");
        mobileMenuButton.setAttribute(
            "aria-label",
            "Open navigation menu"
        );
    };

    const openMobileMenu = () => {
        if (!mobileMenuButton || !navigationMenu) {
            return;
        }

        mobileMenuButton.classList.add("is-open");
        navigationMenu.classList.add("is-open");
        document.body.classList.add("menu-open");

        mobileMenuButton.setAttribute("aria-expanded", "true");
        mobileMenuButton.setAttribute(
            "aria-label",
            "Close navigation menu"
        );
    };

    if (mobileMenuButton && navigationMenu) {
        mobileMenuButton.addEventListener("click", () => {
            const menuIsOpen =
                mobileMenuButton.classList.contains("is-open");

            if (menuIsOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });

        navigationMenu.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeMobileMenu);
        });

        document.addEventListener("click", (event) => {
            const clickedInsideMenu =
                navigationMenu.contains(event.target);

            const clickedMenuButton =
                mobileMenuButton.contains(event.target);

            if (!clickedInsideMenu && !clickedMenuButton) {
                closeMobileMenu();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeMobileMenu();
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 900) {
                closeMobileMenu();
            }
        });
    }


    /* =====================================================
       6. SMOOTH ANCHOR NAVIGATION
       ===================================================== */

    const internalLinks = document.querySelectorAll(
        'a[href^="#"]:not([href="#"])'
    );

    internalLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const targetId = link.getAttribute("href");

            if (!targetId) {
                return;
            }

            const targetElement = document.querySelector(targetId);

            if (!targetElement) {
                return;
            }

            event.preventDefault();
            smoothScrollTo(targetElement);

            history.replaceState(null, "", targetId);
        });
    });


    /* =====================================================
       7. ACTIVE NAVIGATION LINK
       ===================================================== */

    const navigationLinks = navigationMenu
        ? Array.from(navigationMenu.querySelectorAll('a[href^="#"]'))
        : [];

    const observedSections = navigationLinks
        .map((link) => {
            const sectionId = link.getAttribute("href");

            if (!sectionId) {
                return null;
            }

            return document.querySelector(sectionId);
        })
        .filter(Boolean);

    const updateActiveNavigation = () => {
        if (observedSections.length === 0) {
            return;
        }

        const scrollPosition = window.scrollY + 180;
        let activeSectionId = "";

        observedSections.forEach((section) => {
            if (section.offsetTop <= scrollPosition) {
                activeSectionId = `#${section.id}`;
            }
        });

        navigationLinks.forEach((link) => {
            const linkTarget = link.getAttribute("href");

            link.classList.toggle(
                "active",
                linkTarget === activeSectionId
            );
        });
    };

    updateActiveNavigation();

    window.addEventListener("scroll", updateActiveNavigation, {
        passive: true
    });


    /* =====================================================
       8. SCROLL REVEAL ANIMATIONS
       ===================================================== */

    const revealElements = document.querySelectorAll(".reveal");

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
                rootMargin: "0px 0px -40px 0px"
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


    /* =====================================================
       9. PACKAGE SELECTION BUTTONS
       ===================================================== */

    const choosePackageButtons =
        document.querySelectorAll(".choose-package");

    const bookingPackage = getElement("bookingPackage");
    const bookingSection = getElement("booking");

    choosePackageButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const selectedPackage = button.dataset.package;

            if (!selectedPackage) {
                return;
            }

            if (bookingPackage) {
                bookingPackage.value = selectedPackage;
            }

            if (bookingSection) {
                smoothScrollTo(bookingSection);
            }
        });
    });


    /* =====================================================
       10. PACKAGE FINDER
       ===================================================== */

    const packageFinderForm = getElement("packageFinderForm");
    const finderCondition = getElement("finderCondition");
    const finderLastDetail = getElement("finderLastDetail");
    const finderResult = getElement("finderResult");

    const getSelectedFinderIssues = () => {
        return Array.from(
            document.querySelectorAll(
                'input[name="finderIssue"]:checked'
            )
        ).map((input) => input.value);
    };

    const recommendPackage = (
        condition,
        issues,
        lastDetail
    ) => {
        let score = 0;

        const conditionScores = {
            light: 0,
            average: 2,
            dirty: 5,
            severe: 9
        };

        score += conditionScores[condition] || 0;

        if (issues.includes("stains")) {
            score += 2;
        }

        if (issues.includes("pet")) {
            score += 3;
        }

        if (issues.includes("odor")) {
            score += 3;
        }

        if (issues.includes("trash")) {
            score += 3;
        }

        if (lastDetail === "year") {
            score += 1;
        }

        if (lastDetail === "long") {
            score += 3;
        }

        if (
            condition === "severe" ||
            score >= 13
        ) {
            return {
                name: "Recovery",
                message:
                    "Your vehicle may need a customized severe-condition service. A photo review is required before the appointment and final price are confirmed."
            };
        }

        if (
            score >= 9 ||
            (
                condition === "dirty" &&
                issues.length >= 2
            )
        ) {
            return {
                name: "Restoration",
                message:
                    "Your selections indicate staining, buildup, pet hair, odor or overdue cleaning that may require extraction and extended labor."
            };
        }

        if (
            score >= 4 ||
            condition === "dirty"
        ) {
            return {
                name: "Deep Clean",
                message:
                    "A full interior reset is the most realistic starting point for the condition you selected."
            };
        }

        if (
            score >= 1 ||
            condition === "average"
        ) {
            return {
                name: "Refresh",
                message:
                    "Your interior sounds like a good fit for a thorough maintenance cleaning."
            };
        }

        return {
            name: "Quick Clean",
            message:
                "Your interior sounds lightly soiled and maintained, making the time-limited Quick Clean a reasonable starting point."
        };
    };

    if (
        packageFinderForm &&
        finderCondition &&
        finderLastDetail &&
        finderResult
    ) {
        packageFinderForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const condition = finderCondition.value;
            const lastDetail = finderLastDetail.value;
            const issues = getSelectedFinderIssues();

            if (!condition) {
                finderResult.classList.add("is-visible");

                finderResult.innerHTML = `
                    <strong>Select a Condition</strong>
                    <p>
                        Choose the option that most closely describes
                        the current interior.
                    </p>
                `;

                finderCondition.focus();
                return;
            }

            const recommendation = recommendPackage(
                condition,
                issues,
                lastDetail
            );

            finderResult.innerHTML = `
                <strong>${escapeText(recommendation.name)}</strong>

                <p>
                    ${escapeText(recommendation.message)}
                </p>

                <button
                    class="button button-primary button-full"
                    id="useFinderRecommendation"
                    type="button"
                >
                    Choose ${escapeText(recommendation.name)}
                </button>
            `;

            finderResult.classList.add("is-visible");

            const useRecommendationButton =
                getElement("useFinderRecommendation");

            if (useRecommendationButton) {
                useRecommendationButton.addEventListener(
                    "click",
                    () => {
                        if (bookingPackage) {
                            bookingPackage.value =
                                recommendation.name;
                        }

                        const servicePackage =
                            getElement("servicePackage");

                        if (servicePackage) {
                            servicePackage.value =
                                recommendation.name;

                            servicePackage.dispatchEvent(
                                new Event("change")
                            );
                        }

                        if (bookingSection) {
                            smoothScrollTo(bookingSection);
                        }
                    }
                );
            }
        });
    }


    /* =====================================================
       11. LIVE PRICE CALCULATOR
       ===================================================== */

    const estimateCalculator = getElement("estimateCalculator");
    const vehicleSize = getElement("vehicleSize");
    const servicePackage = getElement("servicePackage");
    const estimateTotal = getElement("estimateTotal");
    const estimateDescription =
        getElement("estimateDescription");
    const estimateLineItems = getElement("estimateLineItems");
    const estimateNotice = getElement("estimateNotice");
    const resetEstimate = getElement("resetEstimate");
    const bookEstimate = getElement("bookEstimate");
    const bookingEstimate = getElement("bookingEstimate");

    let currentEstimate = {
        packageName: "Deep Clean",
        vehicleSize: "car",
        vehicleLabel: vehicleLabels.car,
        basePrice: 120,
        addOns: [],
        total: 120,
        requiresQuote: false
    };

    const getCheckedAddOns = () => {
        if (!estimateCalculator) {
            return [];
        }

        return Array.from(
            estimateCalculator.querySelectorAll(
                '.addon-option input[type="checkbox"]:checked'
            )
        ).map((input) => {
            return {
                name: input.dataset.name || "Additional service",
                price: Number(input.dataset.price) || 0
            };
        });
    };

    const renderEstimateLineItems = (
        basePrice,
        addOns,
        requiresQuote
    ) => {
        if (!estimateLineItems) {
            return;
        }

        const basePriceText = requiresQuote
            ? `${formatCurrency(basePrice)}+`
            : formatCurrency(basePrice);

        let lineItemsHtml = `
            <div class="estimate-line-item">
                <span>Base service</span>
                <strong>${basePriceText}</strong>
            </div>
        `;

        addOns.forEach((addOn) => {
            lineItemsHtml += `
                <div class="estimate-line-item">
                    <span>${escapeText(addOn.name)}</span>
                    <strong>+${formatCurrency(addOn.price)}</strong>
                </div>
            `;
        });

        estimateLineItems.innerHTML = lineItemsHtml;
    };

    const updateEstimate = () => {
        if (
            !vehicleSize ||
            !servicePackage ||
            !estimateTotal ||
            !estimateDescription
        ) {
            return;
        }

        const selectedVehicleSize = vehicleSize.value;
        const selectedPackage = servicePackage.value;

        const selectedPriceGroup =
            packagePrices[selectedPackage];

        if (!selectedPriceGroup) {
            return;
        }

        const basePrice =
            selectedPriceGroup[selectedVehicleSize];

        const addOns = getCheckedAddOns();

        const addOnTotal = addOns.reduce(
            (sum, addOn) => sum + addOn.price,
            0
        );

        const total = basePrice + addOnTotal;
        const requiresQuote = selectedPackage === "Recovery";

        currentEstimate = {
            packageName: selectedPackage,
            vehicleSize: selectedVehicleSize,
            vehicleLabel:
                vehicleLabels[selectedVehicleSize] ||
                "Selected Vehicle",
            basePrice,
            addOns,
            total,
            requiresQuote
        };

        estimateTotal.textContent = requiresQuote
            ? `${formatCurrency(total)}+`
            : formatCurrency(total);

        estimateDescription.textContent =
            `${selectedPackage} · ${currentEstimate.vehicleLabel}`;

        renderEstimateLineItems(
            basePrice,
            addOns,
            requiresQuote
        );

        if (estimateNotice) {
            if (requiresQuote) {
                estimateNotice.textContent =
                    "Recovery pricing begins at the amount shown. Photos and a condition review are required before the final quote and appointment are confirmed.";
            } else if (
                selectedPackage === "Quick Clean"
            ) {
                estimateNotice.textContent =
                    "Quick Clean is only for lightly soiled, maintained interiors. Stains, heavy pet hair, odors, extraction or extended labor require an upgraded package.";
            } else {
                estimateNotice.textContent =
                    "Final pricing depends on actual vehicle size, condition and required labor. Severe conditions may require Restoration or Recovery.";
            }
        }

        if (bookingEstimate) {
            bookingEstimate.value =
                buildEstimateSummary(currentEstimate);
        }
    };

    const buildEstimateSummary = (estimate) => {
        const addOnNames = estimate.addOns.length > 0
            ? estimate.addOns
                .map((addOn) => addOn.name)
                .join(", ")
            : "None";

        const totalText = estimate.requiresQuote
            ? `${formatCurrency(estimate.total)}+`
            : formatCurrency(estimate.total);

        return [
            `${estimate.packageName}`,
            `${estimate.vehicleLabel}`,
            `Add-ons: ${addOnNames}`,
            `Estimated starting price: ${totalText}`
        ].join(" | ");
    };

    if (
        estimateCalculator &&
        vehicleSize &&
        servicePackage
    ) {
        estimateCalculator.addEventListener(
            "change",
            updateEstimate
        );

        estimateCalculator.addEventListener(
            "input",
            updateEstimate
        );
    }

    if (resetEstimate && estimateCalculator) {
        resetEstimate.addEventListener("click", () => {
            estimateCalculator.reset();

            if (vehicleSize) {
                vehicleSize.value = "car";
            }

            if (servicePackage) {
                servicePackage.value = "Deep Clean";
            }

            updateEstimate();
        });
    }

    if (bookEstimate) {
        bookEstimate.addEventListener("click", () => {
            if (bookingPackage) {
                bookingPackage.value =
                    currentEstimate.packageName;
            }

            if (bookingEstimate) {
                bookingEstimate.value =
                    buildEstimateSummary(currentEstimate);
            }

            if (bookingSection) {
                smoothScrollTo(bookingSection);
            }
        });
    }

    updateEstimate();


    /* =====================================================
       12. BEFORE AND AFTER SLIDER
       ===================================================== */

    const comparisonSlider = getElement("comparisonSlider");
    const beforePhotoLayer = getElement("beforePhotoLayer");
    const comparisonDivider =
        getElement("comparisonDivider");

    const updateComparisonSlider = () => {
        if (
            !comparisonSlider ||
            !beforePhotoLayer ||
            !comparisonDivider
        ) {
            return;
        }

        const sliderValue = Number(comparisonSlider.value);

        beforePhotoLayer.style.width = `${sliderValue}%`;
        comparisonDivider.style.left = `${sliderValue}%`;
    };

    if (
        comparisonSlider &&
        beforePhotoLayer &&
        comparisonDivider
    ) {
        comparisonSlider.addEventListener(
            "input",
            updateComparisonSlider
        );

        comparisonSlider.addEventListener(
            "change",
            updateComparisonSlider
        );

        updateComparisonSlider();
    }


    /* =====================================================
       13. FAQ ACCORDION
       ===================================================== */

    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach((item) => {
        const questionButton = item.querySelector("button");

        if (!questionButton) {
            return;
        }

        questionButton.addEventListener("click", () => {
            const itemIsOpen =
                item.classList.contains("is-open");

            faqItems.forEach((otherItem) => {
                const otherButton =
                    otherItem.querySelector("button");

                otherItem.classList.remove("is-open");

                if (otherButton) {
                    otherButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );
                }
            });

            if (!itemIsOpen) {
                item.classList.add("is-open");

                questionButton.setAttribute(
                    "aria-expanded",
                    "true"
                );
            }
        });
    });


    /* =====================================================
       14. BOOKING DATE RESTRICTION
       ===================================================== */

    const preferredDate = getElement("preferredDate");

    if (preferredDate) {
        const today = new Date();

        const localYear = today.getFullYear();
        const localMonth = String(
            today.getMonth() + 1
        ).padStart(2, "0");
        const localDay = String(
            today.getDate()
        ).padStart(2, "0");

        preferredDate.min =
            `${localYear}-${localMonth}-${localDay}`;
    }


    /* =====================================================
       15. BOOKING FORM
       ===================================================== */

    const bookingForm = getElement("bookingForm");
    const customerName = getElement("customerName");
    const customerPhone = getElement("customerPhone");
    const customerVehicle = getElement("customerVehicle");
    const serviceLocation = getElement("serviceLocation");
    const vehicleCondition = getElement("vehicleCondition");
    const bookingConsent = getElement("bookingConsent");
    const bookingStatus = getElement("bookingStatus");

    const showBookingStatus = (message, type) => {
        if (!bookingStatus) {
            return;
        }

        bookingStatus.textContent = message;
        bookingStatus.className =
            `form-status is-visible ${type}`;
    };

    const clearBookingStatus = () => {
        if (!bookingStatus) {
            return;
        }

        bookingStatus.textContent = "";
        bookingStatus.className = "form-status";
    };

    const phoneLooksValid = (phone) => {
        const digits = phone.replace(/\D/g, "");

        return digits.length >= 10;
    };

    if (bookingForm) {
        bookingForm.addEventListener("input", clearBookingStatus);

        bookingForm.addEventListener("submit", (event) => {
            event.preventDefault();
            clearBookingStatus();

            if (!bookingForm.checkValidity()) {
                showBookingStatus(
                    "Please complete every required field before sending your request.",
                    "error"
                );

                bookingForm.reportValidity();
                return;
            }

            if (
                !customerPhone ||
                !phoneLooksValid(customerPhone.value)
            ) {
                showBookingStatus(
                    "Please enter a complete phone number with at least 10 digits.",
                    "error"
                );

                if (customerPhone) {
                    customerPhone.focus();
                }

                return;
            }

            if (
                preferredDate &&
                preferredDate.value &&
                preferredDate.min &&
                preferredDate.value < preferredDate.min
            ) {
                showBookingStatus(
                    "Please choose today or a future appointment date.",
                    "error"
                );

                preferredDate.focus();
                return;
            }

            if (
                !bookingConsent ||
                !bookingConsent.checked
            ) {
                showBookingStatus(
                    "Please confirm that you understand this is an appointment request.",
                    "error"
                );

                if (bookingConsent) {
                    bookingConsent.focus();
                }

                return;
            }

            const selectedPackage =
                bookingPackage && bookingPackage.value
                    ? bookingPackage.value
                    : "Not selected";

            const estimateInformation =
                bookingEstimate &&
                bookingEstimate.value.trim()
                    ? bookingEstimate.value.trim()
                    : "No calculator estimate selected";

            const messageLines = [
                "Hi TopNotch Detail Lab, I would like to request an interior detailing appointment.",
                "",
                `Name: ${customerName ? customerName.value.trim() : ""}`,
                `Phone: ${customerPhone ? customerPhone.value.trim() : ""}`,
                `Vehicle: ${customerVehicle ? customerVehicle.value.trim() : ""}`,
                `Package: ${selectedPackage}`,
                `Preferred date: ${preferredDate ? preferredDate.value : ""}`,
                `Service area: ${serviceLocation ? serviceLocation.value.trim() : ""}`,
                "",
                `Vehicle condition and concerns: ${
                    vehicleCondition &&
                    vehicleCondition.value.trim()
                        ? vehicleCondition.value.trim()
                        : "None provided"
                }`,
                "",
                `Website estimate: ${estimateInformation}`,
                "",
                "I understand that the appointment and final price must be confirmed before service begins."
            ];

            const bookingMessage = messageLines.join("\n");

            showBookingStatus(
                `Your text message is ready. If your messaging app does not open automatically, text ${BUSINESS_PHONE_DISPLAY}.`,
                "success"
            );

            window.setTimeout(() => {
                openSmsMessage(bookingMessage);
            }, 250);
        });
    }


    /* =====================================================
       16. BACK TO TOP BUTTON
       ===================================================== */

    const backToTop = getElement("backToTop");

    const updateBackToTopVisibility = () => {
        if (!backToTop) {
            return;
        }

        backToTop.classList.toggle(
            "is-visible",
            window.scrollY > 650
        );
    };

    updateBackToTopVisibility();

    window.addEventListener(
        "scroll",
        updateBackToTopVisibility,
        {
            passive: true
        }
    );

    if (backToTop) {
        backToTop.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }


    /* =====================================================
       17. KEYBOARD SUPPORT FOR ESCAPE
       ===================================================== */

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }

        faqItems.forEach((item) => {
            const questionButton = item.querySelector("button");

            item.classList.remove("is-open");

            if (questionButton) {
                questionButton.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        });
    });


    /* =====================================================
       18. INITIAL PAGE HASH HANDLING
       ===================================================== */

    if (window.location.hash) {
        const initialTarget =
            document.querySelector(window.location.hash);

        if (initialTarget) {
            window.setTimeout(() => {
                initialTarget.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }, 350);
        }
    }

});

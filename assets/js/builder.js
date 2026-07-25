(() => {
  "use strict";

  const $ = (selector, scope = document) =>
    scope.querySelector(selector);

  const $$ = (selector, scope = document) =>
    [...scope.querySelectorAll(selector)];

  const form = $("#builderForm");
  const totalEl = $("#builderTotal");
  const messageEl = $("#builderMessage");
  const listEl = $("#selectedServices");
  const recommendationEl =
    $("#bundleRecommendation");
  const applyPresetBtn =
    $("#applyRecommendedPreset");
  const continueBtn = $("#continueBooking");
  const resetBtn = $("#resetBuilder");
  const materialSelect =
    $("#interiorMaterial");

  const inputs = $$(
    'input[type="checkbox"]',
    form
  );

  const PRESETS = {
    "Quick Reset": {
      price: 40,
      services: [
        "Interior Vacuum",
        "Light Surface Wipe-Down"
      ]
    },

    "Full Reset": {
      price: 75,
      services: [
        "Interior Vacuum",
        "Thorough Interior-Surface Cleaning",
        "Interior Glass",
        "Interior Finish & UV Protection"
      ]
    },

    "Deep Reset": {
      price: 150,
      services: [
        "Interior Vacuum",
        "Thorough Interior-Surface Cleaning",
        "Interior Glass",
        "Cargo-Area Cleaning",
        "Air Blowout, Vents & Crevices",
        "Door-Jamb Cleaning",
        "Interior Finish & UV Protection"
      ]
    }
  };

  let recommendedPreset = null;
  let displayedTotal = 40;

  function selectedInputs() {
    return inputs.filter(
      (input) => input.checked
    );
  }

  function sameGroup(input) {
    return input.dataset.group
      ? inputs.filter(
          (other) =>
            other !== input &&
            other.dataset.group ===
              input.dataset.group
        )
      : [];
  }

  function getCleaningSelection() {
    return inputs.find(
      (input) =>
        input.checked &&
        [
          "Light Surface Wipe-Down",
          "Thorough Interior-Surface Cleaning",
          "Full Carpet Extraction",
          "Full Cloth-Seat Extraction"
        ].includes(input.dataset.service)
    );
  }

  function ensureThoroughCleaning() {
    const thorough = inputs.find(
      (input) =>
        input.dataset.service ===
        "Thorough Interior-Surface Cleaning"
    );

    const light = inputs.find(
      (input) =>
        input.dataset.service ===
        "Light Surface Wipe-Down"
    );

    if (thorough) {
      thorough.checked = true;
    }

    if (light) {
      light.checked = false;
    }
  }

  function enforceRules(changed) {
    if (!changed.checked) {
      return;
    }

    sameGroup(changed).forEach(
      (other) => {
        other.checked = false;
      }
    );

    if (
      changed.dataset.requires ===
      "surface-cleaning"
    ) {
      ensureThoroughCleaning();
    }

    if (
      changed.dataset.requires ===
        "odor-cleaning" &&
      !getCleaningSelection()
    ) {
      ensureThoroughCleaning();
    }

    if (
      changed.dataset.service ===
      "Leather Cleaning & Conditioning"
    ) {
      const material =
        materialSelect?.value || "";

      if (
        !["leather", "mixed"].includes(
          material
        )
      ) {
        changed.checked = false;

        alert(
          "Leather Cleaning & Conditioning is only available for eligible leather or mixed-material interiors. Choose the interior material first."
        );

        materialSelect?.focus();
        return;
      }
    }

    if (
      changed.dataset.service ===
        "Full Carpet Extraction" ||
      changed.dataset.service ===
        "Full Cloth-Seat Extraction"
    ) {
      inputs
        .filter((input) =>
          [
            "One Localized Extraction Area",
            "Two Localized Extraction Areas"
          ].includes(input.dataset.service)
        )
        .forEach((input) => {
          input.checked = false;
        });
    }
  }

  function getState() {
    const chosen = selectedInputs();

    return {
      services: chosen
        .filter(
          (input) =>
            input.dataset.service
        )
        .map((input) => ({
          name: input.dataset.service,
          price: Number(
            input.dataset.price || 0
          )
        })),

      assessments: chosen
        .filter(
          (input) =>
            input.dataset.assessment
        )
        .map(
          (input) =>
            input.dataset.assessment
        ),

      material:
        materialSelect?.value || ""
    };
  }

  function getPresetCoverage(
    serviceNames
  ) {
    return (
      Object.entries(PRESETS)
        .filter(([, preset]) =>
          serviceNames.every((name) =>
            preset.services.includes(name)
          )
        )
        .sort(
          (a, b) =>
            a[1].price - b[1].price
        )[0] || null
    );
  }
    function animateTotal(
    target,
    suffix = ""
  ) {
    if (!totalEl) {
      return;
    }

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    const start = displayedTotal;

    displayedTotal = target;

    if (
      reducedMotion ||
      start === target
    ) {
      totalEl.textContent =
        `$${target}${suffix}`;

      totalEl.classList.add(
        "total-updated"
      );

      window.setTimeout(
        () => {
          totalEl.classList.remove(
            "total-updated"
          );
        },
        350
      );

      return;
    }

    const duration = 420;
    const started =
      window.performance.now();

    function frame(now) {
      const progress = Math.min(
        1,
        (now - started) / duration
      );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        );

      const value = Math.round(
        start +
        (target - start) * eased
      );

      totalEl.textContent =
        `$${value}${
          progress === 1
            ? suffix
            : ""
        }`;

      if (progress < 1) {
        window.requestAnimationFrame(
          frame
        );
      } else {
        totalEl.classList.add(
          "total-updated"
        );

        window.setTimeout(
          () => {
            totalEl.classList.remove(
              "total-updated"
            );
          },
          350
        );
      }
    }

    window.requestAnimationFrame(
      frame
    );
  }

  function refreshOptionStates() {
    inputs.forEach((input) => {
      input
        .closest(".service-option")
        ?.classList.toggle(
          "selected",
          input.checked
        );
    });
  }

  function update() {
    const state = getState();

    const {
      services,
      assessments
    } = state;

    refreshOptionStates();

    const entries = [
      ...services.map(
        (service) =>
          `${service.name} — $${service.price}`
      ),

      ...assessments.map(
        (item) =>
          `${item} — Assessment required`
      )
    ];

    listEl.replaceChildren(
      ...entries.map((text) => {
        const item =
          document.createElement("li");

        item.textContent = text;

        return item;
      })
    );

    sessionStorage.setItem(
      "topnotchBuilderDraft",
      JSON.stringify(state)
    );

    recommendedPreset = null;

    applyPresetBtn?.classList.add(
      "hidden"
    );

    if (
      !services.length &&
      !assessments.length
    ) {
      animateTotal(
        40,
        " minimum"
      );

      messageEl.textContent =
        "Select services to build your custom Reset.";

      recommendationEl.classList.add(
        "hidden"
      );

      return;
    }

    if (assessments.length) {
      displayedTotal = 40;

      totalEl.textContent =
        "Assessment required";

      totalEl.classList.add(
        "assessment-active"
      );

      messageEl.textContent =
        `${assessments.join(
          ", "
        )} must be reviewed before pricing.`;

      recommendationEl.classList.add(
        "hidden"
      );

      return;
    }

    totalEl.classList.remove(
      "assessment-active"
    );

    const rawTotal =
      services.reduce(
        (sum, service) =>
          sum + service.price,
        0
      );

    const total =
      Math.max(
        40,
        rawTotal
      );

    animateTotal(
      total,
      rawTotal < 40
        ? " minimum"
        : ""
    );

    messageEl.textContent =
      rawTotal < 40
        ? `$${rawTotal} in selected work; the $40 mobile minimum applies.`
        : "Your starting estimate updates as you build.";

    const match =
      getPresetCoverage(
        services.map(
          (service) =>
            service.name
        )
      );

    if (
      match &&
      match[1].price <= total &&
      services.length >= 2
    ) {
      recommendedPreset = {
        name: match[0],
        price: match[1].price
      };

      recommendationEl.innerHTML =
        `<strong>Better-value preset available</strong>` +
        `${match[0]} covers these selections from $${match[1].price}.`;

      recommendationEl.classList.remove(
        "hidden"
      );

      recommendationEl.classList.remove(
        "recommendation-pop"
      );

      void recommendationEl.offsetWidth;

      recommendationEl.classList.add(
        "recommendation-pop"
      );

      applyPresetBtn.textContent =
        `Choose ${match[0]}`;

      applyPresetBtn.classList.remove(
        "hidden"
      );
    } else {
      recommendationEl.classList.add(
        "hidden"
      );
    }
  }

  function replaceCustomSelectionWithPreset(
    name,
    price
  ) {
    const existing =
      sessionStorage.getItem(
        "topnotchSelection"
      );

    if (existing) {
      try {
        const parsed =
          JSON.parse(existing);

        const isCustom =
          parsed?.mode === "custom" ||
          parsed?.mode ===
            "assessment";

        if (
          isCustom &&
          !window.confirm(
            `Switching to ${name} will replace your current custom selection. Continue?`
          )
        ) {
          return false;
        }
      } catch {
        // Ignore invalid saved data.
      }
    }

    sessionStorage.setItem(
      "topnotchSelection",
      JSON.stringify({
        mode: "preset",
        package: name,
        price,
        services: [],
        assessmentRequired: false
      })
    );

    return true;
  }
    inputs.forEach((input) => {
    input.addEventListener(
      "change",
      () => {
        enforceRules(input);
        update();
      }
    );
  });

  materialSelect?.addEventListener(
    "change",
    update
  );

  applyPresetBtn?.addEventListener(
    "click",
    () => {
      if (!recommendedPreset) {
        return;
      }

      if (
        replaceCustomSelectionWithPreset(
          recommendedPreset.name,
          recommendedPreset.price
        )
      ) {
        window.location.href =
          "../book/";
      }
    }
  );

  continueBtn?.addEventListener(
    "click",
    () => {
      const state = getState();

      if (
        !state.services.length &&
        !state.assessments.length
      ) {
        alert(
          "Select at least one service before continuing."
        );
        return;
      }

      if (
        state.assessments.length
      ) {
        sessionStorage.setItem(
          "topnotchSelection",
          JSON.stringify({
            mode: "assessment",
            package: "Recovery Assessment",
            price: null,
            services:
              state.assessments,
            assessmentRequired: true
          })
        );

        window.location.href =
          "../book/";
        return;
      }

      const total = Math.max(
        40,
        state.services.reduce(
          (sum, service) =>
            sum + service.price,
          0
        )
      );

      sessionStorage.setItem(
        "topnotchSelection",
        JSON.stringify({
          mode: "custom",
          package:
            "Build Your Own Reset",
          price: total,
          services:
            state.services,
          assessmentRequired: false
        })
      );

      window.location.href =
        "../book/";
    }
  );

  resetBtn?.addEventListener(
    "click",
    () => {
      inputs.forEach(
        (input) => {
          input.checked = false;
        }
      );

      if (materialSelect) {
        materialSelect.selectedIndex = 0;
      }

      sessionStorage.removeItem(
        "topnotchBuilderDraft"
      );

      update();
    }
  );

  const savedDraft =
    sessionStorage.getItem(
      "topnotchBuilderDraft"
    );

  if (savedDraft) {
    try {
      const draft =
        JSON.parse(savedDraft);

      if (
        draft.material &&
        materialSelect
      ) {
        materialSelect.value =
          draft.material;
      }

      if (
        Array.isArray(
          draft.services
        )
      ) {
        draft.services.forEach(
          (service) => {
            const checkbox =
              inputs.find(
                (input) =>
                  input.dataset
                    .service ===
                  service.name
              );

            if (checkbox) {
              checkbox.checked = true;
            }
          }
        );
      }

      if (
        Array.isArray(
          draft.assessments
        )
      ) {
        draft.assessments.forEach(
          (assessment) => {
            const checkbox =
              inputs.find(
                (input) =>
                  input.dataset
                    .assessment ===
                  assessment
              );

            if (checkbox) {
              checkbox.checked = true;
            }
          }
        );
      }
    } catch {
      sessionStorage.removeItem(
        "topnotchBuilderDraft"
      );
    }
  }

  update();
})();

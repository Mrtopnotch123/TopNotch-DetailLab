(() => {
  "use strict";

  const packageFinder = document.querySelector("#packageFinder");
  const finderResult = document.querySelector("#finderResult");
  const finderAction = document.querySelector("#finderAction");

  let recommendation = "";

  function savePreset(packageName, packagePrice) {
    const existing = sessionStorage.getItem("topnotchSelection");

    if (existing) {
      try {
        const parsed = JSON.parse(existing);

        if (
          (parsed?.mode === "custom" ||
            parsed?.mode === "assessment") &&
          !window.confirm(
            `Switching to ${packageName} will replace your current custom selection. Continue?`
          )
        ) {
          return;
        }
      } catch {}
    }

    sessionStorage.setItem(
      "topnotchSelection",
      JSON.stringify({
        mode: "preset",
        package: packageName,
        price: packagePrice ? Number(packagePrice) : null,
        services: [],
        assessmentRequired: packageName === "Recovery"
      })
    );

    window.location.href = "../book/";
  }

  document.querySelectorAll(".preset-choice").forEach(button => {
    button.addEventListener("click", () => {
      savePreset(
        button.dataset.package || "",
        button.dataset.price || ""
      );
    });
  });

  packageFinder?.addEventListener("submit", event => {
    event.preventDefault();

    if (!packageFinder.checkValidity()) {
      packageFinder.reportValidity();
      return;
    }

    const condition =
      document.querySelector("#finderCondition")?.value || "";

    const special =
      document.querySelector("#finderSpecial")?.value || "";

    if (
      condition === "severe" ||
      special === "heavy"
    ) {
      recommendation = "Recovery";

      finderResult.innerHTML =
        "<strong>Recovery assessment fits best.</strong><br>Your answers indicate severe conditions that require photos and review before pricing.";
    } else if (
      condition === "deep" ||
      special === "some"
    ) {
      recommendation = "Deep Reset";

      finderResult.innerHTML =
        "<strong>Deep Reset fits best.</strong><br>Your interior needs detailed cleaning or material-specific care beyond routine service.";
    } else if (condition === "normal") {
      recommendation = "Full Reset";

      finderResult.innerHTML =
        "<strong>Full Reset fits best.</strong><br>Your vehicle sounds like it has normal everyday buildup and needs a complete interior cleaning.";
    } else {
      recommendation = "Quick Reset";

      finderResult.innerHTML =
        "<strong>Quick Reset fits best.</strong><br>Your maintained interior appears to need a vacuum and light surface refresh.";
    }

    finderAction.textContent =
      recommendation === "Recovery"
        ? "Request Recovery Assessment"
        : `Choose ${recommendation}`;

    finderAction.classList.remove("hidden");
  });

  finderAction?.addEventListener("click", () => {
    const prices = {
      "Quick Reset": 40,
      "Full Reset": 75,
      "Deep Reset": 150
    };

    savePreset(
      recommendation,
      prices[recommendation] ?? ""
    );
  });
})();

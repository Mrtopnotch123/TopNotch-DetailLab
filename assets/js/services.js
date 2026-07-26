document.addEventListener("DOMContentLoaded", () => {
  const finderCondition = document.getElementById("finderCondition");
  const finderSpecial = document.getElementById("finderSpecial");
  const finderAction = document.getElementById("finderAction");
  const finderResult = document.getElementById("finderResult");
  const presetButtons = document.querySelectorAll(".preset-choice");

  function recommendPackage(condition, special) {
    if (!condition) return "Please select an interior condition.";
    if (condition === "light" && (!special || special === "none")) return "Quick Reset is likely enough.";
    if (condition === "moderate" && (!special || special === "none")) return "Full Reset is recommended.";
    if (condition === "heavy" && (!special || special === "none")) return "Deep Reset is recommended.";
    if (condition === "severe" || special === "pet-hair" || special === "odor" || special === "staining") {
      return "Recovery assessment is required. Photos will be needed before pricing.";
    }
    return "Full Reset or Deep Reset may be appropriate. Consider your interior history and expectations.";
  }

  if (finderAction && finderCondition && finderSpecial && finderResult) {
    finderAction.addEventListener("click", () => {
      const condition = finderCondition.value;
      const special = finderSpecial.value;
      const message = recommendPackage(condition, special);
      finderResult.textContent = message;
    });
  }

  presetButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const preset = btn.getAttribute("data-preset");
      if (preset) {
        sessionStorage.setItem("tnSelectedPreset", preset);
        window.location.href = "/book/";
      }
    });
  });
});

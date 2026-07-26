document.addEventListener("DOMContentLoaded", () => {
  const builder = document.getElementById("builder");
  if (!builder) return;

  const checkboxes = builder.querySelectorAll("input[type='checkbox'][data-service]");
  const severitySelect = document.getElementById("builderSeverity");
  const totalEl = document.getElementById("builderTotal");
  const recommendationEl = document.getElementById("builderRecommendation");
  const toBookingBtn = document.getElementById("builderToBooking");

  function calculateTotal() {
    let total = 0;
    checkboxes.forEach(cb => {
      if (cb.checked) {
        const price = parseFloat(cb.getAttribute("data-price") || "0");
        total += price;
      }
    });
    if (total < 40) total = 40;
    if (totalEl) totalEl.textContent = `$${total}`;
    if (recommendationEl) {
      if (total >= 75 && total < 150) {
        recommendationEl.textContent = "Your custom build is close to Full Reset. Full Reset may offer better value.";
      } else if (total >= 150) {
        recommendationEl.textContent = "Your custom build is close to Deep Reset. Deep Reset may offer better value.";
      } else {
        recommendationEl.textContent = "";
      }
    }
  }

  checkboxes.forEach(cb => cb.addEventListener("change", calculateTotal));
  if (severitySelect) severitySelect.addEventListener("change", calculateTotal);
  calculateTotal();

  if (toBookingBtn) {
    toBookingBtn.addEventListener("click", () => {
      const selectedServices = [];
      checkboxes.forEach(cb => {
        if (cb.checked) selectedServices.push(cb.getAttribute("data-service"));
      });
      const severity = severitySelect ? severitySelect.value : "";
      const payload = { services: selectedServices, severity };
      sessionStorage.setItem("tnBuilderSelection", JSON.stringify(payload));
      window.location.href = "/book/";
    });
  }
});

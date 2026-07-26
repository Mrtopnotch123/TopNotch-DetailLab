document.addEventListener("DOMContentLoaded", () => {
  const bookingServiceEl = document.getElementById("bookingService");
  const bookingForm = document.getElementById("bookingForm");
  const bookingStatus = document.getElementById("bookingStatus");

  if (bookingServiceEl) {
    const preset = sessionStorage.getItem("tnSelectedPreset");
    const builderRaw = sessionStorage.getItem("tnBuilderSelection");
    if (preset) {
      bookingServiceEl.textContent = `Selected preset: ${preset}`;
    } else if (builderRaw) {
      try {
        const builder = JSON.parse(builderRaw);
        bookingServiceEl.textContent = `Custom build with ${builder.services.length} services (severity: ${builder.severity}).`;
      } catch {
        bookingServiceEl.textContent = "Custom build selected, but details could not be loaded.";
      }
    } else {
      bookingServiceEl.textContent = "No service selected yet. You can still describe your interior below.";
    }
  }

  if (bookingForm && bookingStatus) {
    bookingForm.addEventListener("submit", e => {
      e.preventDefault();
      const requiredIds = ["vehicleYear", "vehicleMake", "vehicleModel", "bookingCondition", "bookingName", "bookingEmail"];
      let valid = true;
      requiredIds.forEach(id => {
        const field = document.getElementById(id);
        if (!field || !field.value.trim()) valid = false;
      });
      if (!valid) {
        bookingStatus.textContent = "Please fill in all required fields before submitting.";
        return;
      }
      bookingStatus.textContent = "Your request has been submitted as pending. You will receive a response after review.";
    });
  }
});

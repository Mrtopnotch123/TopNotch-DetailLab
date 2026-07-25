(() => {
  "use strict";

  const $ = (selector) =>
    document.querySelector(selector);

  const title =
    $("#bookingSelectionTitle");

  const price =
    $("#bookingSelectionPrice");

  const items =
    $("#bookingSelectionItems");

  const photo =
    $("#photoRequirement");

  const form =
    $("#bookingForm");

  const status =
    $("#bookingStatus");

  const date =
    $("#preferredDate");

  const selection = (() => {
    try {
      return (
        JSON.parse(
          sessionStorage.getItem(
            "topnotchSelection"
          )
        ) || null
      );
    } catch {
      return null;
    }
  })();

  if (selection) {
    title.textContent =
      selection.package ||
      (
        selection.mode === "custom"
          ? "Build Your Own Reset"
          : "Selected service"
      );

    price.textContent =
      selection.assessmentRequired
        ? "Assessment required before pricing."
        : `Starting estimate: $${selection.price}`;

    const values =
      (
        selection.services || []
      ).map((service) =>
        typeof service === "string"
          ? service
          : service.name
      );

    items.replaceChildren(
      ...values.map((name) => {
        const item =
          document.createElement("li");

        item.textContent = name;

        return item;
      })
    );

    photo?.classList.toggle(
      "hidden",
      !selection.assessmentRequired
    );
  }

  if (date) {
    const now = new Date();

    date.min =
      new Date(
        now.getTime() -
        now.getTimezoneOffset() *
          60000
      )
        .toISOString()
        .split("T")[0];
  }
    form?.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      if (!selection) {
        status.textContent =
          "Please choose a preset or build a custom Reset first.";

        status.dataset.state =
          "error";

        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();

        status.textContent =
          "Please complete every required field.";

        status.dataset.state =
          "error";

        return;
      }

      const request = {
        selection,

        customer: {
          name:
            $("#customerName")
              .value
              .trim(),

          email:
            $("#customerEmail")
              .value
              .trim(),

          phone:
            $("#customerPhone")
              .value
              .trim()
        },

        vehicle: {
          year:
            $("#vehicleYear")
              .value
              .trim(),

          make:
            $("#vehicleMake")
              .value
              .trim(),

          model:
            $("#vehicleModel")
              .value
              .trim(),

          type:
            $("#vehicleType")
              .value
        },

        cityZip:
          $("#cityZip")
            .value
            .trim(),

        preferredDate:
          $("#preferredDate")
            .value,

        condition:
          $("#condition")
            .value,

        notes:
          $("#notes")
            .value
            .trim()
      };

      sessionStorage.setItem(
        "topnotchPendingRequest",
        JSON.stringify(request)
      );

      status.textContent =
        "Frontend test passed. Your request is ready for the secure booking system connection.";

      status.dataset.state =
        "success";

      form.classList.add(
        "booking-success"
      );

      status.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  );
})();

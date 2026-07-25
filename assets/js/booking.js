const STORAGE_SELECTION_KEY = 'topnotchSelection';
const STORAGE_PENDING_REQUEST = 'topnotchPendingRequest';

const bookingSelectionTitle = document.getElementById('bookingSelectionTitle');
const bookingSelectionPrice = document.getElementById('bookingSelectionPrice');
const bookingSelectionItems = document.getElementById('bookingSelectionItems');

const bookingForm = document.getElementById('bookingForm');
const customerName = document.getElementById('customerName');
const customerEmail = document.getElementById('customerEmail');
const customerPhone = document.getElementById('customerPhone');
const vehicleYear = document.getElementById('vehicleYear');
const vehicleMake = document.getElementById('vehicleMake');
const vehicleModel = document.getElementById('vehicleModel');
const vehicleType = document.getElementById('vehicleType');
const cityZip = document.getElementById('cityZip');
const preferredDate = document.getElementById('preferredDate');
const condition = document.getElementById('condition');
const notes = document.getElementById('notes');
const photoRequirement = document.getElementById('photoRequirement');
const bookingConsent = document.getElementById('bookingConsent');
const bookingStatus = document.getElementById('bookingStatus');

function loadSelection() {
  const selectionRaw = localStorage.getItem(STORAGE_SELECTION_KEY);
  if (!selectionRaw) {
    bookingSelectionTitle.textContent = 'No selection found.';
    bookingSelectionPrice.textContent = 'Select a preset or build your own before booking.';
    return;
  }

  const selection = JSON.parse(selectionRaw);
  bookingSelectionTitle.textContent = selection.name || 'Selected Service';
  bookingSelectionPrice.textContent =
    selection.price === 'Custom' ? 'Custom pricing after assessment.' : `Estimated from $${selection.price}`;

  bookingSelectionItems.innerHTML = '';
  if (Array.isArray(selection.items)) {
    selection.items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      bookingSelectionItems.appendChild(li);
    });
  }
}

function updatePhotoRequirement() {
  if (!photoRequirement) return;
  if (condition.value === 'recovery') {
    photoRequirement.textContent =
      'Recovery-level interiors require photos before approval. Please be prepared to provide clear interior photos.';
  } else {
    photoRequirement.textContent = '';
  }
}

if (condition) {
  condition.addEventListener('change', updatePhotoRequirement);
}

if (bookingForm) {
  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!bookingConsent.checked) {
      bookingStatus.textContent = 'You must agree to the pending request terms before submitting.';
      return;
    }

    const pendingRequest = {
      selection: JSON.parse(localStorage.getItem(STORAGE_SELECTION_KEY) || '{}'),
      customer: {
        name: customerName.value.trim(),
        email: customerEmail.value.trim(),
        phone: customerPhone.value.trim()
      },
      vehicle: {
        year: vehicleYear.value.trim(),
        make: vehicleMake.value.trim(),
        model: vehicleModel.value.trim(),
        type: vehicleType.value,
        cityZip: cityZip.value.trim()
      },
      scheduling: {
        preferredDate: preferredDate.value,
        condition: condition.value
      },
      notes: notes.value.trim(),
      status: 'pending'
    };

    // Validation basics
    if (!pendingRequest.customer.name || !pendingRequest.customer.email || !pendingRequest.vehicle.cityZip) {
      bookingStatus.textContent = 'Please complete all required fields before submitting.';
      return;
    }

    // Recovery photo requirement messaging
    if (pendingRequest.scheduling.condition === 'recovery') {
      bookingStatus.textContent =
        'Your Recovery-level request has been saved as pending. Photos will be required before approval.';
    } else {
      bookingStatus.textContent =
        'Your booking request has been saved as pending. You will receive confirmation after review when Supabase is implemented.';
    }

    localStorage.setItem(STORAGE_PENDING_REQUEST, JSON.stringify(pendingRequest));
  });
}

loadSelection();
updatePhotoRequirement();

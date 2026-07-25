const STORAGE_BUILDER_DRAFT = 'topnotchBuilderDraft';
const STORAGE_SELECTION_KEY = 'topnotchSelection';

const builderForm = document.getElementById('builderForm');
const interiorMaterial = document.getElementById('interiorMaterial');
const selectedServicesList = document.getElementById('selectedServices');
const builderTotalEl = document.getElementById('builderTotal');
const builderMessageEl = document.getElementById('builderMessage');
const bundleRecommendationEl = document.getElementById('bundleRecommendation');
const applyRecommendedPresetBtn = document.getElementById('applyRecommendedPreset');
const continueBookingBtn = document.getElementById('continueBooking');
const resetBuilderBtn = document.getElementById('resetBuilder');

let builderState = {
  material: '',
  services: [],
  total: 0,
  recommendedPreset: null
};

function loadDraft() {
  const draft = localStorage.getItem(STORAGE_BUILDER_DRAFT);
  if (!draft) return;
  try {
    const parsed = JSON.parse(draft);
    builderState = parsed;
    if (interiorMaterial) interiorMaterial.value = builderState.material || '';
    updateFormFromState();
    updateSummary();
  } catch (e) {
    console.warn('Invalid builder draft');
  }
}

function saveDraft() {
  localStorage.setItem(STORAGE_BUILDER_DRAFT, JSON.stringify(builderState));
}

function updateFormFromState() {
  if (!builderForm) return;
  const checkboxes = builderForm.querySelectorAll('input[type="checkbox"][data-service]');
  checkboxes.forEach((cb) => {
    cb.checked = builderState.services.some((s) => s.name === cb.dataset.service);
  });
}

function recalcTotal() {
  let total = 0;
  builderState.services.forEach((s) => {
    total += s.price;
  });
  if (total < 40 && builderState.services.length > 0) {
    total = 40; // $40 mobile minimum
  }
  builderState.total = total;
}

function applyRules() {
  // Full extraction replaces spot extraction
  const hasFullCarpet = builderState.services.some((s) => s.name === 'Full Carpet Extraction');
  const hasFullSeats = builderState.services.some((s) => s.name === 'Full Cloth Seat Extraction');

  if (hasFullCarpet || hasFullSeats) {
    builderState.services = builderState.services.filter(
      (s) => s.name !== 'One Spot Extraction' && s.name !== 'Two Spot Extractions'
    );
  }

  // UV Protection requires proper cleaning
  const hasUV = builderState.services.some((s) => s.name === 'Interior Finish & UV Protection');
  const hasThoroughCleaning = builderState.services.some((s) => s.name === 'Thorough Surface Cleaning');
  if (hasUV && !hasThoroughCleaning) {
    builderMessageEl.textContent =
      'Interior Finish & UV Protection requires Thorough Surface Cleaning. Consider adding it for best results.';
  } else {
    builderMessageEl.textContent = '';
  }

  // Leather service requires leather seating
  const hasLeatherService = builderState.services.some((s) => s.name === 'Leather Cleaning & Conditioning');
  if (hasLeatherService && interiorMaterial && interiorMaterial.value !== 'leather' && interiorMaterial.value !== 'mixed') {
    builderMessageEl.textContent =
      'Leather Cleaning & Conditioning requires leather or mixed seating. Adjust interior material or remove this service.';
  }

  // Heavy conditions require assessment (handled via Recovery messaging)
  const hasModeratePetHair = builderState.services.some((s) => s.name === 'Moderate Pet Hair');
  const hasLightOdor = builderState.services.some((s) => s.name === 'Light Odor Treatment');
  if (hasModeratePetHair || hasLightOdor) {
    bundleRecommendationEl.textContent =
      'Heavy pet hair, strong odor, or widespread staining may require Recovery Reset assessment and photos.';
  } else {
    bundleRecommendationEl.textContent = '';
  }

  // Suggest better preset when appropriate
  builderState.recommendedPreset = null;
  if (builderState.total >= 75 && builderState.total < 150) {
    builderState.recommendedPreset = 'Full Reset';
  } else if (builderState.total >= 150) {
    builderState.recommendedPreset = 'Deep Reset';
  }
}

function updateSummary() {
  if (!selectedServicesList || !builderTotalEl) return;
  selectedServicesList.innerHTML = '';
  builderState.services.forEach((s) => {
    const li = document.createElement('li');
    li.textContent = `${s.name} — $${s.price}`;
    selectedServicesList.appendChild(li);
  });

  builderTotalEl.textContent = `$${builderState.total}`;

  if (builderState.recommendedPreset) {
    bundleRecommendationEl.textContent =
      `Based on your custom build total, ${builderState.recommendedPreset} may be a better preset starting point.`;
  }
}

function handleCheckboxChange(event) {
  const cb = event.target;
  const name = cb.dataset.service;
  const price = Number(cb.dataset.price);

  if (cb.checked) {
    if (!builderState.services.some((s) => s.name === name)) {
      builderState.services.push({ name, price });
    }
  } else {
    builderState.services = builderState.services.filter((s) => s.name !== name);
  }

  recalcTotal();
  applyRules();
  updateSummary();
  saveDraft();
}

if (builderForm) {
  const checkboxes = builderForm.querySelectorAll('input[type="checkbox"][data-service]');
  checkboxes.forEach((cb) => cb.addEventListener('change', handleCheckboxChange));
}

if (interiorMaterial) {
  interiorMaterial.addEventListener('change', () => {
    builderState.material = interiorMaterial.value;
    applyRules();
    saveDraft();
  });
}

if (applyRecommendedPresetBtn) {
  applyRecommendedPresetBtn.addEventListener('click', () => {
    if (!builderState.recommendedPreset) {
      alert('No preset recommendation at this time. Adjust your build or continue to booking.');
      return;
    }
    const confirmReplace = window.confirm(
      `Apply ${builderState.recommendedPreset} as your selection and replace this custom build?`
    );
    if (!confirmReplace) return;

    const selection = {
      type: 'preset',
      name: builderState.recommendedPreset,
      price: builderState.recommendedPreset === 'Full Reset' ? '75' : '150',
      items: []
    };
    localStorage.setItem(STORAGE_SELECTION_KEY, JSON.stringify(selection));
    alert(`${builderState.recommendedPreset} has been saved as your current selection.`);
  });
}

if (continueBookingBtn) {
  continueBookingBtn.addEventListener('click', () => {
    const selection = {
      type: 'builder',
      name: 'Custom Build',
      price: builderState.total,
      items: builderState.services.map((s) => s.name)
    };
    localStorage.setItem(STORAGE_SELECTION_KEY, JSON.stringify(selection));
    localStorage.setItem(STORAGE_BUILDER_DRAFT, JSON.stringify(builderState));
    window.location.href = '/book/';
  });
}

if (resetBuilderBtn) {
  resetBuilderBtn.addEventListener('click', () => {
    const confirmReset = window.confirm('Reset builder and clear your custom build?');
    if (!confirmReset) return;
    builderState = { material: '', services: [], total: 0, recommendedPreset: null };
    if (interiorMaterial) interiorMaterial.value = '';
    updateFormFromState();
    recalcTotal();
    applyRules();
    updateSummary();
    localStorage.removeItem(STORAGE_BUILDER_DRAFT);
  });
}

loadDraft();
recalcTotal();
applyRules();
updateSummary();

const STORAGE_SELECTION_KEY = 'topnotchSelection';

const presetButtons = document.querySelectorAll('.preset-choice');
const continueBookingFromServices = document.getElementById('continueBookingFromServices');

presetButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const presetName = btn.dataset.preset;
    const price = btn.dataset.price;
    const items = [];

    if (presetName === 'Quick Reset') {
      items.push('Trash removal', 'Vacuum seats, carpets, floor mats', 'Light wipe-down', 'Final inspection');
    } else if (presetName === 'Full Reset') {
      items.push(
        'Everything in Quick Reset',
        'Thorough interior surface cleaning',
        'Interior glass cleaning',
        'Interior finish & UV protection',
        'Final finishing inspection'
      );
    } else if (presetName === 'Deep Reset') {
      items.push(
        'Everything in Full Reset',
        'Air blowout, vent & crevice detailing',
        'Door jamb & cargo area cleaning',
        'Cloth & carpet extraction when needed',
        'Leather cleaning & conditioning',
        'UV & finish protection'
      );
    } else if (presetName === 'Recovery Reset') {
      items.push(
        'Custom assessment',
        'Photos required',
        'No instant pricing',
        'Booking reviewed before approval',
        'Unsafe jobs declined'
      );
    }

    const existing = localStorage.getItem(STORAGE_SELECTION_KEY);
    if (existing) {
      const confirmReplace = window.confirm(
        'You already have a selection or custom build saved. Replace it with this preset?'
      );
      if (!confirmReplace) return;
    }

    const selection = {
      type: 'preset',
      name: presetName,
      price,
      items
    };

    localStorage.setItem(STORAGE_SELECTION_KEY, JSON.stringify(selection));
    alert(`Saved ${presetName} as your current selection. Continue to booking when ready.`);
  });
});

// Package Finder
const packageFinder = document.getElementById('packageFinder');
const finderCondition = document.getElementById('finderCondition');
const finderSpecial = document.getElementById('finderSpecial');
const finderResult = document.getElementById('finderResult');
const finderAction = document.getElementById('finderAction');

function updateFinder() {
  if (!packageFinder) return;
  const condition = finderCondition.value;
  const special = finderSpecial.value;

  let recommendation = '';
  let actionText = '';

  if (!condition) {
    finderResult.textContent = 'Select interior condition to see a recommendation.';
    finderAction.textContent = '';
    return;
  }

  if (condition === 'maintained') {
    recommendation = 'Quick Reset is a strong starting point for maintained interiors.';
    actionText = 'Select Quick Reset or build a light custom package.';
  } else if (condition === 'used') {
    recommendation = 'Full Reset is recommended for used interiors with moderate buildup.';
    actionText = 'Select Full Reset or build a custom package with thorough cleaning and glass.';
  } else if (condition === 'heavy') {
    recommendation = 'Deep Reset is recommended for heavily used interiors.';
    actionText = 'Select Deep Reset or build a custom package with extraction and detailed cleaning.';
  } else if (condition === 'severe') {
    recommendation = 'Recovery Reset is required for severe staining, strong odors, or major contamination.';
    actionText = 'Submit photos with your Recovery booking request for assessment.';
  }

  if (special === 'pet') {
    recommendation += ' Include pet hair services or Recovery assessment if heavy.';
  } else if (special === 'odor') {
    recommendation += ' Include odor treatment or Recovery assessment for strong odors.';
  } else if (special === 'stain') {
    recommendation += ' Include extraction services or Recovery assessment for widespread staining.';
  }

  finderResult.textContent = recommendation;
  finderAction.textContent = actionText;
}

if (packageFinder) {
  finderCondition.addEventListener('change', updateFinder);
  finderSpecial.addEventListener('change', updateFinder);
}

// Continue booking
if (continueBookingFromServices) {
  continueBookingFromServices.addEventListener('click', () => {
    window.location.href = '/book/';
  });
}

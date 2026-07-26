/* ===================================
   TOPNOTCH BUILDER - JAVASCRIPT LOGIC
   =================================== */

// Builder state
const builderState = {
    selections: new Set(),
    total: 0,
    hasAssessmentRequired: false,
    conflictWarnings: []
};

// Service definitions
const services = {
    'interior-vacuum': { name: 'Interior Vacuum', price: 20, category: 'core' },
    'light-surface-wipe': { name: 'Light Surface Wipe-Down', price: 15, category: 'core' },
    'thorough-surface': { name: 'Thorough Interior-Surface Cleaning', price: 35, category: 'core' },
    'interior-glass': { name: 'Interior Glass', price: 8, category: 'core' },
    'cargo-area': { name: 'Cargo-Area Cleaning', price: 12, category: 'core' },
    'air-blowout': { name: 'Air Blowout, Vents & Crevices', price: 20, category: 'detailed' },
    'door-jamb': { name: 'Door-Jamb Cleaning', price: 8, category: 'detailed' },
    'one-localized-extraction': { name: 'One Localized Extraction Area', price: 15, category: 'detailed' },
    'two-localized-extraction': { name: 'Two Localized Extraction Areas', price: 25, category: 'detailed' },
    'full-carpet-extraction': { name: 'Full Carpet Extraction', price: 40, category: 'detailed' },
    'full-cloth-seat-extraction': { name: 'Full Cloth-Seat Extraction', price: 40, category: 'detailed' },
    'interior-finish': { name: 'Interior Finish & UV Protection', price: 15, category: 'finish' },
    'leather-care': { name: 'Leather Cleaning & Conditioning', price: 25, category: 'finish' },
    'light-pet-hair': { name: 'Light Pet-Hair Removal', price: 10, category: 'special' },
    'moderate-pet-hair': { name: 'Moderate / Embedded Pet Hair', price: 20, category: 'special' },
    'light-odor': { name: 'Light Odor Treatment', price: 15, category: 'special' },
    'heavy-pet-hair': { name: 'Heavy Pet Hair', price: 0, category: 'special', assessment: true },
    'strong-odor': { name: 'Strong or Persistent Odor', price: 0, category: 'special', assessment: true },
    'widespread-staining': { name: 'Widespread Staining', price: 0, category: 'special', assessment: true }
};

// Preset packages
const presets = {
    quick: { name: 'Quick Reset', price: 40, services: ['interior-vacuum', 'light-surface-wipe', 'interior-glass'] },
    full: { name: 'Full Reset', price: 75, services: ['interior-vacuum', 'thorough-surface', 'interior-glass', 'interior-finish'] },
    deep: { name: 'Deep Reset', price: 150, services: ['interior-vacuum', 'thorough-surface', 'interior-glass', 'air-blowout', 'door-jamb', 'interior-finish'] }
};

// Storage keys
const STORAGE_DRAFT = 'topnotchBuilderDraft';
const STORAGE_SELECTION = 'topnotchSelection';
const STORAGE_PENDING = 'topnotchPendingRequest';

// DOM Elements
const checkboxes = document.querySelectorAll('[data-service]');
const summaryItems = document.getElementById('summaryItems');
const subtotalEl = document.getElementById('subtotal');
const totalPriceEl = document.getElementById('totalPrice');
const minimumNotice = document.getElementById('minimumNotice');
const assessmentState = document.getElementById('assessmentState');
const summaryWarnings = document.getElementById('summaryWarnings');
const presetRecommendation = document.getElementById('presetRecommendation');
const resetBuilder = document.getElementById('resetBuilder');
const bookButton = document.getElementById('bookButton');

/* ===================================
   INITIALIZATION
   =================================== */

function initBuilder() {
    // Load saved selections
    loadSelections();
    
    // Add event listeners
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
    
    resetBuilder.addEventListener('click', clearSelections);
    
    // Initial render
    updateSummary();
}

/* ===================================
   CHECKBOX CHANGE HANDLER
   =================================== */

function handleCheckboxChange(e) {
    const serviceId = e.target.dataset.service;
    
    if (e.target.checked) {
        handleServiceSelection(serviceId);
    } else {
        handleServiceDeselection(serviceId);
    }
    
    updateSummary();
}

function handleServiceSelection(serviceId) {
    builderState.selections.add(serviceId);
    
    // Handle conflicts and overlaps
    enforceConflictRules(serviceId);
    
    saveSelections();
}

function handleServiceDeselection(serviceId) {
    builderState.selections.delete(serviceId);
    saveSelections();
}

/* ===================================
   CONFLICT RULES ENFORCEMENT
   =================================== */

function enforceConflictRules(selectedService) {
    let conflictWarning = null;

    // Light Surface Wipe-Down vs Thorough Interior-Surface Cleaning
    if (selectedService === 'light-surface-wipe' && builderState.selections.has('thorough-surface')) {
        builderState.selections.delete('light-surface-wipe');
        conflictWarning = 'Light Surface Wipe-Down removed: You selected Thorough Interior-Surface Cleaning instead.';
        uncheckService('light-surface-wipe');
    } else if (selectedService === 'thorough-surface' && builderState.selections.has('light-surface-wipe')) {
        builderState.selections.delete('light-surface-wipe');
        conflictWarning = 'Light Surface Wipe-Down removed: Thorough cleaning is more comprehensive.';
        uncheckService('light-surface-wipe');
    }

    // One vs Two Localized Extraction Areas
    if (selectedService === 'one-localized-extraction' && builderState.selections.has('two-localized-extraction')) {
        builderState.selections.delete('one-localized-extraction');
        conflictWarning = 'One Localized Extraction removed: You selected two areas instead.';
        uncheckService('one-localized-extraction');
    } else if (selectedService === 'two-localized-extraction' && builderState.selections.has('one-localized-extraction')) {
        builderState.selections.delete('one-localized-extraction');
        conflictWarning = 'One Localized Extraction removed: You selected two areas instead.';
        uncheckService('one-localized-extraction');
    }

    // Full Carpet Extraction vs Localized Extraction
    if (selectedService === 'full-carpet-extraction') {
        if (builderState.selections.has('one-localized-extraction')) {
            builderState.selections.delete('one-localized-extraction');
            uncheckService('one-localized-extraction');
            conflictWarning = 'Localized extraction removed: Full Carpet Extraction is more comprehensive.';
        }
        if (builderState.selections.has('two-localized-extraction')) {
            builderState.selections.delete('two-localized-extraction');
            uncheckService('two-localized-extraction');
            conflictWarning = 'Localized extraction removed: Full Carpet Extraction is more comprehensive.';
        }
    }

    // Full Cloth-Seat Extraction vs Localized Extraction
    if (selectedService === 'full-cloth-seat-extraction') {
        if (builderState.selections.has('one-localized-extraction')) {
            builderState.selections.delete('one-localized-extraction');
            uncheckService('one-localized-extraction');
            conflictWarning = 'Localized extraction removed: Full Cloth-Seat Extraction is more comprehensive.';
        }
        if (builderState.selections.has('two-localized-extraction')) {
            builderState.selections.delete('two-localized-extraction');
            uncheckService('two-localized-extraction');
            conflictWarning = 'Localized extraction removed: Full Cloth-Seat Extraction is more comprehensive.';
        }
    }

    // Heavy pet hair conflicts with light options
    if (selectedService === 'heavy-pet-hair') {
        if (builderState.selections.has('light-pet-hair')) {
            builderState.selections.delete('light-pet-hair');
            uncheckService('light-pet-hair');
        }
        if (builderState.selections.has('moderate-pet-hair')) {
            builderState.selections.delete('moderate-pet-hair');
            uncheckService('moderate-pet-hair');
        }
    }
    if ((selectedService === 'light-pet-hair' || selectedService === 'moderate-pet-hair') && 
        builderState.selections.has('heavy-pet-hair')) {
        builderState.selections.delete('heavy-pet-hair');
        uncheckService('heavy-pet-hair');
    }

    // Strong/persistent odor conflicts with light odor
    if (selectedService === 'strong-odor' && builderState.selections.has('light-odor')) {
        builderState.selections.delete('light-odor');
        uncheckService('light-odor');
        conflictWarning = 'Light Odor Treatment removed: Strong odor requires assessment.';
    }
    if (selectedService === 'light-odor' && builderState.selections.has('strong-odor')) {
        builderState.selections.delete('strong-odor');
        uncheckService('strong-odor');
    }

    if (conflictWarning) {
        showConflictWarning(conflictWarning);
    }
}

function uncheckService(serviceId) {
    const checkbox = document.querySelector(`[data-service="${serviceId}"]`);
    if (checkbox) {
        checkbox.checked = false;
    }
}

/* ===================================
   SUMMARY UPDATE
   =================================== */

function updateSummary() {
    calculateTotal();
    renderSelectedItems();
    checkAssessmentRequired();
    checkPresetRecommendation();
    updatePricing();
}

function calculateTotal() {
    let subtotal = 0;

    builderState.selections.forEach(serviceId => {
        if (services[serviceId]) {
            subtotal += services[serviceId].price;
        }
    });

    builderState.total = Math.max(subtotal, 40); // Apply $40 minimum
    return builderState.total;
}

function renderSelectedItems() {
    if (builderState.selections.size === 0) {
        summaryItems.innerHTML = '<p class="empty-state">Select services to see your custom reset.</p>';
        minimumNotice.style.display = 'none';
        return;
    }

    let html = '<ul class="selected-services">';
    
    builderState.selections.forEach(serviceId => {
        if (services[serviceId]) {
            const service = services[serviceId];
            const price = service.price > 0 ? `$${service.price}` : 'Assessment';
            html += `<li class="selected-item">
                <span class="item-name">${service.name}</span>
                <span class="item-price">${price}</span>
            </li>`;
        }
    });

    html += '</ul>';
    summaryItems.innerHTML = html;

    // Show minimum notice if subtotal would be less than $40
    const subtotal = Array.from(builderState.selections).reduce((sum, serviceId) => {
        return sum + (services[serviceId].price || 0);
    }, 0);

    if (subtotal > 0 && subtotal < 40) {
        minimumNotice.style.display = 'block';
    } else {
        minimumNotice.style.display = 'none';
    }
}

function checkAssessmentRequired() {
    const hasAssessment = Array.from(builderState.selections).some(serviceId => {
        return services[serviceId] && services[serviceId].assessment === true;
    });

    builderState.hasAssessmentRequired = hasAssessment;

    if (hasAssessment) {
        assessmentState.style.display = 'block';
    } else {
        assessmentState.style.display = 'none';
    }
}

function checkPresetRecommendation() {
    if (builderState.selections.size === 0 || builderState.hasAssessmentRequired) {
        presetRecommendation.style.display = 'none';
        return;
    }

    // Check which presets provide same or better coverage
    for (const [presetKey, preset] of Object.entries(presets)) {
        const presetServices = new Set(preset.services);
        let builderServices = new Set(builderState.selections);

        // Remove assessment services from comparison
        builderServices = new Set(
            Array.from(builderServices).filter(s => !services[s].assessment)
        );

        // Check if preset covers all builder services
        let presetCoversAll = true;
        builderServices.forEach(service => {
            if (!presetServices.has(service)) {
                presetCoversAll = false;
            }
        });

        // Calculate builder subtotal
        let builderSubtotal = 0;
        builderServices.forEach(service => {
            builderSubtotal += services[service].price || 0;
        });

        // If preset covers all and costs less or is better value, recommend it
        if (presetCoversAll && preset.price <= Math.max(builderSubtotal, 40)) {
            showPresetRecommendation(presetKey, preset, builderSubtotal);
            return;
        }
    }

    presetRecommendation.style.display = 'none';
}

function showPresetRecommendation(presetKey, preset, builderSubtotal) {
    presetRecommendation.style.display = 'block';
    
    const savings = Math.max(builderSubtotal, 40) - preset.price;
    const message = savings > 0 
        ? `The ${preset.name} includes all your selections plus more for $${preset.price} (save $${savings})`
        : `The ${preset.name} provides the same coverage at $${preset.price}`;
    
    document.getElementById('recommendationText').textContent = message;
    
    // Set up recommendation button
    const acceptBtn = document.getElementById('acceptRecommendation');
    acceptBtn.onclick = () => acceptPresetRecommendation(presetKey);
    
    const dismissBtn = document.getElementById('dismissRecommendation');
    dismissBtn.onclick = () => dismissPresetRecommendation();
}

function acceptPresetRecommendation(presetKey) {
    const preset = presets[presetKey];
    
    // Clear current selections
    builderState.selections.clear();
    checkboxes.forEach(cb => cb.checked = false);
    
    // Select preset services
    preset.services.forEach(serviceId => {
        builderState.selections.add(serviceId);
        const checkbox = document.querySelector(`[data-service="${serviceId}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    presetRecommendation.style.display = 'none';
    saveSelections();
    updateSummary();
}

function dismissPresetRecommendation() {
    presetRecommendation.style.display = 'none';
}

function updatePricing() {
    // Calculate subtotal (excluding assessment-only services)
    let subtotal = 0;
    builderState.selections.forEach(serviceId => {
        if (services[serviceId] && !services[serviceId].assessment) {
            subtotal += services[serviceId].price;
        }
    });

    const total = Math.max(subtotal, 40);

    subtotalEl.textContent = subtotal > 0 ? `$${subtotal}` : '$0';
    totalPriceEl.textContent = `$${total}`;
}

function showConflictWarning(message) {
    const warning = document.createElement('div');
    warning.className = 'conflict-warning';
    warning.textContent = message;
    warning.style.display = 'block';
    
    summaryWarnings.innerHTML = '';
    summaryWarnings.appendChild(warning);
    
    setTimeout(() => {
        warning.style.opacity = '0';
        warning.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            summaryWarnings.innerHTML = '';
        }, 300);
    }, 3000);
}

/* ===================================
   STORAGE MANAGEMENT
   =================================== */

function saveSelections() {
    const selectionsArray = Array.from(builderState.selections);
    sessionStorage.setItem(STORAGE_DRAFT, JSON.stringify(selectionsArray));
}

function loadSelections() {
    const saved = sessionStorage.getItem(STORAGE_DRAFT);
    if (saved) {
        try {
            const selectionsArray = JSON.parse(saved);
            selectionsArray.forEach(serviceId => {
                builderState.selections.add(serviceId);
                const checkbox = document.querySelector(`[data-service="${serviceId}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        } catch (e) {
            console.error('Error loading selections:', e);
        }
    }
}

function clearSelections() {
    const confirmed = confirm('Clear all selections? This cannot be undone.');
    if (!confirmed) return;

    builderState.selections.clear();
    checkboxes.forEach(cb => cb.checked = false);
    
    sessionStorage.removeItem(STORAGE_DRAFT);
    sessionStorage.removeItem(STORAGE_SELECTION);
    
    updateSummary();
}

/* ===================================
   INITIALIZE ON PAGE LOAD
   =================================== */

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBuilder);
} else {
    initBuilder();
}

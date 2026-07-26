/* =========================================================
   TOPNOTCH DETAILLAB — BUILDER.JS
   Build Your Own Reset interactive page logic.
========================================================= */

(function () {
  'use strict';

  const DRAFT_KEY = 'topnotchBuilderDraft';
  const SELECTION_KEY = 'topnotchSelection';
  const MOBILE_MINIMUM = 40;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getStoredSelection() {
    try {
      const raw = sessionStorage.getItem(SELECTION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function clearStoredSelection() {
    try {
      sessionStorage.removeItem(SELECTION_KEY);
      sessionStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      /* ignore */
    }
  }

  function renderSelectionBanner() {
    const banner = document.getElementById('selectionBanner');
    if (!banner) return;

    const selection = getStoredSelection();
    const title = document.getElementById('selectionBannerTitle');
    const meta = document.getElementById('selectionBannerMeta');
    const continueLink = document.getElementById('selectionContinue');
    const changeLink = document.getElementById('selectionChange');
    const clearButton = document.getElementById('selectionClear');

    if (!selection || !selection.package) {
      banner.hidden = true;
      return;
    }

    banner.hidden = false;
    if (title) title.textContent = selection.package;
    if (meta) {
      if (selection.assessmentRequired) meta.textContent = 'Custom Assessment';
      else if (selection.mode === 'preset') meta.textContent = selection.priceLabel || (selection.price ? 'Starting from $' + selection.price : '');
      else meta.textContent = 'Starting total $' + selection.price;
    }
    if (continueLink) continueLink.href = '../book/';
    if (changeLink) changeLink.href = selection.mode === 'preset' ? '../services/' : '../build/';
    if (clearButton) {
      clearButton.onclick = function () {
        if (!window.confirm('Clear the selected service and builder draft?')) return;
        clearStoredSelection();
        renderSelectionBanner();
      };
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('builderForm');
    if (!form) return;

    const materialSelect = document.getElementById('interiorMaterial');
    const totalLabelEl = document.getElementById('builderTotalLabel');
    const totalEl = document.getElementById('builderTotal');
    const subtotalEl = document.getElementById('builderSubtotalValue');
    const minimumRowEl = document.getElementById('builderMinimumRow');
    const minimumEl = document.getElementById('builderMinimumValue');
    const startingEl = document.getElementById('builderStartingValue');
    const messageEl = document.getElementById('builderMessage');
    const itemsEl = document.getElementById('selectedServices');
    const bundleWrap = document.getElementById('bundleRecommendation');
    const applyBtn = document.getElementById('applyRecommendedPreset');
    const keepBtn = document.getElementById('keepCustomBuild');
    const continueBtn = document.getElementById('continueBooking');
    const resetBtn = document.getElementById('resetBuilder');

    function getServiceInputs() {
      return Array.from(form.querySelectorAll('[data-service]'));
    }

    function getSelected() {
      return getServiceInputs().filter(function (input) { return input.checked; });
    }

    function getAssessmentSelected() {
      return getServiceInputs().filter(function (input) { return input.checked && input.dataset.assessment === 'true'; });
    }

    function isAssessmentMode() {
      return getAssessmentSelected().length > 0;
    }

    function getMaterial() {
      return materialSelect ? materialSelect.value : '';
    }

    function findServiceInput(name) {
      return getServiceInputs().find(function (input) { return input.dataset.service === name; }) || null;
    }

    function toggleSelectedClasses() {
      getServiceInputs().forEach(function (input) {
        const item = input.closest('.builder-item');
        if (!item) return;
        item.classList.toggle('is-selected', input.checked);
        item.classList.toggle('assessment-selected', input.checked && input.dataset.assessment === 'true');
      });
    }

    function enforceGroups(changed) {
      if (!changed.dataset.group || !changed.checked) return;
      getServiceInputs().forEach(function (input) {
        if (input !== changed && input.dataset.group === changed.dataset.group) input.checked = false;
      });
    }

    function enforceDependencies() {
      getServiceInputs().forEach(function (input) {
        if (!input.dataset.requires) return;
        const requiredInput = findServiceInput(input.dataset.requires);
        const item = input.closest('.builder-item');
        if (!item) return;
        if (requiredInput && !requiredInput.checked) {
          input.checked = false;
          input.disabled = true;
          item.classList.add('is-disabled');
        } else {
          input.disabled = false;
          item.classList.remove('is-disabled');
        }
      });
    }

    function enforceLeatherEligibility() {
      const leatherInput = findServiceInput('Leather Cleaning & Conditioning');
      if (!leatherInput) return;
      const item = leatherInput.closest('.builder-item');
      if (!item) return;
      const eligible = getMaterial() === 'Leather / leather-trimmed' || getMaterial() === 'Mixed materials';
      if (!eligible) {
        leatherInput.checked = false;
        leatherInput.disabled = true;
        item.classList.add('is-disabled');
      } else {
        leatherInput.disabled = false;
        item.classList.remove('is-disabled');
      }
    }

    function escapeHtml(value) {
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function calculateSubtotal() {
      return getSelected().reduce(function (sum, input) { return sum + (parseFloat(input.dataset.price) || 0); }, 0);
    }

    function calculateTotal() {
      const subtotal = calculateSubtotal();
      return subtotal > 0 ? Math.max(MOBILE_MINIMUM, subtotal) : MOBILE_MINIMUM;
    }

    function animateBump(element) {
      if (prefersReducedMotion || !element) return;
      element.classList.remove('bump');
      void element.offsetWidth;
      element.classList.add('bump');
      setTimeout(function () { element.classList.remove('bump'); }, 200);
    }

    function recommendationFor(selected, subtotal) {
      if (!selected.length || isAssessmentMode()) return null;
      const names = selected.map(function (input) { return input.dataset.service; });
      const fullResetCovers = ['Interior Vacuum', 'Light Surface Wipe-Down', 'Thorough Interior-Surface Cleaning', 'Interior Glass', 'Interior Finish & UV Protection'];
      const deepResetCovers = ['Interior Vacuum', 'Light Surface Wipe-Down', 'Thorough Interior-Surface Cleaning', 'Interior Glass', 'Air Blowout, Vents & Crevices', 'Door-Jamb Cleaning', 'Full Carpet Extraction', 'Full Cloth-Seat Extraction', 'Leather Cleaning & Conditioning', 'Interior Finish & UV Protection', 'Cargo-Area Cleaning'];

      if (subtotal <= 40 && names.every(function (name) { return ['Interior Vacuum', 'Light Surface Wipe-Down'].includes(name); })) {
        return { package: 'Quick Reset', price: 40, text: 'The Quick Reset already covers this maintenance-style combination for $40.' };
      }
      if (subtotal >= 75 && subtotal <= 90 && names.every(function (name) { return fullResetCovers.includes(name); })) {
        return { package: 'Full Reset', price: 75, text: 'The Full Reset offers equal or better preset coverage for this mix of services.' };
      }
      const deepMatches = names.filter(function (name) { return deepResetCovers.includes(name); }).length;
      if (subtotal >= 150 && deepMatches >= 6) {
        return { package: 'Deep Reset', price: 150, text: 'The Deep Reset is a better-fit preset at this coverage level and starting price.' };
      }
      return null;
    }

    function updateRecommendation(selected, subtotal) {
      if (!bundleWrap) return;
      const recommendation = recommendationFor(selected, subtotal);
      if (!recommendation) {
        bundleWrap.classList.remove('visible');
        bundleWrap.innerHTML = '';
        if (applyBtn) applyBtn.hidden = true;
        if (keepBtn) keepBtn.hidden = true;
        return;
      }
      bundleWrap.classList.add('visible');
      bundleWrap.innerHTML = '<div class="builder-message recommend"><strong>Recommended preset:</strong> ' + escapeHtml(recommendation.package) + ' — From $' + recommendation.price + '. ' + escapeHtml(recommendation.text) + '</div>';
      if (applyBtn) {
        applyBtn.hidden = false;
        applyBtn.dataset.recPackage = recommendation.package;
        applyBtn.dataset.recPrice = String(recommendation.price);
      }
      if (keepBtn) keepBtn.hidden = false;
    }

    function renderSummary() {
      const selected = getSelected();
      const assessmentSelected = getAssessmentSelected();
      const assessmentMode = assessmentSelected.length > 0;
      const subtotal = calculateSubtotal();
      const total = calculateTotal();

      toggleSelectedClasses();

      if (itemsEl) {
        itemsEl.innerHTML = '';
        if (!selected.length) {
          const li = document.createElement('li');
          li.textContent = 'No services selected yet.';
          itemsEl.appendChild(li);
        } else {
          selected.forEach(function (input) {
            const li = document.createElement('li');
            const name = document.createElement('span');
            name.textContent = input.dataset.service;
            const value = document.createElement('span');
            value.textContent = input.dataset.assessment === 'true' ? 'Assessment' : '$' + (parseFloat(input.dataset.price) || 0).toFixed(0);
            li.appendChild(name);
            li.appendChild(value);
            itemsEl.appendChild(li);
          });
        }
      }

      animateBump(totalEl);

      if (assessmentMode) {
        if (totalLabelEl) totalLabelEl.textContent = 'Recovery routing';
        if (totalEl) totalEl.textContent = 'ASSESSMENT REQUIRED';
        if (subtotalEl) subtotalEl.textContent = '—';
        if (startingEl) startingEl.textContent = '—';
        if (minimumRowEl) minimumRowEl.hidden = true;
        if (messageEl) {
          const conditions = assessmentSelected.map(function (input) { return input.dataset.service; }).join(', ');
          messageEl.className = 'builder-message assessment';
          messageEl.innerHTML = '<strong>ASSESSMENT REQUIRED</strong><br>Selected conditions: ' + escapeHtml(conditions) + '. Clear interior photos will be required before pricing and confirmation.';
          messageEl.style.display = 'block';
        }
      } else if (!selected.length) {
        if (totalLabelEl) totalLabelEl.textContent = 'Mobile-first starting point';
        if (totalEl) totalEl.textContent = '$40 MOBILE MINIMUM';
        if (subtotalEl) subtotalEl.textContent = '$0';
        if (startingEl) startingEl.textContent = '$40';
        if (minimumEl) minimumEl.textContent = '$40';
        if (minimumRowEl) minimumRowEl.hidden = false;
        if (messageEl) {
          messageEl.className = 'builder-message info';
          messageEl.innerHTML = 'Select services to begin. Custom mobile appointments have a $40 minimum.';
          messageEl.style.display = 'block';
        }
      } else {
        if (totalLabelEl) totalLabelEl.textContent = 'Starting total';
        if (totalEl) totalEl.textContent = '$' + total;
        if (subtotalEl) subtotalEl.textContent = '$' + subtotal;
        if (startingEl) startingEl.textContent = '$' + total;
        if (minimumEl) minimumEl.textContent = '$40';
        if (minimumRowEl) minimumRowEl.hidden = subtotal >= MOBILE_MINIMUM;
        if (messageEl) {
          if (subtotal < MOBILE_MINIMUM) {
            messageEl.className = 'builder-message info';
            messageEl.innerHTML = 'Selected services: $' + subtotal + '<br>Mobile minimum: $40<br>Starting total: $40';
            messageEl.style.display = 'block';
          } else {
            messageEl.style.display = 'none';
          }
        }
      }

      updateRecommendation(selected, subtotal);
      if (continueBtn) continueBtn.disabled = selected.length === 0;
    }

    function saveDraft() {
      const draft = { material: getMaterial(), checked: getSelected().map(function (input) { return input.dataset.service; }) };
      try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (error) { /* ignore */ }
    }

    function restoreDraft() {
      try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (draft.material && materialSelect) materialSelect.value = draft.material;
        if (Array.isArray(draft.checked)) {
          draft.checked.forEach(function (serviceName) {
            const input = findServiceInput(serviceName);
            if (input) input.checked = true;
          });
        }
      } catch (error) {
        clearStoredSelection();
      }
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        const pkg = applyBtn.dataset.recPackage;
        const price = Number(applyBtn.dataset.recPrice || 0);
        if (!pkg) return;
        if (!window.confirm('Replace your custom build with the ' + pkg + ' preset?')) return;
        try {
          sessionStorage.setItem(SELECTION_KEY, JSON.stringify({ mode: 'preset', package: pkg, price: price, priceLabel: 'From $' + price, services: [], assessmentRequired: false }));
          sessionStorage.removeItem(DRAFT_KEY);
        } catch (error) { /* ignore */ }
        window.location.href = '../book/';
      });
    }

    if (keepBtn) {
      keepBtn.addEventListener('click', function () {
        if (!bundleWrap) return;
        bundleWrap.classList.remove('visible');
        bundleWrap.innerHTML = '';
        keepBtn.hidden = true;
        if (applyBtn) applyBtn.hidden = true;
      });
    }

    if (continueBtn) {
      continueBtn.addEventListener('click', function () {
        const selected = getSelected();
        if (!selected.length) return;
        let selection;
        if (isAssessmentMode()) {
          selection = { mode: 'assessment', package: 'Recovery Assessment', price: null, priceLabel: 'Custom Assessment', services: getAssessmentSelected().map(function (input) { return input.dataset.service; }), assessmentRequired: true };
        } else {
          const subtotal = calculateSubtotal();
          const total = calculateTotal();
          selection = { mode: 'custom', package: 'Build Your Own Reset', price: total, priceLabel: 'Starting total $' + total, subtotal: subtotal, services: selected.map(function (input) { return { name: input.dataset.service, price: parseFloat(input.dataset.price) || 0 }; }), assessmentRequired: false };
        }
        try {
          sessionStorage.setItem(SELECTION_KEY, JSON.stringify(selection));
          saveDraft();
        } catch (error) { /* ignore */ }
        window.location.href = '../book/';
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (!window.confirm('Reset all builder selections and start over?')) return;
        getServiceInputs().forEach(function (input) {
          input.checked = false;
          input.disabled = false;
        });
        form.querySelectorAll('.builder-item').forEach(function (item) {
          item.classList.remove('is-disabled', 'is-selected', 'assessment-selected');
        });
        if (materialSelect) materialSelect.value = '';
        clearStoredSelection();
        renderSelectionBanner();
        renderSummary();
      });
    }

    form.addEventListener('change', function (event) {
      const target = event.target;
      if (target.dataset.service) enforceGroups(target);
      enforceLeatherEligibility();
      enforceDependencies();
      renderSummary();
      saveDraft();
    });

    if (materialSelect) {
      materialSelect.addEventListener('change', function () {
        enforceLeatherEligibility();
        renderSummary();
        saveDraft();
      });
    }

    restoreDraft();
    enforceLeatherEligibility();
    enforceDependencies();
    renderSelectionBanner();
    renderSummary();
  });
})();

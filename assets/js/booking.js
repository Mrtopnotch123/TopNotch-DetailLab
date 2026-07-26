/* =========================================================
   TOPNOTCH DETAILLAB — BOOKING.JS
   Reads topnotchSelection, validates locally, stores request preview only.
========================================================= */

(function () {
  'use strict';

  const SELECTION_KEY = 'topnotchSelection';
  const PENDING_KEY = 'topnotchPendingRequest';
  const DRAFT_KEY = 'topnotchBookingDraft';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function parseSelection() {
    try {
      const raw = sessionStorage.getItem(SELECTION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function clearSelection() {
    try {
      sessionStorage.removeItem(SELECTION_KEY);
      sessionStorage.removeItem('topnotchBuilderDraft');
    } catch (error) {
      /* ignore */
    }
  }

  function localDateString() {
    const date = new Date();
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function maxDateString() {
    const date = new Date();
    date.setDate(date.getDate() + 180);
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function parseDateInput(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const parts = value.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    if (date.getFullYear() !== parts[0] || date.getMonth() !== parts[1] - 1 || date.getDate() !== parts[2]) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function formatDisplayDate(value) {
    const date = parseDateInput(value);
    if (!date) return value;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function normalizePhone(value) {
    let digits = digitsOnly(value);
    if (digits.length === 11 && digits.charAt(0) === '1') digits = digits.slice(1);
    return digits;
  }

  function formatPhone(value) {
    const digits = normalizePhone(value);
    if (digits.length !== 10) return value;
    return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6);
  }

  function selectionMeta(selection) {
    if (!selection) return '';
    if (selection.assessmentRequired) return 'Custom Assessment';
    if (selection.mode === 'preset') return selection.priceLabel || (selection.price ? 'Starting from $' + selection.price : '');
    return selection.price ? 'Starting total $' + selection.price : '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    const banner = document.getElementById('selectionBanner');
    const bannerTitle = document.getElementById('selectionBannerTitle');
    const bannerMeta = document.getElementById('selectionBannerMeta');
    const bannerContinue = document.getElementById('selectionContinue');
    const bannerChange = document.getElementById('selectionChange');
    const bannerClear = document.getElementById('selectionClear');

    const summaryWrap = document.querySelector('.booking-selection-summary');
    const titleEl = document.getElementById('bookingSelectionTitle');
    const priceEl = document.getElementById('bookingSelectionPrice');
    const itemsEl = document.getElementById('bookingSelectionItems');
    const photoReqEl = document.getElementById('photoRequirement');
    const noSelectionWrap = document.querySelector('.booking-no-selection');

    const form = document.getElementById('bookingForm');
    const statusEl = document.getElementById('bookingStatus');
    const dateInput = document.getElementById('preferredDate');
    const progressEl = document.getElementById('bookingProgress');
    const submitButton = document.getElementById('saveRequestPreview');
    const trackedFieldIds = ['customerName', 'customerEmail', 'customerPhone', 'vehicleYear', 'vehicleMake', 'vehicleModel', 'vehicleType', 'cityZip', 'preferredDate', 'condition', 'notes', 'bookingConsent'];
    const requiredFieldIds = ['customerName', 'customerEmail', 'customerPhone', 'vehicleYear', 'vehicleMake', 'vehicleModel', 'vehicleType', 'cityZip', 'preferredDate', 'condition', 'bookingConsent'];
    let previewSaved = false;

    if (dateInput) {
      dateInput.min = localDateString();
      dateInput.max = maxDateString();
    }

    function renderSelection() {
      const selection = parseSelection();

      if (banner) banner.hidden = !selection || !selection.package;
      if (selection && bannerTitle) bannerTitle.textContent = selection.package;
      if (selection && bannerMeta) bannerMeta.textContent = selectionMeta(selection);
      if (bannerContinue) bannerContinue.href = '../book/';
      if (bannerChange) bannerChange.href = selection && (selection.mode === 'custom' || selection.mode === 'assessment') ? '../build/' : '../services/';
      if (bannerClear) {
        bannerClear.onclick = function () {
          if (!window.confirm('Clear the selected service?')) return;
          clearSelection();
          renderSelection();
        };
      }

      if (!selection || !selection.package) {
        if (summaryWrap) summaryWrap.style.display = 'none';
        if (noSelectionWrap) noSelectionWrap.style.display = '';
        if (photoReqEl) photoReqEl.classList.remove('visible');
        if (submitButton) submitButton.disabled = true;
        updateFormProgress();
        return;
      }

      if (noSelectionWrap) noSelectionWrap.style.display = 'none';
      if (summaryWrap) summaryWrap.style.display = '';
      if (submitButton) submitButton.disabled = false;
      if (titleEl) titleEl.textContent = selection.package;
      if (priceEl) priceEl.innerHTML = '<strong>' + selectionMeta(selection) + '</strong>';

      if (itemsEl) {
        itemsEl.innerHTML = '';
        const services = Array.isArray(selection.services) ? selection.services : [];
        if (!services.length && selection.mode === 'preset') {
          const li = document.createElement('li');
          li.textContent = selection.package + ' preset selected';
          itemsEl.appendChild(li);
        } else {
          services.forEach(function (service) {
            const li = document.createElement('li');
            if (typeof service === 'object' && service.name) li.textContent = service.name + (service.price ? ' — $' + service.price : '');
            else li.textContent = String(service);
            itemsEl.appendChild(li);
          });
        }
      }

      if (photoReqEl) photoReqEl.classList.toggle('visible', !!selection.assessmentRequired);
      updateFormProgress();
    }

    function fieldValue(id) {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function feedbackIdFor(field) {
      return field.id + 'Feedback';
    }

    function feedbackAnchor(field) {
      if (field.type === 'checkbox') return field.closest('label') || field.parentElement;
      return field;
    }

    function ensureFeedback(field) {
      if (!field || !field.id) return null;
      let feedback = document.getElementById(feedbackIdFor(field));
      if (!feedback) {
        feedback = document.createElement('p');
        feedback.className = 'field-feedback';
        feedback.id = feedbackIdFor(field);
        const anchor = feedbackAnchor(field);
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(feedback, anchor.nextSibling);
      }
      if (!feedback) return null;
      const describedBy = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      if (describedBy.indexOf(feedback.id) === -1) describedBy.push(feedback.id);
      field.setAttribute('aria-describedby', describedBy.join(' '));
      return feedback;
    }

    function setFieldMessage(field, message, tone) {
      if (!field) return;
      const feedback = ensureFeedback(field);
      field.classList.toggle('field-error', !!message);
      field.toggleAttribute('aria-invalid', !!message);
      if (!feedback) return;
      feedback.textContent = message || '';
      feedback.classList.toggle('success', tone === 'success');
    }

    function fieldLabel(field) {
      const labels = {
        customerName: 'Full name',
        customerEmail: 'Email address',
        customerPhone: 'Phone number',
        vehicleYear: 'Vehicle year',
        vehicleMake: 'Vehicle make',
        vehicleModel: 'Vehicle model',
        vehicleType: 'Vehicle type',
        cityZip: 'City or ZIP code',
        preferredDate: 'Preferred date',
        condition: 'Interior condition',
        bookingConsent: 'Local preview acknowledgment'
      };
      return labels[field.id] || 'This field';
    }

    function validationMessage(field) {
      if (!field) return '';
      if (field.type === 'checkbox') {
        return field.checked ? '' : 'Please confirm the local preview acknowledgment.';
      }
      const value = field.value.trim();
      if (!value) return field.hasAttribute('required') ? fieldLabel(field) + ' is required.' : '';
      if (field.id === 'customerEmail' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address.';
      }
      if (field.id === 'customerPhone') {
        return normalizePhone(value).length === 10 ? '' : 'Please enter a valid 10-digit phone number.';
      }
      if (field.id === 'vehicleYear') {
        const year = Number(value);
        const maxYear = new Date().getFullYear() + 1;
        if (!/^\d{4}$/.test(value)) return 'Please enter a 4-digit vehicle year.';
        if (year < 1900 || year > maxYear) return 'Please enter a vehicle year between 1900 and ' + maxYear + '.';
      }
      if (field.id === 'cityZip') {
        if (!/^[A-Za-z0-9][A-Za-z0-9,\-.\s]{1,59}$/.test(value)) return 'Use letters, numbers, spaces, commas, periods, or hyphens only.';
        if (!(/[A-Za-z]{2,}/.test(value) || /\b\d{5}(?:-\d{4})?\b/.test(value))) return 'Enter a city name or a valid ZIP code.';
      }
      if (field.id === 'preferredDate') {
        const picked = parseDateInput(value);
        const minDate = parseDateInput(localDateString());
        const maxDate = parseDateInput(maxDateString());
        if (!picked) return 'Please choose a valid date.';
        if (picked < minDate) return 'Preferred date cannot be in the past.';
        if (picked > maxDate) return 'Please choose a date within the next 180 days.';
      }
      return '';
    }

    function validateField(field, showMessage) {
      const message = validationMessage(field);
      if (showMessage) setFieldMessage(field, message);
      else if (!message) setFieldMessage(field, '');
      return message;
    }

    function updateFormProgress() {
      if (!progressEl) return;
      let completed = 0;
      const total = requiredFieldIds.length + 1;
      requiredFieldIds.forEach(function (id) {
        const field = document.getElementById(id);
        if (field && !validationMessage(field)) completed += 1;
      });
      const selection = parseSelection();
      if (selection && selection.package) completed += 1;
      progressEl.style.width = Math.round((completed / total) * 100) + '%';
    }

    function collectDraft() {
      return {
        customerName: fieldValue('customerName'),
        customerEmail: fieldValue('customerEmail'),
        customerPhone: fieldValue('customerPhone'),
        vehicleYear: fieldValue('vehicleYear'),
        vehicleMake: fieldValue('vehicleMake'),
        vehicleModel: fieldValue('vehicleModel'),
        vehicleType: fieldValue('vehicleType'),
        cityZip: fieldValue('cityZip'),
        preferredDate: fieldValue('preferredDate'),
        condition: fieldValue('condition'),
        notes: fieldValue('notes'),
        bookingConsent: !!(document.getElementById('bookingConsent') && document.getElementById('bookingConsent').checked)
      };
    }

    function saveDraft() {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft()));
      } catch (error) {
        /* ignore */
      }
    }

    function restoreDraft() {
      let draft = null;
      try {
        const rawDraft = sessionStorage.getItem(DRAFT_KEY);
        if (rawDraft) draft = JSON.parse(rawDraft);
      } catch (error) {
        draft = null;
      }

      if (!draft) {
        try {
          const rawRequest = sessionStorage.getItem(PENDING_KEY);
          if (rawRequest) {
            const request = JSON.parse(rawRequest);
            draft = {
              customerName: request.customer && request.customer.name ? request.customer.name : '',
              customerEmail: request.customer && request.customer.email ? request.customer.email : '',
              customerPhone: request.customer && request.customer.phone ? request.customer.phone : '',
              vehicleYear: request.vehicle && request.vehicle.year ? request.vehicle.year : '',
              vehicleMake: request.vehicle && request.vehicle.make ? request.vehicle.make : '',
              vehicleModel: request.vehicle && request.vehicle.model ? request.vehicle.model : '',
              vehicleType: request.vehicle && request.vehicle.type ? request.vehicle.type : '',
              cityZip: request.cityZip || '',
              preferredDate: request.preferredDate || '',
              condition: request.condition || '',
              notes: request.notes || '',
              bookingConsent: true
            };
          }
        } catch (error) {
          draft = null;
        }
      }

      if (!draft) return;
      trackedFieldIds.forEach(function (id) {
        const field = document.getElementById(id);
        if (!field) return;
        if (field.type === 'checkbox') field.checked = !!draft[id];
        else if (typeof draft[id] === 'string') field.value = draft[id];
      });
      if (statusEl) {
        statusEl.className = 'form-status info';
        statusEl.textContent = 'Restored your local booking draft from this browser session.';
      }
    }

    function markDraftDirty() {
      if (!previewSaved || !statusEl) return;
      statusEl.className = 'form-status info';
      statusEl.textContent = 'You have unsaved changes on this device. Save Request Preview again to update the local preview.';
      previewSaved = false;
    }

    function validateForm() {
      const errors = [];
      requiredFieldIds.forEach(function (id) {
        const field = document.getElementById(id);
        if (!field) return;
        field.dataset.touched = 'true';
        const message = validateField(field, true);
        if (message) errors.push({ element: field, message: message });
      });
      return errors;
    }

    if (!form) return;
    trackedFieldIds.forEach(function (id) {
      const field = document.getElementById(id);
      if (field) ensureFeedback(field);
    });
    restoreDraft();
    renderSelection();
    updateFormProgress();

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const selection = parseSelection();
      if (!selection || !selection.package) {
        if (statusEl) {
          statusEl.className = 'form-status';
          statusEl.textContent = 'Choose a service before saving a request preview.';
        }
        return;
      }

      const errors = validateForm();
      if (errors.length) {
        if (statusEl) {
          statusEl.className = 'form-status';
          statusEl.textContent = errors[0].message;
        }
        if (errors[0].element && typeof errors[0].element.focus === 'function') {
          errors[0].element.focus();
          errors[0].element.scrollIntoView({ block: 'center', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        }
        return;
      }

      const request = {
        selection: selection,
        customer: { name: fieldValue('customerName'), email: fieldValue('customerEmail'), phone: fieldValue('customerPhone') },
        vehicle: { year: fieldValue('vehicleYear'), make: fieldValue('vehicleMake'), model: fieldValue('vehicleModel'), type: fieldValue('vehicleType') },
        cityZip: fieldValue('cityZip'),
        preferredDate: fieldValue('preferredDate'),
        condition: fieldValue('condition'),
        notes: fieldValue('notes'),
        createdAt: new Date().toISOString()
      };

      try {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify(request));
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft()));
      } catch (error) { /* ignore */ }

      if (statusEl) {
        statusEl.className = 'form-status success';
        statusEl.innerHTML = '<strong>Local preview saved.</strong> ' + escapeHtml(selection.package) + ' for ' + escapeHtml(formatDisplayDate(request.preferredDate)) + ' has been saved on this device only. Nothing has been sent to TopNotch DetailLab, and no appointment has been confirmed.';
        statusEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
      }
      previewSaved = true;
    });

    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('input', function () {
        if (field.dataset.touched === 'true' || field.value.trim()) validateField(field, true);
        else if (field.type !== 'checkbox') setFieldMessage(field, '');
        saveDraft();
        markDraftDirty();
        updateFormProgress();
      });
      field.addEventListener('change', function () {
        field.dataset.touched = 'true';
        if (field.id === 'customerPhone' && !validationMessage(field)) field.value = formatPhone(field.value);
        validateField(field, true);
        saveDraft();
        markDraftDirty();
        updateFormProgress();
      });
      field.addEventListener('blur', function () {
        field.dataset.touched = 'true';
        if (field.id === 'customerPhone' && !validationMessage(field)) field.value = formatPhone(field.value);
        validateField(field, true);
        saveDraft();
        updateFormProgress();
      });
    });
  });
})();

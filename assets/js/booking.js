/* =========================================================
   TOPNOTCH DETAILLAB — BOOKING.JS
   Reads topnotchSelection, validates locally, stores request preview only.
========================================================= */

(function () {
  'use strict';

  const SELECTION_KEY = 'topnotchSelection';
  const PENDING_KEY = 'topnotchPendingRequest';
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
    const submitButton = document.getElementById('saveRequestPreview');

    if (dateInput) dateInput.min = localDateString();

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
    }

    function fieldValue(id) {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    }

    function validateForm() {
      const errors = [];
      [['customerName', 'Full name'], ['customerEmail', 'Email address'], ['customerPhone', 'Phone number'], ['vehicleYear', 'Vehicle year'], ['vehicleMake', 'Vehicle make'], ['vehicleModel', 'Vehicle model'], ['vehicleType', 'Vehicle type'], ['cityZip', 'City or ZIP code'], ['preferredDate', 'Preferred date'], ['condition', 'Interior condition']].forEach(function (entry) {
        const el = document.getElementById(entry[0]);
        if (!el) return;
        if (!el.value.trim()) {
          errors.push({ element: el, message: entry[1] + ' is required.' });
          el.classList.add('field-error');
        }
      });

      const emailEl = document.getElementById('customerEmail');
      if (emailEl && emailEl.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) {
        errors.push({ element: emailEl, message: 'Please enter a valid email address.' });
        emailEl.classList.add('field-error');
      }

      const dateEl = document.getElementById('preferredDate');
      if (dateEl && dateEl.value && dateEl.value < localDateString()) {
        errors.push({ element: dateEl, message: 'Preferred date cannot be in the past.' });
        dateEl.classList.add('field-error');
      }

      const consentEl = document.getElementById('bookingConsent');
      if (consentEl && !consentEl.checked) {
        errors.push({ element: consentEl, message: 'Please confirm the local preview acknowledgment.' });
      }

      return errors;
    }

    renderSelection();
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      form.querySelectorAll('.field-error').forEach(function (el) { el.classList.remove('field-error'); });

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

      try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(request)); } catch (error) { /* ignore */ }

      if (statusEl) {
        statusEl.className = 'form-status success';
        statusEl.textContent = 'Your request preview has been saved on this device. It has not been sent to TopNotch DetailLab, and no appointment has been confirmed.';
        statusEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
      }
    });

    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('input', function () { field.classList.remove('field-error'); });
      field.addEventListener('change', function () { field.classList.remove('field-error'); });
    });
  });
})();

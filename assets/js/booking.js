/* =========================================================
   TOPNOTCH DETAILLAB — BOOKING.JS
   Reads topnotchSelection, displays selection summary,
   validates the booking form, stores request locally.
   Does NOT submit to any backend, SMS, email, or phone.
========================================================= */

(function () {
  'use strict';

  const SELECTION_KEY = 'topnotchSelection';
  const PENDING_KEY = 'topnotchPendingRequest';

  document.addEventListener('DOMContentLoaded', function () {

    /* ---- Selection summary elements ---- */
    const titleEl = document.getElementById('bookingSelectionTitle');
    const priceEl = document.getElementById('bookingSelectionPrice');
    const itemsEl = document.getElementById('bookingSelectionItems');
    const photoReqEl = document.getElementById('photoRequirement');

    /* ---- Form ---- */
    const form = document.getElementById('bookingForm');
    const statusEl = document.getElementById('bookingStatus');
    const dateInput = document.getElementById('preferredDate');

    /* ---- Set date minimum to local current date ---- */
    if (dateInput) {
      const today = localDateString();
      dateInput.min = today;
    }

    /* ---- Parse selection from sessionStorage ---- */
    function parseSelection() {
      try {
        const raw = sessionStorage.getItem(SELECTION_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }

    /* ---- Render booking selection summary ---- */
    function renderSelection() {
      const sel = parseSelection();
      const wrap = document.querySelector('.booking-selection-summary');
      const noSelWrap = document.querySelector('.booking-no-selection');

      if (!sel || !sel.package) {
        /* No selection */
        if (wrap) wrap.style.display = 'none';
        if (noSelWrap) noSelWrap.style.display = '';
        if (photoReqEl) photoReqEl.classList.remove('visible');
        return;
      }

      if (noSelWrap) noSelWrap.style.display = 'none';
      if (wrap) wrap.style.display = '';

      /* Title */
      if (titleEl) {
        titleEl.textContent = sel.package;
      }

      /* Price */
      if (priceEl) {
        if (sel.assessmentRequired) {
          priceEl.innerHTML = 'Starting price: <strong>Custom — assessment required</strong>';
        } else if (sel.price !== null && sel.price !== undefined) {
          const prefix = sel.mode === 'preset' ? 'Starting from ' : 'Estimated total: ';
          priceEl.innerHTML = prefix + '<strong>$' + sel.price + '</strong>';
        } else {
          priceEl.innerHTML = '';
        }
      }

      /* Service items */
      if (itemsEl) {
        itemsEl.innerHTML = '';
        const services = sel.services || [];

        if (sel.mode === 'preset' && services.length === 0) {
          /* Preset — show package name only */
          const li = document.createElement('li');
          li.textContent = sel.package + ' service';
          itemsEl.appendChild(li);
        } else if (sel.mode === 'assessment') {
          /* Assessment conditions */
          services.forEach(function (condition) {
            const li = document.createElement('li');
            li.textContent = String(condition);
            itemsEl.appendChild(li);
          });
        } else {
          /* Custom build or preset with services list */
          services.forEach(function (svc) {
            const li = document.createElement('li');
            if (typeof svc === 'object' && svc.name) {
              li.textContent = svc.name + (svc.price ? ' — $' + svc.price : '');
            } else {
              li.textContent = String(svc);
            }
            itemsEl.appendChild(li);
          });
        }
      }

      /* Photo requirement notice (assessment/Recovery) */
      if (photoReqEl) {
        if (sel.assessmentRequired) {
          photoReqEl.classList.add('visible');
        } else {
          photoReqEl.classList.remove('visible');
        }
      }
    }

    renderSelection();

    /* ---- Form validation ---- */
    function validateForm() {
      const errors = [];

      const fields = [
        { id: 'customerName', label: 'Full name' },
        { id: 'customerEmail', label: 'Email address' },
        { id: 'customerPhone', label: 'Phone number' },
        { id: 'vehicleYear', label: 'Vehicle year' },
        { id: 'vehicleMake', label: 'Vehicle make' },
        { id: 'vehicleModel', label: 'Vehicle model' },
        { id: 'vehicleType', label: 'Vehicle type' },
        { id: 'cityZip', label: 'City or ZIP' },
        { id: 'preferredDate', label: 'Preferred date' },
        { id: 'condition', label: 'Interior condition' }
      ];

      fields.forEach(function (f) {
        const el = document.getElementById(f.id);
        if (!el) return;
        if (!el.value.trim()) {
          errors.push(f.label + ' is required.');
          el.classList.add('field-error');
        } else {
          el.classList.remove('field-error');
        }
      });

      /* Email format */
      const emailEl = document.getElementById('customerEmail');
      if (emailEl && emailEl.value.trim() && !emailEl.value.includes('@')) {
        errors.push('Please enter a valid email address.');
        emailEl.classList.add('field-error');
      }

      /* Date not in the past */
      const dateEl = document.getElementById('preferredDate');
      if (dateEl && dateEl.value) {
        const selected = dateEl.value;
        const today = localDateString();
        if (selected < today) {
          errors.push('Preferred date cannot be in the past.');
          dateEl.classList.add('field-error');
        }
      }

      /* Consent */
      const consentEl = document.getElementById('bookingConsent');
      if (consentEl && !consentEl.checked) {
        errors.push('Please read and check the consent statement.');
      }

      return errors;
    }

    /* ---- Local date string (YYYY-MM-DD) ---- */
    function localDateString() {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + day;
    }

    /* ---- Safe field value ---- */
    function fieldValue(id) {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    }

    /* ---- Form submit ---- */
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        /* Clear previous errors */
        form.querySelectorAll('.field-error').forEach(function (el) {
          el.classList.remove('field-error');
        });

        const errors = validateForm();

        if (errors.length > 0) {
          if (statusEl) {
            statusEl.className = 'form-status';
            statusEl.textContent = errors[0];
          }
          /* Focus first errored field */
          const firstErr = form.querySelector('.field-error');
          if (firstErr) firstErr.focus();
          return;
        }

        /* Build temporary request object — stored locally only */
        const sel = parseSelection() || {};
        const request = {
          selection: sel,
          customer: {
            name: fieldValue('customerName'),
            email: fieldValue('customerEmail'),
            phone: fieldValue('customerPhone')
          },
          vehicle: {
            year: fieldValue('vehicleYear'),
            make: fieldValue('vehicleMake'),
            model: fieldValue('vehicleModel'),
            type: fieldValue('vehicleType')
          },
          cityZip: fieldValue('cityZip'),
          preferredDate: fieldValue('preferredDate'),
          condition: fieldValue('condition'),
          notes: fieldValue('notes'),
          createdAt: new Date().toISOString()
        };

        try {
          sessionStorage.setItem(PENDING_KEY, JSON.stringify(request));
        } catch (e) { /* sessionStorage unavailable */ }

        /* Show honest frontend-only status */
        if (statusEl) {
          statusEl.className = 'form-status success';
          statusEl.innerHTML =
            '<strong>Your request has been prepared.</strong><br>' +
            'This request is saved locally in your browser only. ' +
            'It has <strong>not</strong> been sent to TopNotch DetailLab yet — ' +
            'the secure booking backend is still being connected. ' +
            'Your appointment is <strong>not confirmed</strong>. ' +
            'TopNotch will reach out to confirm service, final price, location, date, and time.';
        }

        /* Visual success state */
        form.classList.add('booking-success');

        /* Scroll status into view */
        if (statusEl) {
          statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      /* Remove error class on field change */
      form.querySelectorAll('input, select, textarea').forEach(function (el) {
        el.addEventListener('change', function () {
          el.classList.remove('field-error');
        });
        el.addEventListener('input', function () {
          el.classList.remove('field-error');
        });
      });
    }
  });
})();

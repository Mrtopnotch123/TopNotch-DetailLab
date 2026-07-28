/* =========================================================
   TOPNOTCH DETAILLAB — BOOKING.JS
   Supabase v2 integration for live booking requests.
   Reads topnotchSelection, validates locally, inserts to Supabase.
========================================================= */

(function () {
  'use strict';

  console.info('TopNotch booking integration loaded');

  const SUPABASE_URL = 'https://okesvucbkkjgxiqfulqf.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_6-tCHweG3OisHB_kanJzwg_5kslJatw';
  const SELECTION_KEY = 'topnotchSelection';
  const PENDING_KEY = 'topnotchPendingRequest';
  const DRAFT_KEY = 'topnotchBookingDraft';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ARRIVAL_WINDOW_LABELS = {
    '8:00 AM-10:00 AM': '8:00 AM–10:00 AM',
    '10:00 AM-12:00 PM': '10:00 AM–12:00 PM',
    '12:00 PM-2:00 PM': '12:00 PM–2:00 PM',
    '2:00 PM-4:00 PM': '2:00 PM–4:00 PM',
    '4:00 PM-6:00 PM': '4:00 PM–6:00 PM',
    Flexible: 'Flexible',
    Morning: 'Morning',
    Afternoon: 'Afternoon',
    Evening: 'Evening'
  };

  let supabaseClient = null;

  function initSupabase() {
    if (supabaseClient) return supabaseClient;
    if (!window.supabase) {
      console.error('Supabase library not loaded');
      return null;
    }
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      console.info('Supabase client initialized');
      return supabaseClient;
    } catch (e) {
      console.error('Failed to initialize Supabase:', e);
      return null;
    }
  }

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

  function clearPendingRequest() {
    try {
      sessionStorage.removeItem(PENDING_KEY);
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

  function getInputValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function normalizeArrivalWindowValue(value) {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return '';
    const matches = Object.keys(ARRIVAL_WINDOW_LABELS).filter(function (key) {
      return key.toLowerCase() === raw.toLowerCase();
    });
    if (matches.length) return matches[0];
    const legacyAliases = {
      // Backward compatibility for drafts saved before the arrival-window upgrade; normalize case so capitalized legacy values still map even though they are no longer selectable in the UI.
      morning: '8:00 AM-10:00 AM',
      afternoon: '12:00 PM-2:00 PM',
      evening: '4:00 PM-6:00 PM'
    };
    const alias = legacyAliases[raw.toLowerCase()];
    if (alias) return alias;
    const labelMatch = Object.keys(ARRIVAL_WINDOW_LABELS).find(function (key) {
      return ARRIVAL_WINDOW_LABELS[key].toLowerCase() === raw.toLowerCase();
    });
    return labelMatch || raw;
  }

  function formatArrivalWindowLabel(value) {
    const normalized = normalizeArrivalWindowValue(value);
    return ARRIVAL_WINDOW_LABELS[normalized] || normalized || '—';
  }

  function formatVehicleSummary() {
    const year = getInputValue('vehicleYear');
    const make = getInputValue('vehicleMake');
    const model = getInputValue('vehicleModel');
    const type = getInputValue('vehicleType');
    const vehicle = [year, make, model].filter(Boolean).join(' ');
    if (!vehicle && !type) return '—';
    if (!vehicle) return type;
    return type ? vehicle + ' · ' + type : vehicle;
  }

  function formatServiceLocationSummary() {
    const street = getInputValue('serviceStreetAddress');
    const unit = getInputValue('serviceUnit');
    const city = getInputValue('serviceCity');
    const state = getInputValue('serviceState');
    const zip = getInputValue('serviceZip');
    const lines = [];

    if (street) lines.push(street);
    if (unit) lines.push(unit);
    if (city || state || zip) {
      const cityState = [city, state].filter(Boolean).join(', ');
      const cityStateZip = [cityState, zip].filter(Boolean).join(cityState && zip ? ' ' : '');
      if (cityStateZip) lines.push(cityStateZip);
    }

    return lines.length ? lines.join('\n') : '—';
  }

  function selectionMeta(selection) {
    if (!selection) return '';
    if (selection.assessmentRequired) return 'Custom Assessment';
    if (selection.mode === 'preset') return selection.priceLabel || (selection.price ? 'Starting from $' + selection.price : '');
    return selection.price ? 'Starting total $' + selection.price : '';
  }

  function initializeBookingForm() {
    try {
      const form = document.getElementById('bookingForm');
      if (!form) {
        console.warn('Booking form (#bookingForm) not found');
        return;
      }

      const banner = document.getElementById('selectionBanner');
      const bannerTitle = document.getElementById('selectionBannerTitle');
      const bannerMeta = document.getElementById('selectionBannerMeta');
      const bannerContinue = document.getElementById('selectionContinue');
      const bannerChange = document.getElementById('selectionChange');

      const summaryWrap = document.querySelector('.booking-selection-summary');
      const titleEl = document.getElementById('bookingSelectionTitle');
      const priceEl = document.getElementById('bookingSelectionPrice');
      const vehicleEl = document.getElementById('bookingSelectionVehicle');
      const dateEl = document.getElementById('bookingSelectionDate');
      const windowEl = document.getElementById('bookingSelectionWindow');
      const locationEl = document.getElementById('bookingSelectionLocation');
      const itemsEl = document.getElementById('bookingSelectionItems');
      const photoReqEl = document.getElementById('photoRequirement');
      const noSelectionWrap = document.querySelector('.booking-no-selection');

      const statusEl = document.getElementById('bookingStatus');
      if (!statusEl) {
        console.warn('Status element (#bookingStatus) not found');
        return;
      }

      const dateInput = document.getElementById('preferredDate');
      const progressEl = document.getElementById('bookingProgress');
      const submitButton = document.getElementById('submitBookingRequest');
      if (!submitButton) {
        console.warn('Submit button (#submitBookingRequest) not found');
        return;
      }

      const trackedFieldIds = ['customerName', 'customerEmail', 'customerPhone', 'vehicleYear', 'vehicleMake', 'vehicleModel', 'vehicleType', 'serviceStreetAddress', 'serviceUnit', 'serviceCity', 'serviceState', 'serviceZip', 'parkingInstructions', 'preferredDate', 'preferredTimeWindow', 'condition', 'notes', 'bookingConsent'];
      const requiredFieldIds = ['customerName', 'customerEmail', 'customerPhone', 'vehicleYear', 'vehicleMake', 'vehicleModel', 'vehicleType', 'serviceStreetAddress', 'serviceCity', 'serviceState', 'serviceZip', 'preferredDate', 'preferredTimeWindow', 'condition', 'bookingConsent'];
      let isSubmitting = false;

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
        if (priceEl) priceEl.textContent = selectionMeta(selection);
        if (vehicleEl) vehicleEl.textContent = formatVehicleSummary();
        if (dateEl) {
          const preferredDate = fieldValue('preferredDate');
          dateEl.textContent = preferredDate ? formatDisplayDate(preferredDate) : '—';
        }
        if (windowEl) {
          const preferredWindow = fieldValue('preferredTimeWindow');
          windowEl.textContent = preferredWindow ? formatArrivalWindowLabel(preferredWindow) : '—';
        }
        if (locationEl) locationEl.textContent = formatServiceLocationSummary();

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

      function feedbackIdFor(field) {
        if (!field || !field.id) return '';
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
          serviceStreetAddress: 'Street address',
          serviceUnit: 'Apartment / Suite',
          serviceCity: 'City',
          serviceState: 'State',
          serviceZip: 'ZIP code',
          parkingInstructions: 'Parking instructions / gate code',
          preferredDate: 'Preferred date',
          preferredTimeWindow: 'Preferred arrival window',
          condition: 'Interior condition',
          bookingConsent: 'Booking acknowledgment'
        };
        return labels[field.id] || 'This field';
      }

      function validationMessage(field) {
        if (!field) return '';
        if (field.type === 'checkbox') {
          return field.checked ? '' : 'Please confirm that you understand this is a pending booking request.';
        }
        const value = field.value.trim();
        if (!value) return field.hasAttribute('required') ? fieldLabel(field) + ' is required.' : '';
        if (field.id === 'customerEmail' && field.validity && field.validity.typeMismatch) {
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
        if (field.id === 'serviceStreetAddress') {
          if (!value) return 'Street address is required.';
        }
        if (field.id === 'serviceCity') {
          if (!value) return 'City is required.';
        }
        if (field.id === 'serviceState') {
          if (value !== 'IN') return 'State must be Indiana.';
        }
        if (field.id === 'serviceZip') {
          if (!/^\d{5}(?:-\d{4})?$/.test(value)) return 'Enter a valid ZIP code in 12345 or 12345-6789 format.';
        }
        if (field.id === 'preferredDate') {
          const picked = parseDateInput(value);
          const minDate = parseDateInput(localDateString());
          const maxDate = parseDateInput(maxDateString());
          if (!picked) return 'Please choose a valid date.';
          if (picked < minDate) return 'Preferred date cannot be in the past.';
          if (picked > maxDate) return 'Please choose a date within the next 180 days.';
        }
        if (field.id === 'preferredTimeWindow') {
          if (Object.keys(ARRIVAL_WINDOW_LABELS).indexOf(value) === -1) return 'Please choose a valid arrival window.';
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
          serviceStreetAddress: fieldValue('serviceStreetAddress'),
          serviceUnit: fieldValue('serviceUnit'),
          serviceCity: fieldValue('serviceCity'),
          serviceState: fieldValue('serviceState'),
          serviceZip: fieldValue('serviceZip'),
          parkingInstructions: fieldValue('parkingInstructions'),
          preferredDate: fieldValue('preferredDate'),
          preferredTimeWindow: fieldValue('preferredTimeWindow'),
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

        if (!draft) return;
        trackedFieldIds.forEach(function (id) {
          const field = document.getElementById(id);
          if (!field) return;
          if (field.type === 'checkbox') field.checked = !!draft[id];
          else if (typeof draft[id] === 'string') {
            if (id === 'preferredTimeWindow') field.value = normalizeArrivalWindowValue(draft[id]);
            else field.value = draft[id];
          }
        });
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

      trackedFieldIds.forEach(function (id) {
        const field = document.getElementById(id);
        if (field) ensureFeedback(field);
      });
      restoreDraft();
      renderSelection();
      updateFormProgress();

      form.addEventListener('submit', async function (event) {
        console.info('TopNotch booking submit handler fired');
        event.preventDefault();

        if (isSubmitting) return;

        const selection = parseSelection();
        if (!selection || !selection.package) {
          if (statusEl) {
            statusEl.className = 'form-status';
            statusEl.textContent = 'Choose a service before submitting a booking request.';
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

        isSubmitting = true;
        if (submitButton) {
          submitButton.disabled = true;
        }
        if (statusEl) {
          statusEl.className = 'form-status info';
          statusEl.textContent = 'Sending your secure booking request…';
        }

        let dbErrorDisplayed = false;

        try {
          const client = initSupabase();
          if (!client) {
            throw new Error('Supabase client initialization failed');
          }

          const bookingPayload = {
            customer_name: fieldValue('customerName'),
            customer_email: fieldValue('customerEmail').toLowerCase(),
            customer_phone: fieldValue('customerPhone'),
            vehicle_year: Number.parseInt(fieldValue('vehicleYear'), 10),
            vehicle_make: fieldValue('vehicleMake'),
            vehicle_model: fieldValue('vehicleModel'),
            vehicle_type: fieldValue('vehicleType'),
            service_street_address: fieldValue('serviceStreetAddress').trim(),
            service_unit: fieldValue('serviceUnit').trim() || null,
            service_city: fieldValue('serviceCity').trim(),
            service_state: fieldValue('serviceState').trim(),
            service_zip: fieldValue('serviceZip').trim(),
            parking_instructions: fieldValue('parkingInstructions').trim() || null,
            city_zip: fieldValue('serviceCity').trim() + ', ' + fieldValue('serviceState').trim() + ' ' + fieldValue('serviceZip').trim(),
            preferred_date: fieldValue('preferredDate'),
            preferred_time_window: normalizeArrivalWindowValue(fieldValue('preferredTimeWindow')),
            interior_condition: fieldValue('condition'),
            customer_notes: fieldValue('notes') || null,
            selection_mode: selection.mode || 'preset',
            package_name: selection.package,
            starting_price: selection.assessmentRequired ? null : (selection.price || null),
            selected_services: Array.isArray(selection.services) ? JSON.stringify(selection.services) : '[]',
            assessment_required: Boolean(selection.assessmentRequired),
            photo_status: selection.assessmentRequired ? 'required' : 'not_required',
            photo_count: 0,
            status: 'new',
            privacy_consent: document.getElementById('bookingConsent').checked,
            consent_version: '2026-07-27-v1',
            submission_source: 'website',
            client_created_at: new Date().toISOString()
          };

          console.info('Booking payload:', bookingPayload);

          const result = await client
            .from('bookings')
            .insert([bookingPayload]);

          console.info('Supabase insert result:', result);

          if (result.error) {
            console.error('FULL SUPABASE BOOKING ERROR', result.error);
            if (statusEl) {
              statusEl.className = 'form-status';
              statusEl.textContent = 'DATABASE ERROR\n\nCode: ' + (result.error.code || 'UNKNOWN') + '\nMessage: ' + (result.error.message || 'No message provided');
              dbErrorDisplayed = true;
            }
            throw result.error;
          }

          console.info('Booking submitted successfully');

          // Success: request received
          if (statusEl) {
            statusEl.className = 'form-status success';
            let confirmMsg = 'REQUEST RECEIVED\n\nYour booking request was sent successfully. This is not yet a confirmed appointment. TopNotch DetailLab will review your service, vehicle details, condition, location, preferred date, and pricing before confirmation.';
            
            if (selection.assessmentRequired) {
              confirmMsg += '\n\nClear interior photos will be requested before pricing and confirmation.';
            }
            
            statusEl.textContent = confirmMsg;
            statusEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
          }

          clearPendingRequest();
          clearSelection();
          form.reset();
          renderSelection();

        } catch (err) {
          console.error('Booking submission error:', err);
          if (statusEl) {
            if (!dbErrorDisplayed) {
              statusEl.className = 'form-status';
              statusEl.textContent = "WE COULDN'T SEND YOUR REQUEST\n\nYour information is still on this page. Check your connection and try again.";
            }
            statusEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
          }
        } finally {
          isSubmitting = false;
          if (submitButton) {
            submitButton.disabled = false;
          }
        }
      });

      form.querySelectorAll('input, select, textarea').forEach(function (field) {
        field.addEventListener('input', function () {
          if (field.dataset.touched === 'true' || field.value.trim()) validateField(field, true);
          else if (field.type !== 'checkbox') setFieldMessage(field, '');
          saveDraft();
          renderSelection();
          updateFormProgress();
        });
        field.addEventListener('change', function () {
          field.dataset.touched = 'true';
          if (field.id === 'customerPhone' && !validationMessage(field)) field.value = formatPhone(field.value);
          validateField(field, true);
          saveDraft();
          renderSelection();
          updateFormProgress();
        });
        field.addEventListener('blur', function () {
          field.dataset.touched = 'true';
          if (field.id === 'customerPhone' && !validationMessage(field)) field.value = formatPhone(field.value);
          validateField(field, true);
          saveDraft();
          renderSelection();
          updateFormProgress();
        });
      });

      console.info('Booking form initialized successfully');
    } catch (err) {
      console.error('Error initializing booking form:', err);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initializeBookingForm();
  });
})();

(function () {
  'use strict';

  const SUPABASE_URL = 'https://okesvucbkkjgxiqfulqf.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_6-tCHweG3OisHB_kanJzwg_5kslJatw';
  const BOOKING_SELECT_SHARED = [
    'id',
    'customer_name',
    'customer_email',
    'customer_phone',
    'vehicle_year',
    'vehicle_make',
    'vehicle_model',
    'vehicle_type',
    'city_zip',
    'preferred_date',
    'preferred_time_window',
    'interior_condition',
    'customer_notes',
    'selection_mode',
    'package_name',
    'starting_price',
    'confirmed_date',
    'confirmed_time',
    'final_price',
    'confirmed_location',
    'owner_message',
    'selected_services',
    'assessment_required',
    'photo_status',
    'photo_count',
    'status',
    'privacy_consent',
    'consent_version',
    'submission_source',
    'client_created_at',
    'created_at',
    'updated_at'
  ];
  const BOOKING_SELECT_NOTIFICATION = [
    'customer_notified_status',
    'customer_notified_at',
    'customer_notification_error'
  ];
  const BOOKING_SELECT_PRIMARY = ['reference_number'].concat(BOOKING_SELECT_SHARED, BOOKING_SELECT_NOTIFICATION).join(', ');
  const BOOKING_SELECT_FALLBACK = BOOKING_SELECT_SHARED.join(', ');
  const STATUS_LABELS = {
    all: 'All',
    new: 'New',
    confirmed: 'Confirmed',
    more_info_needed: 'More information needed',
    declined: 'Declined',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  const STATUS_ORDER = ['new', 'confirmed', 'more_info_needed', 'declined', 'completed', 'cancelled'];
  const ACTIONS = [
    { status: 'confirmed', label: 'CONFIRM' },
    { status: 'more_info_needed', label: 'REQUEST MORE INFO' },
    { status: 'declined', label: 'DECLINE' },
    { status: 'completed', label: 'MARK COMPLETED' },
    { status: 'cancelled', label: 'CANCEL BOOKING' }
  ];
  // Give the webhook enough time to clear the booking, send Brevo, and write back the result; if it takes longer, the dashboard shows a pending state instead of a false failure.
  const NOTIFICATION_POLL_TIMEOUT_MS = 15000;
  const NOTIFICATION_POLL_INTERVAL_MS = 1000;
  const state = {
    client: null,
    bookings: [],
    selectedId: null,
    confirmationBookingId: null,
    filter: 'new',
    search: '',
    loading: false,
    updating: false,
    loadingSerial: 0,
    lastTrigger: null,
    nextSignedOutMessage: '',
    nextSignedOutTone: '',
    lastActionMessage: ''
  };
  const els = {};

  function getEl(id) {
    return document.getElementById(id);
  }

  function initElements() {
    els.loginCard = getEl('adminLoginCard');
    els.loginForm = getEl('adminLoginForm');
    els.email = getEl('adminEmail');
    els.password = getEl('adminPassword');
    els.signInButton = getEl('adminSignInButton');
    els.authStatus = getEl('adminAuthStatus');
    els.dashboard = getEl('adminDashboard');
    els.refreshButton = getEl('adminRefreshButton');
    els.signOutButton = getEl('adminSignOutButton');
    els.search = getEl('adminSearch');
    els.statusFilter = getEl('adminStatusFilter');
    els.bookingCount = getEl('adminBookingCount');
    els.bookingList = getEl('adminBookingList');
    els.dashboardStatus = getEl('adminDashboardStatus');
    els.detailPanel = getEl('adminDetailPanel');
    els.detailContent = getEl('adminDetailContent');
    els.detailTitle = getEl('adminDetailTitle');
    els.closeDetail = getEl('adminCloseDetail');
    els.confirmationPanel = getEl('adminConfirmationPanel');
    els.confirmationForm = getEl('adminConfirmationForm');
    els.confirmationStatus = getEl('adminConfirmationStatus');
    els.confirmationTitle = getEl('adminConfirmationTitle');
    els.confirmationSubtitle = getEl('adminConfirmationSubtitle');
    els.closeConfirmation = getEl('adminCloseConfirmation');
    els.cancelConfirmation = getEl('cancelConfirmationButton');
    els.confirmAppointmentButton = getEl('confirmAppointmentButton');
    els.confirmedDate = getEl('confirmedDate');
    els.confirmedTime = getEl('confirmedTime');
    els.finalPrice = getEl('finalPrice');
    els.confirmedLocation = getEl('confirmedLocation');
    els.ownerMessage = getEl('ownerMessage');
  }

  function initSupabase() {
    if (state.client) return state.client;
    if (!window.supabase) {
      return null;
    }
    state.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    return state.client;
  }

  function setStatus(el, message, tone) {
    if (!el) return;
    el.textContent = message || '';
    el.classList.remove('is-info', 'is-success', 'is-error');
    if (tone) el.classList.add('is-' + tone);
  }

  function setLoginVisible(visible) {
    if (els.loginCard) els.loginCard.hidden = !visible;
    if (els.dashboard) els.dashboard.hidden = visible;
    if (!visible) return;
    closeConfirmation();
    closeDetail();
  }

  function setDashboardVisible(visible) {
    if (els.dashboard) els.dashboard.hidden = !visible;
    if (els.loginCard) els.loginCard.hidden = visible;
    if (!visible) {
      closeConfirmation();
      closeDetail();
    }
  }

  function normalize(value) {
    return String(value == null ? '' : value).toLowerCase().trim();
  }

  function parseSelection(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      return [String(value)];
    }
  }

  function isDateLike(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function parseDate(value) {
    if (!value) return null;
    const date = isDateLike(value) ? new Date(value + 'T00:00:00') : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    const date = parseDate(value);
    if (!date) return value || '—';
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  function formatDateTime(value) {
    const date = parseDate(value);
    if (!date) return value || '—';
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  }

  function formatCurrency(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2
    }).format(amount);
  }

  function formatReadableTime(value) {
    if (typeof value !== 'string' || !value) return value || '—';
    const parts = value.split(':');
    if (parts.length < 2) return value;
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (!isValidTime(hours, minutes)) return value;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  }

  function isValidTime(hours, minutes) {
    return Number.isFinite(hours) && Number.isFinite(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }

  function getConfirmedDetailsSource(booking) {
    return {
      confirmed_date: booking.confirmed_date || '',
      confirmed_time: booking.confirmed_time || '',
      final_price: booking.final_price == null ? '' : String(booking.final_price),
      confirmed_location: booking.confirmed_location || '',
      owner_message: booking.owner_message || ''
    };
  }

  function getNotificationState(booking) {
    const error = String(booking.customer_notification_error || '').trim();
    const notifiedStatus = normalize(booking.customer_notified_status);
    if (error) {
      return {
        state: 'failed',
        label: 'Delivery failed',
        message: error
      };
    }
    if (notifiedStatus) {
      return {
        state: 'success',
        label: 'Customer successfully notified',
        message: 'Customer successfully notified.'
      };
    }
    return {
      state: 'pending',
      label: 'Pending',
      message: 'Customer email is still being processed.'
    };
  }

  function getConfirmationDefaults(booking) {
    const values = Object.assign({}, getConfirmedDetailsSource(booking));
    if (!values.confirmed_date && booking.preferred_date) {
      values.confirmed_date = booking.preferred_date;
    }
    if (!values.final_price && booking.starting_price != null) {
      values.final_price = String(booking.starting_price);
    }
    return values;
  }

  function setFieldError(input, hasError) {
    if (!input) return;
    input.classList.toggle('field-error', Boolean(hasError));
    input.setAttribute('aria-invalid', hasError ? 'true' : 'false');
  }

  function clearConfirmationErrors() {
    [els.confirmedDate, els.confirmedTime, els.finalPrice, els.confirmedLocation].forEach(function (input) {
      setFieldError(input, false);
    });
  }

  function setConfirmationStatus(message, tone) {
    setStatus(els.confirmationStatus, message, tone);
  }

  function getBookingById(bookingId) {
    return state.bookings.find(function (booking) {
      return String(booking.id) === String(bookingId);
    }) || null;
  }

  function fillConfirmationForm(booking) {
    if (!booking) return;
    const values = getConfirmationDefaults(booking);
    if (els.confirmedDate) els.confirmedDate.value = values.confirmed_date;
    if (els.confirmedTime) els.confirmedTime.value = values.confirmed_time;
    if (els.finalPrice) els.finalPrice.value = values.final_price;
    if (els.confirmedLocation) els.confirmedLocation.value = values.confirmed_location;
    if (els.ownerMessage) els.ownerMessage.value = values.owner_message;
  }

  function getConfirmationFormValues() {
    return {
      confirmedDate: String(els.confirmedDate && els.confirmedDate.value ? els.confirmedDate.value : '').trim(),
      confirmedTime: String(els.confirmedTime && els.confirmedTime.value ? els.confirmedTime.value : '').trim(),
      finalPrice: String(els.finalPrice && els.finalPrice.value ? els.finalPrice.value : '').trim(),
      confirmedLocation: String(els.confirmedLocation && els.confirmedLocation.value ? els.confirmedLocation.value : '').trim(),
      ownerMessage: String(els.ownerMessage && els.ownerMessage.value ? els.ownerMessage.value : '').trim()
    };
  }

  function validateConfirmationForm(values) {
    clearConfirmationErrors();
    const messages = [];
    const missing = [];

    if (!values.confirmedDate) {
      missing.push('Confirmed date');
      setFieldError(els.confirmedDate, true);
    }
    if (!values.confirmedTime) {
      missing.push('Confirmed time');
      setFieldError(els.confirmedTime, true);
    }
    if (!values.confirmedLocation) {
      missing.push('Confirmed service location');
      setFieldError(els.confirmedLocation, true);
    }

    let price = null;
    if (!values.finalPrice) {
      missing.push('Final price');
      setFieldError(els.finalPrice, true);
    } else {
      price = Number(values.finalPrice);
      if (!Number.isFinite(price) || price < 0) {
        messages.push('Final price must be a valid non-negative number.');
        setFieldError(els.finalPrice, true);
      }
    }

    if (missing.length) {
      messages.unshift(missing.join(', ') + (missing.length === 1 ? ' is required.' : ' are required.'));
    }

    if (messages.length) {
      setConfirmationStatus(messages.join(' '), 'error');
      return null;
    }

    return {
      confirmed_date: values.confirmedDate,
      confirmed_time: values.confirmedTime,
      final_price: price,
      confirmed_location: values.confirmedLocation.trim(),
      owner_message: values.ownerMessage.trim() || null
    };
  }

  function setConfirmationVisible(visible) {
    if (els.confirmationPanel) els.confirmationPanel.hidden = !visible;
    document.body.classList.toggle('admin-confirmation-open', visible);
  }

  function closeConfirmation() {
    state.confirmationBookingId = null;
    setConfirmationVisible(false);
    clearConfirmationErrors();
    setConfirmationStatus('');
    if (els.confirmationSubtitle) {
      els.confirmationSubtitle.textContent = 'Collect the final appointment details before confirming.';
    }
    if (els.confirmationForm) els.confirmationForm.reset();
    if (state.lastTrigger && state.lastTrigger.isConnected && typeof state.lastTrigger.focus === 'function') {
      state.lastTrigger.focus();
    }
  }

  function openConfirmation(booking, trigger) {
    if (!booking) return;
    state.confirmationBookingId = String(booking.id);
    state.lastTrigger = trigger || state.lastTrigger;
    if (els.confirmationSubtitle) {
      els.confirmationSubtitle.textContent = [getBookingReference(booking), booking.customer_name].filter(Boolean).join(' • ') || 'Collect the final appointment details before confirming.';
    }
    fillConfirmationForm(booking);
    clearConfirmationErrors();
    setConfirmationStatus('Fill in the appointment details before confirming.', 'info');
    setConfirmationVisible(true);
    if (els.confirmedDate) els.confirmedDate.focus();
  }

  function getStatusLabel(status) {
    return STATUS_LABELS[status] || String(status || 'Unknown');
  }

  function getBookingReference(booking) {
    return booking.reference_number || booking.id || '—';
  }

  function getBookingSearchText(booking) {
    const selectedServices = parseSelection(booking.selected_services).join(' ');
    return [
      booking.reference_number,
      booking.id,
      booking.customer_name,
      booking.customer_email,
      booking.customer_phone,
      booking.vehicle_make,
      booking.vehicle_model,
      booking.city_zip,
      booking.package_name,
      selectedServices
    ].map(normalize).join(' ');
  }

  function matchesVisibleFilter(booking) {
    if (state.filter === 'all') return true;
    return normalize(booking.status) === state.filter;
  }

  function matchesSearch(booking) {
    const query = normalize(state.search);
    if (!query) return true;
    return getBookingSearchText(booking).includes(query);
  }

  function getVisibleBookings() {
    return state.bookings.filter(function (booking) {
      return matchesVisibleFilter(booking) && matchesSearch(booking);
    });
  }

  function setDashboardStatus(message, tone) {
    setStatus(els.dashboardStatus, message, tone);
  }

  function setAuthStatus(message, tone) {
    setStatus(els.authStatus, message, tone);
  }

  function setBusy(isBusy) {
    state.updating = isBusy;
    if (els.refreshButton) els.refreshButton.disabled = state.loading || isBusy;
    if (els.signOutButton) els.signOutButton.disabled = isBusy;
    if (els.signInButton) els.signInButton.disabled = isBusy;
    if (els.search) els.search.disabled = isBusy;
    if (els.statusFilter) els.statusFilter.disabled = isBusy;
    if (els.confirmAppointmentButton) els.confirmAppointmentButton.disabled = isBusy;
    if (els.cancelConfirmation) els.cancelConfirmation.disabled = isBusy;
    if (els.closeConfirmation) els.closeConfirmation.disabled = isBusy;
    if (els.confirmedDate) els.confirmedDate.disabled = isBusy;
    if (els.confirmedTime) els.confirmedTime.disabled = isBusy;
    if (els.finalPrice) els.finalPrice.disabled = isBusy;
    if (els.confirmedLocation) els.confirmedLocation.disabled = isBusy;
    if (els.ownerMessage) els.ownerMessage.disabled = isBusy;
  }

  function setLoading(isLoading) {
    state.loading = isLoading;
    if (els.refreshButton) els.refreshButton.disabled = isLoading || state.updating;
  }

  function clearDashboard() {
    state.bookings = [];
    state.selectedId = null;
    state.lastActionMessage = '';
    if (els.bookingList) els.bookingList.textContent = '';
    if (els.bookingCount) els.bookingCount.textContent = '0';
    setDashboardStatus('');
  }

  async function fetchBookingById(bookingId) {
    const client = initSupabase();
    if (!client) {
      throw new Error('Supabase library was not loaded.');
    }

    const tries = [BOOKING_SELECT_PRIMARY, BOOKING_SELECT_FALLBACK];
    let lastError = null;

    for (let index = 0; index < tries.length; index += 1) {
      const result = await client
        .from('bookings')
        .select(tries[index])
        .eq('id', bookingId)
        .single();

      if (!result.error) {
        return result.data || null;
      }

      lastError = result.error;
      if (!isMissingColumnError(result.error) || index === tries.length - 1) {
        throw result.error;
      }
    }

    throw lastError || new Error('Unable to load booking.');
  }

  async function waitForCustomerNotification(bookingId, expectedStatus) {
    const deadline = Date.now() + NOTIFICATION_POLL_TIMEOUT_MS;
    let latestBooking = null;
    let terminalResult = null;

    while (Date.now() < deadline) {
      latestBooking = await fetchBookingById(bookingId);
      if (latestBooking) {
        const notificationState = getNotificationState(latestBooking);
        if (notificationState.state === 'failed') {
          terminalResult = {
            ok: false,
            pending: false,
            booking: latestBooking,
            message: 'Booking updated but customer email could not be delivered.'
          };
          break;
        }
        if (normalize(latestBooking.customer_notified_status) === normalize(expectedStatus)) {
          terminalResult = {
            ok: true,
            booking: latestBooking,
            message: 'Customer successfully notified.'
          };
          break;
        }
      }

      await new Promise(function (resolve) {
        setTimeout(resolve, NOTIFICATION_POLL_INTERVAL_MS);
      });
    }

    if (terminalResult) {
      return terminalResult;
    }

    return {
      ok: false,
      pending: true,
      booking: latestBooking,
      message: 'Booking updated but customer email status is pending. Check again in a moment.'
    };
  }

  function openDetail(bookingId, trigger) {
    state.selectedId = String(bookingId);
    if (trigger) state.lastTrigger = trigger;
    if (!els.detailPanel) return;
    els.detailPanel.hidden = false;
    document.body.classList.add('admin-detail-open');
    renderDetail();
  }

  function closeDetail() {
    if (els.confirmationPanel && !els.confirmationPanel.hidden) {
      closeConfirmation();
    }
    state.selectedId = null;
    if (els.detailPanel) els.detailPanel.hidden = true;
    document.body.classList.remove('admin-detail-open');
    if (els.detailContent) els.detailContent.textContent = '';
    if (els.detailTitle) els.detailTitle.textContent = 'Select a booking';
    if (state.lastTrigger && state.lastTrigger.isConnected && typeof state.lastTrigger.focus === 'function') {
      state.lastTrigger.focus();
    }
    state.lastTrigger = null;
  }

  function createSummaryRow(label, value) {
    const row = document.createElement('div');
    row.className = 'admin-summary-row';

    const term = document.createElement('span');
    term.textContent = label;

    const def = document.createElement('strong');
    def.textContent = value || '—';

    row.appendChild(term);
    row.appendChild(def);
    return row;
  }

  function createDetailRow(label, valueNode) {
    const row = document.createElement('div');
    row.className = 'admin-detail-row';

    const labelEl = document.createElement('span');
    labelEl.className = 'admin-detail-label';
    labelEl.textContent = label;

    row.appendChild(labelEl);
    row.appendChild(valueNode);
    return row;
  }

  function appendTextValueRow(section, label, value) {
    const text = document.createElement('p');
    text.className = 'admin-detail-value';
    text.textContent = value || '—';
    section.appendChild(createDetailRow(label, text));
  }

  function appendLinkValueRow(section, label, textValue, href) {
    const value = document.createElement(textValue ? 'a' : 'p');
    value.className = 'admin-detail-link';
    if (textValue) {
      value.href = href;
    }
    value.textContent = textValue || '—';
    section.appendChild(createDetailRow(label, value));
  }

  function renderEmptyState(message) {
    const card = document.createElement('article');
    card.className = 'admin-empty-state';

    const title = document.createElement('h3');
    title.textContent = 'No bookings match this view.';

    const text = document.createElement('p');
    text.textContent = message || 'Try a different filter or search.';

    card.appendChild(title);
    card.appendChild(text);
    return card;
  }

  function renderBookings() {
    if (!els.bookingList) return;
    els.bookingList.textContent = '';

    if (state.loading) {
      const loading = document.createElement('article');
      loading.className = 'admin-empty-state';
      const title = document.createElement('h3');
      title.textContent = 'Loading bookings…';
      loading.appendChild(title);
      els.bookingList.appendChild(loading);
      if (els.bookingCount) els.bookingCount.textContent = '…';
      return;
    }

    const visible = getVisibleBookings();
    if (els.bookingCount) {
      els.bookingCount.textContent = visible.length + ' / ' + state.bookings.length;
    }

    if (!visible.length) {
      els.bookingList.appendChild(renderEmptyState('No bookings match this view.'));
      return;
    }

    const fragment = document.createDocumentFragment();
    visible.forEach(function (booking) {
      const card = document.createElement('article');
      const isNew = normalize(booking.status) === 'new';
      card.className = 'admin-booking-card' + (isNew ? ' is-new' : '');
      card.dataset.bookingId = String(booking.id);

      const header = document.createElement('header');
      header.className = 'admin-booking-card-header';

      const headingWrap = document.createElement('div');
      const kicker = document.createElement('p');
      kicker.className = 'admin-card-kicker';
      kicker.textContent = 'Reference';
      const heading = document.createElement('h3');
      heading.textContent = getBookingReference(booking);
      headingWrap.appendChild(kicker);
      headingWrap.appendChild(heading);

      const status = document.createElement('span');
      status.className = 'admin-status-pill';
      status.dataset.status = normalize(booking.status) || 'unknown';
      status.textContent = getStatusLabel(booking.status);

      header.appendChild(headingWrap);
      header.appendChild(status);

      const summary = document.createElement('div');
      summary.className = 'admin-summary-grid';
      summary.appendChild(createSummaryRow('Customer', booking.customer_name));
      summary.appendChild(createSummaryRow('Package', booking.package_name));
      summary.appendChild(createSummaryRow('Vehicle', [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(' ')));
      summary.appendChild(createSummaryRow('Preferred date', formatDate(booking.preferred_date)));
      summary.appendChild(createSummaryRow('Preferred time', booking.preferred_time_window));
      summary.appendChild(createSummaryRow('Starting price', booking.starting_price == null ? 'Assessment only' : formatCurrency(booking.starting_price)));
      summary.appendChild(createSummaryRow('Submitted', formatDateTime(booking.client_created_at || booking.created_at)));

      const footer = document.createElement('div');
      footer.className = 'admin-card-actions';

      const badge = document.createElement('span');
      badge.className = 'admin-request-badge';
      badge.textContent = isNew ? 'NEW REQUEST' : 'View booking';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button button-small admin-view-button';
      button.textContent = 'VIEW DETAILS';
      button.addEventListener('click', function () {
        openDetail(booking.id, button);
      });

      footer.appendChild(badge);
      footer.appendChild(button);

      card.appendChild(header);
      card.appendChild(summary);
      card.appendChild(footer);
      fragment.appendChild(card);
    });

    els.bookingList.appendChild(fragment);
    if (state.selectedId) {
      highlightActiveBooking(state.selectedId);
    }
  }

  function highlightActiveBooking(bookingId) {
    if (!els.bookingList) return;
    els.bookingList.querySelectorAll('.admin-booking-card').forEach(function (card) {
      card.classList.toggle('is-active', card.dataset.bookingId === String(bookingId));
    });
  }

  function renderDetailActions(booking) {
    const actions = document.createElement('div');
    actions.className = 'admin-detail-actions';

    const buttons = document.createElement('div');
    buttons.className = 'admin-action-buttons';

    ACTIONS.forEach(function (action) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'button button-ghost';
      btn.textContent = action.label;
      btn.disabled = state.updating || normalize(booking.status) === action.status;
      btn.addEventListener('click', function () {
        if (action.status === 'confirmed') {
          openConfirmation(booking, btn);
          return;
        }
        requestStatusChange(booking, action.status, btn);
      });
      buttons.appendChild(btn);
    });

    actions.appendChild(buttons);
    if (state.lastActionMessage) {
      const note = document.createElement('p');
      note.className = 'admin-detail-note';
      note.textContent = state.lastActionMessage;
      actions.appendChild(note);
    }
    return actions;
  }

  function renderDetail() {
    if (!els.detailContent || !els.detailTitle) return;
    els.detailContent.textContent = '';

    const booking = state.bookings.find(function (item) {
      return String(item.id) === String(state.selectedId);
    });

    if (!booking) {
      if (els.detailPanel) els.detailPanel.hidden = true;
      document.body.classList.remove('admin-detail-open');
      els.detailTitle.textContent = 'Select a booking';
      return;
    }

    els.detailPanel.hidden = false;
    els.detailTitle.textContent = getBookingReference(booking);

    const hero = document.createElement('section');
    hero.className = 'admin-detail-section admin-detail-hero';

    const heroTitle = document.createElement('h3');
    heroTitle.textContent = booking.customer_name || 'Unnamed customer';

    const heroMeta = document.createElement('p');
    heroMeta.className = 'admin-detail-hero-meta';
    heroMeta.textContent = [booking.package_name, getStatusLabel(booking.status)].filter(Boolean).join(' • ');

    const heroBadge = document.createElement('span');
    heroBadge.className = 'admin-status-pill';
    heroBadge.dataset.status = normalize(booking.status) || 'unknown';
    heroBadge.textContent = getStatusLabel(booking.status);

    hero.appendChild(heroBadge);
    hero.appendChild(heroTitle);
    hero.appendChild(heroMeta);

    const grid = document.createElement('div');
    grid.className = 'admin-detail-grid';

    const bookingSection = document.createElement('section');
    bookingSection.className = 'admin-detail-section';
    const bookingHeading = document.createElement('h4');
    bookingHeading.textContent = 'Booking';
    bookingSection.appendChild(bookingHeading);
    appendTextValueRow(bookingSection, 'Reference', getBookingReference(booking));
    appendTextValueRow(bookingSection, 'Status', getStatusLabel(booking.status));
    appendTextValueRow(bookingSection, 'Submitted', formatDateTime(booking.client_created_at || booking.created_at));
    appendTextValueRow(bookingSection, 'Database created', formatDateTime(booking.created_at));
    appendTextValueRow(bookingSection, 'Updated', formatDateTime(booking.updated_at));
    appendTextValueRow(bookingSection, 'Selection mode', booking.selection_mode);
    appendTextValueRow(bookingSection, 'Submission source', booking.submission_source);
    appendTextValueRow(bookingSection, 'Consent', booking.privacy_consent ? 'Yes' : 'No');
    appendTextValueRow(bookingSection, 'Consent version', booking.consent_version);

    const customerSection = document.createElement('section');
    customerSection.className = 'admin-detail-section';
    const customerHeading = document.createElement('h4');
    customerHeading.textContent = 'Customer';
    customerSection.appendChild(customerHeading);
    appendTextValueRow(customerSection, 'Name', booking.customer_name);
    appendLinkValueRow(customerSection, 'Email', booking.customer_email, 'mailto:' + booking.customer_email);
    appendLinkValueRow(customerSection, 'Phone', booking.customer_phone, 'tel:' + String(booking.customer_phone || '').replace(/\D/g, ''));
    appendTextValueRow(customerSection, 'City or ZIP', booking.city_zip);

    const vehicleSection = document.createElement('section');
    vehicleSection.className = 'admin-detail-section';
    const vehicleHeading = document.createElement('h4');
    vehicleHeading.textContent = 'Vehicle';
    vehicleSection.appendChild(vehicleHeading);
    appendTextValueRow(vehicleSection, 'Year', booking.vehicle_year);
    appendTextValueRow(vehicleSection, 'Make', booking.vehicle_make);
    appendTextValueRow(vehicleSection, 'Model', booking.vehicle_model);
    appendTextValueRow(vehicleSection, 'Type', booking.vehicle_type);

    const serviceSection = document.createElement('section');
    serviceSection.className = 'admin-detail-section';
    const serviceHeading = document.createElement('h4');
    serviceHeading.textContent = 'Service';
    serviceSection.appendChild(serviceHeading);
    appendTextValueRow(serviceSection, 'Package', booking.package_name);
    appendTextValueRow(serviceSection, 'Starting price', booking.starting_price == null ? 'Assessment only' : formatCurrency(booking.starting_price));
    appendTextValueRow(serviceSection, 'Assessment required', booking.assessment_required ? 'Yes' : 'No');
    appendTextValueRow(serviceSection, 'Photo status', booking.photo_status);
    appendTextValueRow(serviceSection, 'Photo count', booking.photo_count == null ? '0' : String(booking.photo_count));

    const services = parseSelection(booking.selected_services);
    const servicesWrap = document.createElement('div');
    servicesWrap.className = 'admin-detail-list-wrap';
    const servicesLabel = document.createElement('span');
    servicesLabel.className = 'admin-detail-label';
    servicesLabel.textContent = 'Selected services';
    servicesWrap.appendChild(servicesLabel);
    if (services.length) {
      const list = document.createElement('ul');
      list.className = 'admin-detail-list';
      services.forEach(function (service) {
        const item = document.createElement('li');
        if (service && typeof service === 'object') {
          item.textContent = [service.name, service.price ? '$' + service.price : ''].filter(Boolean).join(' — ');
        } else {
          item.textContent = String(service);
        }
        list.appendChild(item);
      });
      servicesWrap.appendChild(list);
    } else {
      const fallback = document.createElement('p');
      fallback.className = 'admin-detail-value';
      fallback.textContent = '—';
      servicesWrap.appendChild(fallback);
    }
    serviceSection.appendChild(servicesWrap);

    const confirmedFieldsPresent = [
      booking.confirmed_date,
      booking.confirmed_time,
      booking.final_price,
      booking.confirmed_location,
      booking.owner_message
    ].some(function (value) {
      return value != null && String(value).trim() !== '';
    });

    if (normalize(booking.status) === 'confirmed' || confirmedFieldsPresent) {
      const confirmationSection = document.createElement('section');
      confirmationSection.className = 'admin-detail-section';
      const confirmationHeading = document.createElement('h4');
      confirmationHeading.textContent = 'Confirmed Appointment';
      confirmationSection.appendChild(confirmationHeading);
      appendTextValueRow(confirmationSection, 'Confirmed date', formatDate(booking.confirmed_date));
      appendTextValueRow(confirmationSection, 'Confirmed time', formatReadableTime(booking.confirmed_time));
      appendTextValueRow(confirmationSection, 'Final price', booking.final_price == null ? '—' : formatCurrency(booking.final_price));
      appendTextValueRow(confirmationSection, 'Confirmed location', booking.confirmed_location);
      const ownerMessage = document.createElement('p');
      ownerMessage.className = 'admin-detail-value admin-detail-pre';
      ownerMessage.textContent = booking.owner_message || '—';
      confirmationSection.appendChild(createDetailRow('Owner message', ownerMessage));
      grid.appendChild(confirmationSection);
    }

    const requestSection = document.createElement('section');
    requestSection.className = 'admin-detail-section';
    const requestHeading = document.createElement('h4');
    requestHeading.textContent = 'Request';
    requestSection.appendChild(requestHeading);
    appendTextValueRow(requestSection, 'Preferred date', formatDate(booking.preferred_date));
    appendTextValueRow(requestSection, 'Preferred time window', booking.preferred_time_window);
    appendTextValueRow(requestSection, 'Interior condition', booking.interior_condition);
    const notes = document.createElement('p');
    notes.className = 'admin-detail-value admin-detail-pre';
    notes.textContent = booking.customer_notes || '—';
    requestSection.appendChild(createDetailRow('Customer notes', notes));

    const auditSection = document.createElement('section');
    auditSection.className = 'admin-detail-section';
    const auditHeading = document.createElement('h4');
    auditHeading.textContent = 'Audit';
    auditSection.appendChild(auditHeading);
    appendTextValueRow(auditSection, 'Booking ID', booking.id);
    appendTextValueRow(auditSection, 'Reference number', booking.reference_number);
    appendTextValueRow(auditSection, 'Client timestamp', formatDateTime(booking.client_created_at));
    appendTextValueRow(auditSection, 'Database timestamp', formatDateTime(booking.created_at));
    appendTextValueRow(auditSection, 'Last updated', formatDateTime(booking.updated_at));
    const notificationState = getNotificationState(booking);
    appendTextValueRow(auditSection, 'Customer notification', notificationState.label);
    appendTextValueRow(auditSection, 'Notification sent at', formatDateTime(booking.customer_notified_at));
    if (notificationState.state === 'failed') {
      appendTextValueRow(auditSection, 'Notification error', booking.customer_notification_error);
    }

    const actions = renderDetailActions(booking);

    grid.appendChild(bookingSection);
    grid.appendChild(customerSection);
    grid.appendChild(vehicleSection);
    grid.appendChild(serviceSection);
    grid.appendChild(requestSection);
    grid.appendChild(auditSection);
    grid.appendChild(actions);

    els.detailContent.appendChild(hero);
    els.detailContent.appendChild(grid);

    if (state.updating) {
      els.detailContent.classList.add('is-updating');
    } else {
      els.detailContent.classList.remove('is-updating');
    }
  }

  function isMissingColumnError(error) {
    return error && error.code === '42703';
  }

  function isRlsDeniedError(error) {
    const message = normalize(error && error.message);
    return error && (error.code === '42501' || message.includes('permission denied') || message.includes('row-level security') || message.includes('not authorized') || message.includes('forbidden'));
  }

  function isAuthExpiredError(error) {
    const message = normalize(error && error.message);
    return message.includes('jwt') || message.includes('session expired') || message.includes('token expired') || message.includes('invalid jwt');
  }

  async function fetchBookings() {
    const client = initSupabase();
    if (!client) {
      throw new Error('Supabase library was not loaded.');
    }

    const tries = [BOOKING_SELECT_PRIMARY, BOOKING_SELECT_FALLBACK];
    let lastError = null;

    for (let index = 0; index < tries.length; index += 1) {
      const result = await client
        .from('bookings')
        .select(tries[index])
        .order('created_at', { ascending: false });

      if (!result.error) {
        return Array.isArray(result.data) ? result.data : [];
      }

      lastError = result.error;
      if (!isMissingColumnError(result.error) || index === tries.length - 1) {
        throw result.error;
      }
    }

    throw lastError || new Error('Unable to load bookings.');
  }

  async function refreshBookings(options) {
    const settings = options || {};
    const showLoading = settings.showLoading !== false;
    const successMessage = settings.successMessage || '';
    const successTone = settings.successTone || 'success';
    const serial = ++state.loadingSerial;

    if (showLoading) {
      setLoading(true);
      setDashboardStatus('Loading bookings…', 'info');
      renderBookings();
    }

    try {
      const bookings = await fetchBookings();
      if (serial !== state.loadingSerial) return;

      state.bookings = bookings;
      state.loading = false;
      renderBookings();

      if (state.selectedId) {
        const active = state.bookings.find(function (booking) {
          return String(booking.id) === String(state.selectedId);
        });
        if (active) {
          state.selectedId = String(active.id);
          renderDetail();
          highlightActiveBooking(state.selectedId);
        } else {
          closeDetail();
        }
      }

      if (successMessage) {
        setDashboardStatus(successMessage, successTone);
      } else if (!state.bookings.length) {
        setDashboardStatus('No bookings match this view.', 'info');
      } else {
        setDashboardStatus('', '');
      }
    } catch (error) {
      if (serial !== state.loadingSerial) return;
      console.error('Failed to load bookings', error);
      state.loading = false;
      renderBookings();

      if (isRlsDeniedError(error)) {
        await forceSignOut('This account is not authorized to access the owner dashboard.');
        return;
      }

      if (isAuthExpiredError(error)) {
        await forceSignOut('Your secure session expired. Please sign in again.');
        return;
      }

      setDashboardStatus('We couldn’t load bookings. Try refreshing.', 'error');
    } finally {
      if (serial === state.loadingSerial) {
        setLoading(false);
      }
    }
  }

  async function ensureAccess(session, options) {
    const settings = options || {};
    if (!session || !session.user) {
      clearDashboard();
      setLoginVisible(true);
      if (settings.message) setAuthStatus(settings.message, settings.tone || 'error');
      return;
    }

    state.loading = true;
    setDashboardVisible(true);
    setDashboardStatus('Loading bookings…', 'info');
    await refreshBookings({ showLoading: true });
  }

  async function forceSignOut(message) {
    clearDashboard();
    setLoginVisible(true);
    setAuthStatus(message || 'Please sign in again.', 'error');
    state.nextSignedOutMessage = message || 'Please sign in again.';
    state.nextSignedOutTone = 'error';
    try {
      const client = initSupabase();
      if (client) {
        await client.auth.signOut();
      }
    } catch (error) {
      console.error('Sign-out failed', error);
    }
  }

  async function handleAuthStateChange(event, session) {
    if (event === 'SIGNED_OUT') {
      clearDashboard();
      setLoginVisible(true);
      setAuthStatus(state.nextSignedOutMessage || 'Signed out.', state.nextSignedOutTone || (state.nextSignedOutMessage ? 'error' : 'info'));
      state.nextSignedOutMessage = '';
      state.nextSignedOutTone = '';
      return;
    }

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      await ensureAccess(session, {});
    }
  }

  async function handleInitialSession() {
    const client = initSupabase();
    if (!client) {
      setLoginVisible(true);
      setAuthStatus('Supabase failed to load.', 'error');
      return;
    }

    const result = await client.auth.getSession();
    const session = result && result.data ? result.data.session : null;
    if (!session) {
      clearDashboard();
      setLoginVisible(true);
      return;
    }

    await ensureAccess(session, {});
  }

  async function handleSignIn(event) {
    event.preventDefault();
    const client = initSupabase();
    if (!client) {
      setAuthStatus('Supabase failed to load.', 'error');
      return;
    }

    const email = String(els.email && els.email.value ? els.email.value : '').trim();
    const password = String(els.password && els.password.value ? els.password.value : '');

    if (!email || !password) {
      setAuthStatus('Enter your email and password.', 'error');
      return;
    }

    setBusy(true);
    setAuthStatus('Signing in…', 'info');

    try {
      const result = await client.auth.signInWithPassword({ email: email, password: password });
      if (result.error || !result.data || !result.data.session) {
        console.warn('Sign-in attempt failed', result.error);
        setAuthStatus('Invalid email or password.', 'error');
        return;
      }

      setAuthStatus('Signed in successfully. Verifying dashboard access…', 'success');
      await ensureAccess(result.data.session, {});
    } catch (error) {
      console.error('Sign-in error', error);
      setAuthStatus('We couldn’t reach Supabase. Try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleRefresh() {
    if (state.loading || state.updating) return;
    await refreshBookings({ showLoading: true });
  }

  async function handleSignOut() {
    clearDashboard();
    setLoginVisible(true);
    state.nextSignedOutMessage = 'Signed out.';
    state.nextSignedOutTone = 'info';
    try {
      const client = initSupabase();
      if (client) {
        await client.auth.signOut();
      }
    } catch (error) {
      console.error('Sign-out error', error);
    }
  }

  function requestStatusChange(booking, nextStatus, button) {
    if (state.updating) return;

    const client = initSupabase();
    if (!client) {
      setDashboardStatus('Supabase failed to load.', 'error');
      return;
    }

    const label = getStatusLabel(nextStatus);
    const reference = getBookingReference(booking);
    const confirmed = window.confirm('Change booking ' + reference + ' to ' + label + '?');
    if (!confirmed) return;

    state.lastTrigger = button || state.lastTrigger;
    state.lastActionMessage = '';
    setBusy(true);
    setDashboardStatus('Updating booking status…', 'info');
    renderDetail();

    client
      .from('bookings')
      .update({
        status: nextStatus
      })
      .eq('id', booking.id)
      .select('id, status, updated_at')
      .single()
      .then(async function (result) {
        if (result.error) {
          console.error('Booking status update failed', result.error);
          setDashboardStatus('Couldn’t update booking. ' + (result.error.message || 'Unknown error.'), 'error');
          return;
        }

        setDashboardStatus('Booking updated. Waiting for customer email…', 'info');
        const notificationResult = await waitForCustomerNotification(booking.id, nextStatus);
        state.lastActionMessage = notificationResult.message;
        const notificationTone = notificationResult.pending ? 'info' : (notificationResult.ok ? 'success' : 'error');
        setDashboardStatus(notificationResult.message, notificationTone);
        await refreshBookings({
          showLoading: false,
          successMessage: notificationResult.message,
          successTone: notificationTone
        });
        state.selectedId = String(booking.id);
        highlightActiveBooking(state.selectedId);
        renderDetail();
      })
      .catch(function (error) {
        console.error('Booking status update error', error);
        setDashboardStatus('Couldn’t update booking. ' + (error && error.message ? error.message : 'Unknown error.'), 'error');
      })
      .finally(function () {
        setBusy(false);
        renderDetail();
      });
  }

  async function handleConfirmationSubmit(event) {
    event.preventDefault();
    if (state.updating) return;

    const booking = getBookingById(state.confirmationBookingId || state.selectedId);
    const client = initSupabase();
    if (!client) {
      setConfirmationStatus('Supabase failed to load.', 'error');
      return;
    }

    if (!booking) {
      setConfirmationStatus('Select a booking before confirming.', 'error');
      return;
    }

    const values = getConfirmationFormValues();
    const payload = validateConfirmationForm(values);
    if (!payload) return;

    setBusy(true);
    setConfirmationStatus('Saving confirmation details…', 'info');

    try {
      const result = await client
        .from('bookings')
        .update({
          status: 'confirmed',
          confirmed_date: payload.confirmed_date,
          confirmed_time: payload.confirmed_time,
          final_price: payload.final_price,
          confirmed_location: payload.confirmed_location,
          owner_message: payload.owner_message,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id)
        .select('id, status, confirmed_date, confirmed_time, final_price, confirmed_location, owner_message, updated_at')
        .single();

      if (result.error) {
        console.error('Booking confirmation failed', result.error);
        setConfirmationStatus('Couldn’t confirm booking. ' + (result.error.message || 'Unknown error.'), 'error');
        return;
      }

      const updatedBooking = result.data || {};
      state.bookings = state.bookings.map(function (item) {
        if (String(item.id) !== String(booking.id)) return item;
        return Object.assign({}, item, updatedBooking);
      });
      state.selectedId = String(booking.id);
      setConfirmationStatus('Booking updated. Waiting for customer email…', 'info');
      const notificationResult = await waitForCustomerNotification(booking.id, 'confirmed');
      state.lastActionMessage = notificationResult.message;
      const notificationTone = notificationResult.pending ? 'info' : (notificationResult.ok ? 'success' : 'error');
      setDashboardStatus(notificationResult.message, notificationTone);
      closeConfirmation();
      await refreshBookings({
        showLoading: false,
        successMessage: notificationResult.message,
        successTone: notificationTone
      });
      highlightActiveBooking(state.selectedId);
    } catch (error) {
      console.error('Booking confirmation error', error);
      setConfirmationStatus('Couldn’t confirm booking. ' + (error && error.message ? error.message : 'Unknown error.'), 'error');
    } finally {
      setBusy(false);
      renderDetail();
    }
  }

  function bindEvents() {
    if (els.loginForm) {
      els.loginForm.addEventListener('submit', handleSignIn);
    }
    if (els.refreshButton) {
      els.refreshButton.addEventListener('click', handleRefresh);
    }
    if (els.signOutButton) {
      els.signOutButton.addEventListener('click', handleSignOut);
    }
    if (els.search) {
      els.search.addEventListener('input', function () {
        state.search = els.search.value.trim();
        renderBookings();
      });
    }
    if (els.statusFilter) {
      els.statusFilter.addEventListener('change', function () {
        state.filter = els.statusFilter.value || 'new';
        renderBookings();
      });
    }
    if (els.closeDetail) {
      els.closeDetail.addEventListener('click', closeDetail);
    }
    if (els.confirmationForm) {
      els.confirmationForm.addEventListener('submit', handleConfirmationSubmit);
    }
    if (els.closeConfirmation) {
      els.closeConfirmation.addEventListener('click', closeConfirmation);
    }
    if (els.cancelConfirmation) {
      els.cancelConfirmation.addEventListener('click', closeConfirmation);
    }
    if (els.confirmationPanel) {
      els.confirmationPanel.addEventListener('click', function (event) {
        if (event.target && event.target.dataset && event.target.dataset.closeConfirmation === 'true') {
          closeConfirmation();
        }
      });
    }
    if (els.detailPanel) {
      els.detailPanel.addEventListener('click', function (event) {
        if (event.target && event.target.dataset && event.target.dataset.closeDetail === 'true') {
          closeDetail();
        }
      });
    }
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && els.confirmationPanel && !els.confirmationPanel.hidden) {
        closeConfirmation();
        return;
      }
      if (event.key === 'Escape' && els.detailPanel && !els.detailPanel.hidden) {
        closeDetail();
      }
    });
  }

  async function init() {
    initElements();
    bindEvents();

    if (!window.supabase) {
      setLoginVisible(true);
      setAuthStatus('Supabase failed to load.', 'error');
      return;
    }

    const client = initSupabase();
    if (!client) {
      setLoginVisible(true);
      setAuthStatus('Supabase failed to load.', 'error');
      return;
    }

    client.auth.onAuthStateChange(function (event, session) {
      handleAuthStateChange(event, session);
    });

    await handleInitialSession();
    if (els.statusFilter) {
      els.statusFilter.value = state.filter;
    }
    renderBookings();
  }

  init();
})();

const BRAND_NAME = 'TopNotch DetailLab';
const TAGLINE = 'Detailing Beyond Expectations';
const SUPPORTED_STATUSES = new Set(['confirmed', 'more_info_needed', 'declined', 'completed', 'cancelled']);
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || '';
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') || 'hello@topnotchdetaillab.com';
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') || BRAND_NAME;
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET');

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL is not configured.');
}

if (!WEBHOOK_SECRET) {
  throw new Error('WEBHOOK_SECRET is not configured.');
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body, null, 2), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function normalize(value) {
  return String(value == null ? '' : value).toLowerCase().trim();
}

function trimValue(value) {
  return String(value == null ? '' : value).trim();
}

function escapeHtml(value) {
  return trimValue(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function withLineBreaks(value) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function isPresent(value) {
  return trimValue(value) !== '';
}

function money(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);
}

function formatDate(value) {
  if (!isPresent(value)) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function formatTime(value) {
  if (!isPresent(value)) return '—';
  const parts = String(value).split(':');
  if (parts.length < 2) return escapeHtml(value);
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return escapeHtml(value);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function getReferenceNumber(record) {
  return trimValue(record.reference_number || record.id || '—');
}

function getBookingId(record) {
  return trimValue(record.id);
}

function customerFirstName(record) {
  const fullName = trimValue(record.customer_name);
  if (!fullName) return 'there';
  return fullName.split(/\s+/)[0] || 'there';
}

function getPackageDisplayName(record, fallback) {
  return trimValue(record.package_name || fallback || 'TopNotch DetailLab service');
}

function buildPackageIntro(packageName) {
  const key = normalize(packageName);
  if (key === 'quick reset') {
    return 'Your Quick Reset is locked in and ready for a focused interior refresh that restores the essentials.';
  }
  if (key === 'full reset') {
    return 'Your Full Reset is confirmed. We’re preparing a thorough interior service designed to refresh the main surfaces, glass, and everyday buildup throughout your vehicle.';
  }
  if (key === 'deep reset') {
    return 'Your Deep Reset is confirmed. We’re preparing for a more detailed interior service focused on buildup, tight areas, vents, crevices, and the condition-specific work included in your booking.';
  }
  if (key === 'recovery' || key === 'recovery assessment') {
    return 'Your Recovery service is confirmed based on the scope reviewed. We’ll focus on the severe interior conditions identified and complete the approved work with the care the vehicle requires.';
  }
  if (key === 'build your own reset' || key === 'custom' || key === 'build your own') {
    return 'Your custom TopNotch Reset is confirmed. We’ll complete the services selected and approved for your vehicle based on the confirmed scope.';
  }
  return 'Your TopNotch DetailLab appointment is officially confirmed.';
}

function buildVehicleDisplay(record) {
  const year = trimValue(record.vehicle_year);
  const make = trimValue(record.vehicle_make);
  const model = trimValue(record.vehicle_model);
  const type = trimValue(record.vehicle_type);
  const vehicle = [year, make, model].filter(Boolean).join(' ');
  const description = vehicle || type || '';
  if (!description) return '';
  return type && type !== description ? `${description} (${type})` : description;
}

function formatArrivalWindow(value) {
  const raw = trimValue(value);
  const labels = {
    '8:00 AM-10:00 AM': '8:00 AM–10:00 AM',
    '10:00 AM-12:00 PM': '10:00 AM–12:00 PM',
    '12:00 PM-2:00 PM': '12:00 PM–2:00 PM',
    '2:00 PM-4:00 PM': '2:00 PM–4:00 PM',
    '4:00 PM-6:00 PM': '4:00 PM–6:00 PM',
    Flexible: 'Flexible'
  };
  if (!raw) return '';
  return labels[raw] || raw;
}

function buildServiceLocationLines(record) {
  const street = trimValue(record.service_street_address);
  const unit = trimValue(record.service_unit);
  const city = trimValue(record.service_city);
  const state = trimValue(record.service_state);
  const zip = trimValue(record.service_zip);
  const legacy = trimValue(record.city_zip);
  if (!street) return legacy ? [legacy] : [];
  const lines = [street];
  if (unit) lines.push(unit);
  if (city || state || zip) {
    const cityState = [city, state].filter(Boolean).join(', ');
    const cityStateZip = [cityState, zip].filter(Boolean).join(cityState && zip ? ' ' : '');
    if (cityStateZip) lines.push(cityStateZip);
  }
  return lines.filter(Boolean);
}

function buildServiceLocationDisplay(record) {
  const lines = buildServiceLocationLines(record);
  return lines.length ? lines.join('\n') : '';
}

function buildConfirmedLocationDisplay(record) {
  const confirmedLocation = trimValue(record.confirmed_location);
  return confirmedLocation || buildServiceLocationDisplay(record);
}

function buildDetailTable(rows) {
  const filtered = rows.filter(function (row) {
    return row && row.value !== null && row.value !== undefined && String(row.value).trim() !== '';
  });
  if (!filtered.length) return '';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;margin:20px 0 8px 0;table-layout:fixed;">
      <tbody>
        ${filtered.map(function (row) {
          const value = row.multiline ? String(row.value).split('\n').map(escapeHtml).join('<br>') : escapeHtml(row.value);
          return `
            <tr>
              <td style="padding:12px 12px 12px 0;border-bottom:1px solid #2a2a2a;color:#ff8b91;font-size:12px;line-height:1.3;font-weight:700;letter-spacing:.12em;text-transform:uppercase;vertical-align:top;width:36%;">${escapeHtml(row.label)}</td>
              <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:15px;line-height:1.6;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;white-space:${row.multiline ? 'pre-line' : 'normal'};">${value}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function buildNoteBox(title, message) {
  const value = trimValue(message);
  if (!value) return '';
  return `
    <div style="margin-top:18px;padding:16px 18px;border:1px solid #3a1216;border-radius:18px;background:#141414;">
      <div style="margin:0 0 8px 0;color:#ff8b91;font-size:12px;line-height:1.3;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">${escapeHtml(title)}</div>
      <div style="margin:0;color:#f2f2f2;font-size:15px;line-height:1.6;white-space:pre-line;overflow-wrap:anywhere;">${withLineBreaks(value)}</div>
    </div>
  `;
}

function buildEmailShell(preheader, bodyHtml) {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#090909;color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#090909;border-collapse:collapse;">
          <tbody>
            <tr>
              <td align="center" style="padding:24px 12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;border-collapse:collapse;">
                  <tbody>
                    <tr>
                      <td align="center" style="padding:0 0 16px 0;text-align:center;">
                        <div style="font-size:12px;line-height:1.3;letter-spacing:.24em;text-transform:uppercase;color:#ff5a5f;font-weight:700;">${escapeHtml(BRAND_NAME)}</div>
                        <div style="margin-top:8px;font-size:14px;line-height:1.4;color:#d8d8d8;">${escapeHtml(TAGLINE)}</div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div style="background:#111111;border:1px solid #2a2a2a;border-radius:24px;padding:32px 28px;box-shadow:0 20px 60px rgba(0,0,0,.45);">
                          ${bodyHtml}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding:16px 8px 0 8px;text-align:center;color:#8b8b8b;font-size:12px;line-height:1.5;">
                        <div>${escapeHtml(BRAND_NAME)}</div>
                        <div>${escapeHtml(TAGLINE)}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `;
}

function buildConfirmedEmail(record) {
  const packageName = getPackageDisplayName(record, 'TopNotch DetailLab service');
  const customerName = customerFirstName(record);
  const reference = getReferenceNumber(record);
  const confirmedDate = formatDate(record.confirmed_date || record.preferred_date);
  const confirmedTime = isPresent(record.confirmed_time) ? formatTime(record.confirmed_time) : '';
  const serviceLocation = buildConfirmedLocationDisplay(record);
  const vehicle = buildVehicleDisplay(record);
  const finalPriceValue = record.final_price == null ? record.starting_price : record.final_price;
  const finalPrice = isPresent(finalPriceValue) ? money(finalPriceValue) : '';
  const intro = buildPackageIntro(packageName);

  const detailRows = [
    { label: 'Reference', value: reference },
    { label: 'Service', value: packageName },
    { label: 'Vehicle', value: vehicle },
    { label: 'Confirmed date', value: confirmedDate },
    { label: 'Confirmed time', value: confirmedTime },
    { label: 'Service location', value: serviceLocation, multiline: true },
    { label: 'Final price', value: finalPrice }
  ];

  const text = [
    `Hello ${customerName},`,
    '',
    intro,
    '',
    `Reference: ${reference}`,
    `Service: ${packageName}`,
    vehicle ? `Vehicle: ${vehicle}` : null,
    confirmedDate ? `Confirmed date: ${confirmedDate}` : null,
    confirmedTime ? `Confirmed time: ${confirmedTime}` : null,
    serviceLocation ? `Service location:\n${serviceLocation}` : null,
    finalPrice ? `Final price: ${finalPrice}` : null,
    '',
    'Please review your appointment details carefully. If anything needs to be corrected, reply to this email as soon as possible.',
    '',
    'Your appointment is now reserved. We look forward to delivering interior care that goes beyond expectations.',
    '',
    BRAND_NAME,
    TAGLINE
  ].filter(Boolean);

  return {
    subject: `${BRAND_NAME}: your ${packageName} is confirmed`,
    preheader: `${packageName} appointment confirmed for ${confirmedDate || 'your requested date'}.`,
    text: text.join('\n'),
    html: buildEmailShell(
      `${packageName} appointment confirmed.`,
      `
        <div style="margin:0 0 12px 0;color:#ff5a5f;font-size:11px;line-height:1.3;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">Appointment confirmed</div>
        <h1 style="margin:0 0 16px 0;color:#ffffff;font-size:32px;line-height:1.05;">Hello ${escapeHtml(customerName)},</h1>
        <p style="margin:0 0 16px 0;color:#e7e7e7;font-size:16px;line-height:1.6;">${escapeHtml(intro)}</p>
        ${buildDetailTable(detailRows)}
        <p style="margin:16px 0 0 0;color:#e7e7e7;font-size:16px;line-height:1.6;">Please review your appointment details carefully. If anything needs to be corrected, reply to this email as soon as possible.</p>
        <p style="margin:16px 0 0 0;color:#e7e7e7;font-size:16px;line-height:1.6;">Your appointment is now reserved. We look forward to delivering interior care that goes beyond expectations.</p>
      `
    )
  };
}

function buildMoreInfoEmail(record) {
  const customerName = customerFirstName(record);
  const reference = getReferenceNumber(record);
  const note = trimValue(record.status_message || record.owner_message);

  const text = [
    `Hello ${customerName},`,
    '',
    'We’ve reviewed your booking request and need one more detail before we can confirm your appointment.',
    note ? `What we need from you:\n${note}` : null,
    '',
    'Reply directly to this email with the requested information. Your appointment is still pending and has not been confirmed.',
    '',
    BRAND_NAME,
    TAGLINE
  ].filter(Boolean);

  return {
    subject: `${BRAND_NAME}: one more detail needed`,
    preheader: 'We need one more detail before confirming your appointment.',
    text: text.join('\n'),
    html: buildEmailShell(
      'We need one more detail before confirming your appointment.',
      `
        <div style="margin:0 0 12px 0;color:#ff5a5f;font-size:11px;line-height:1.3;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">More information needed</div>
        <h1 style="margin:0 0 16px 0;color:#ffffff;font-size:32px;line-height:1.05;">Hello ${escapeHtml(customerName)},</h1>
        <p style="margin:0 0 16px 0;color:#e7e7e7;font-size:16px;line-height:1.6;">We’ve reviewed your booking request and need one more detail before we can confirm your appointment.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;border-collapse:collapse;margin:20px 0 8px 0;table-layout:fixed;">
          <tbody>
            <tr>
              <td style="padding:12px 12px 12px 0;border-bottom:1px solid #2a2a2a;color:#ff8b91;font-size:12px;line-height:1.3;font-weight:700;letter-spacing:.12em;text-transform:uppercase;vertical-align:top;width:36%;">Reference</td>
              <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;color:#ffffff;font-size:15px;line-height:1.6;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(reference)}</td>
            </tr>
          </tbody>
        </table>
        ${note ? buildNoteBox('WHAT WE NEED FROM YOU', note) : ''}
        <p style="margin:16px 0 0 0;color:#e7e7e7;font-size:16px;line-height:1.6;">Reply directly to this email with the requested information. Your appointment is still pending and has not been confirmed.</p>
      `
    )
  };
}

function buildDeclinedEmail(record) {
  const customerName = customerFirstName(record);
  const reference = getReferenceNumber(record);
  const packageName = getPackageDisplayName(record, 'your request');
  const ownerReason = trimValue(record.status_message || record.owner_message);

  const text = [
    `Hello ${customerName},`,
    '',
    'Thank you for considering TopNotch DetailLab.',
    '',
    'After reviewing your request, we’re unable to accept or schedule this particular service at this time.',
    ownerReason ? `Reason:\n${ownerReason}` : null,
    '',
    'Your appointment was not confirmed, and no payment has been collected.',
    '',
    'We appreciate the opportunity to review your request and hope we may be able to serve you another time.',
    '',
    BRAND_NAME,
    TAGLINE
  ].filter(Boolean);

  return {
    subject: `Update on your TopNotch DetailLab request`,
    preheader: 'Your request has been declined.',
    text: text.join('\n'),
    html: buildEmailShell(
      'Your request has been declined.',
      `
        <div style="margin:0 0 12px 0;color:#ff5a5f;font-size:11px;line-height:1.3;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">Booking update</div>
        <h1 style="margin:0 0 16px 0;color:#ffffff;font-size:32px;line-height:1.05;">Hello ${escapeHtml(customerName)},</h1>
        <p style="margin:0 0 16px 0;color:#e7e7e7;font-size:16px;line-height:1.6;">Thank you for considering TopNotch DetailLab.</p>
        <p style="margin:0 0 16px 0;color:#e7e7e7;font-size:16px;line-height:1.6;">After reviewing your request, we’re unable to accept or schedule this particular service at this time.</p>
        ${buildDetailTable([{ label: 'Reference', value: reference }, { label: 'Service', value: packageName }])}
        ${ownerReason ? buildNoteBox('Owner reason', ownerReason) : ''}
        <p style="margin:16px 0 0 0;color:#e7e7e7;font-size:16px;line-height:1.6;">Your appointment was not confirmed, and no payment has been collected.</p>
        <p style="margin:16px 0 0 0;color:#e7e7e7;font-size:16px;line-height:1.6;">We appreciate the opportunity to review your request and hope we may be able to serve you another time.</p>
      `
    )
  };
}

function buildCompletedEmail(record) {
  const customerName = customerFirstName(record);
  const reference = getReferenceNumber(record);
  const packageName = getPackageDisplayName(record, 'TopNotch DetailLab service');

  const text = [
    `Hello ${customerName},`,
    '',
    `Your ${packageName} has been marked complete.`,
    '',
    `Reference number: ${reference}`,
    '',
    'Thank you for trusting TopNotch DetailLab with your vehicle’s interior.',
    'We hope the finished result didn’t just meet expectations—it went beyond them.',
    '',
    'Your support means a great deal as TopNotch DetailLab continues to grow, and we would be honored to care for your vehicle again.',
    '',
    BRAND_NAME,
    TAGLINE
  ];

  return {
    subject: 'Your TopNotch DetailLab service is complete',
    preheader: `${packageName} has been marked complete.`,
    text: text.join('\n'),
    html: buildEmailShell(
      'Your service is complete.',
      `
        <div style="margin:0 0 12px 0;color:#ff5a5f;font-size:11px;line-height:1.3;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">Service complete</div>
        <h1 style="margin:0 0 16px 0;color:#ffffff;font-size:32px;line-height:1.05;">Hello ${escapeHtml(customerName)},</h1>
        <p style="margin:0 0 16px 0;color:#e7e7e7;font-size:16px;line-height:1.6;">Your ${escapeHtml(packageName)} has been marked complete.</p>
        ${buildDetailTable([{ label: 'Reference', value: reference }, { label: 'Service', value: packageName }])}
        <p style="margin:16px 0 0 0;color:#e7e7e7;font-size:16px;line-height:1.6;">Thank you for trusting TopNotch DetailLab with your vehicle’s interior.</p>
        <p style="margin:16px 0 0 0;color:#e7e7e7;font-size:16px;line-height:1.6;">We hope the finished result didn’t just meet expectations—it went beyond them.</p>
        <p style="margin:16px 0 0 0;color:#e7e7e7;font-size:16px;line-height:1.6;">Your support means a great deal as TopNotch DetailLab continues to grow, and we would be honored to care for your vehicle again.</p>
      `
    )
  };
}

function buildCancelledEmail(record) {
  const customerName = customerFirstName(record);
  const reference = getReferenceNumber(record);
  const packageName = getPackageDisplayName(record, 'TopNotch DetailLab appointment');
  const ownerReason = trimValue(record.status_message || record.owner_message);
  const confirmedDate = formatDate(record.confirmed_date);
  const confirmedTime = isPresent(record.confirmed_time) ? formatTime(record.confirmed_time) : '';

  const text = [
    `Hello ${customerName},`,
    '',
    'Your TopNotch DetailLab appointment has been cancelled and is no longer scheduled.',
    confirmedDate ? `Confirmed date: ${confirmedDate}` : null,
    confirmedTime ? `Confirmed time: ${confirmedTime}` : null,
    ownerReason ? `Reason:\n${ownerReason}` : null,
    '',
    'No further action is required. When you’re ready, you’re welcome to submit a new booking request through the TopNotch DetailLab website.',
    '',
    BRAND_NAME,
    TAGLINE
  ].filter(Boolean);

  return {
    subject: 'Your TopNotch DetailLab appointment has been cancelled',
    preheader: 'Your appointment has been cancelled.',
    text: text.join('\n'),
    html: buildEmailShell(
      'Your appointment has been cancelled.',
      `
        <div style="margin:0 0 12px 0;color:#ff5a5f;font-size:11px;line-height:1.3;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">Appointment cancelled</div>
        <h1 style="margin:0 0 16px 0;color:#ffffff;font-size:32px;line-height:1.05;">Hello ${escapeHtml(customerName)},</h1>
        <p style="margin:0 0 16px 0;color:#e7e7e7;font-size:16px;line-height:1.6;">Your TopNotch DetailLab appointment has been cancelled and is no longer scheduled.</p>
        ${buildDetailTable([
          { label: 'Reference', value: reference },
          { label: 'Service', value: packageName },
          { label: 'Confirmed date', value: confirmedDate },
          { label: 'Confirmed time', value: confirmedTime }
        ])}
        ${ownerReason ? buildNoteBox('Owner explanation', ownerReason) : ''}
        <p style="margin:16px 0 0 0;color:#e7e7e7;font-size:16px;line-height:1.6;">No further action is required. When you’re ready, you’re welcome to submit a new booking request through the TopNotch DetailLab website.</p>
      `
    )
  };
}

function buildEmailPayload(record) {
  const status = normalize(record.status);
  if (status === 'confirmed') return buildConfirmedEmail(record);
  if (status === 'more_info_needed') return buildMoreInfoEmail(record);
  if (status === 'declined') return buildDeclinedEmail(record);
  if (status === 'completed') return buildCompletedEmail(record);
  if (status === 'cancelled') return buildCancelledEmail(record);
  return null;
}

async function supabaseFetch(path, options) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
      'content-type': 'application/json',
      ...(options && options.headers ? options.headers : {})
    }
  });

  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (parseError) {
    data = raw;
  }

  if (!response.ok) {
    const message = data && data.message ? data.message : (typeof data === 'string' ? data : `Request failed (${response.status})`);
    throw new Error(message);
  }

  return data;
}

async function claimNotificationEvent(record, previousRecord) {
  const sourceUpdatedAt = trimValue(record.updated_at);
  if (!sourceUpdatedAt) {
    throw new Error('Webhook payload is missing an update timestamp.');
  }
  const dedupeKey = [
    getBookingId(record),
    normalize(record.status),
    sourceUpdatedAt
  ].join(':');

  const payload = {
    dedupe_key: dedupeKey,
    booking_id: getBookingId(record),
    booking_status: normalize(record.status),
    source_updated_at: sourceUpdatedAt,
    state: 'processing',
    brevo_message_id: null,
    error: null
  };

  const response = await supabaseFetch('/rest/v1/customer_notification_events?on_conflict=dedupe_key', {
    method: 'POST',
    headers: {
      prefer: 'resolution=ignore-duplicates,return=representation'
    },
    body: JSON.stringify(payload)
  });

  if (!Array.isArray(response) || response.length === 0) {
    console.info('Skipping duplicate customer notification webhook', { dedupeKey });
    return { claimed: false, dedupeKey };
  }

  return { claimed: true, dedupeKey, event: response[0] };
}

async function updateNotificationEvent(dedupeKey, patch) {
  await supabaseFetch(`/rest/v1/customer_notification_events?dedupe_key=eq.${encodeURIComponent(dedupeKey)}`, {
    method: 'PATCH',
    headers: {
      prefer: 'return=representation'
    },
    body: JSON.stringify({
      ...patch,
      updated_at: new Date().toISOString()
    })
  });
}

async function updateBooking(bookingId, patch) {
  return await supabaseFetch(`/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, {
    method: 'PATCH',
    headers: {
      prefer: 'return=representation'
    },
    body: JSON.stringify(patch)
  });
}

async function sendBrevoEmail(email) {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured.');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify(email)
  });

  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (parseError) {
    data = raw;
  }

  if (!response.ok) {
    const message = data && data.message ? data.message : (typeof data === 'string' ? data : `Brevo request failed (${response.status})`);
    throw new Error(message);
  }

  return data;
}

function buildBrevoEmail(record) {
  const template = buildEmailPayload(record);
  if (!template) return null;

  const customerName = trimValue(record.customer_name || 'there');
  const customerEmail = trimValue(record.customer_email);
  const subject = template.subject;
  const htmlContent = template.html;
  const textContent = template.text;

  return {
    sender: {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL
    },
    to: [
      {
        email: customerEmail,
        name: customerName
      }
    ],
    replyTo: {
      email: BREVO_SENDER_EMAIL,
      name: BREVO_SENDER_NAME
    },
    subject,
    htmlContent,
    textContent
  };
}

Deno.serve(async function (request) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (WEBHOOK_SECRET) {
    const receivedSecret = request.headers.get('x-topnotch-webhook-secret') || '';
    if (receivedSecret !== WEBHOOK_SECRET) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Invalid JSON payload', details: error.message }, 400);
  }

  if (!payload || normalize(payload.type) !== 'update' || normalize(payload.schema) !== 'public' || normalize(payload.table) !== 'bookings') {
    return jsonResponse({ ok: true, ignored: true });
  }

  const record = payload.record || {};
  const previousRecord = payload.old_record || {};
  const nextStatus = normalize(record.status);
  const previousStatus = normalize(previousRecord.status);

  if (!record.id) {
    return jsonResponse({ error: 'Missing booking id' }, 400);
  }

  if (nextStatus === previousStatus || !SUPPORTED_STATUSES.has(nextStatus)) {
    return jsonResponse({ ok: true, ignored: true, status: nextStatus });
  }

  const customerEmail = trimValue(record.customer_email);
  const customerName = trimValue(record.customer_name);
  if (!customerEmail || !customerName) {
    await updateBooking(getBookingId(record), {
      customer_notification_error: 'Missing customer name or email address.',
      customer_notified_status: null,
      customer_notified_at: null
    }).catch(function () {
      /* ignore */
    });
    return jsonResponse({ error: 'Missing customer name or email address.' }, 422);
  }

  const email = buildBrevoEmail(record);
  if (!email) {
    return jsonResponse({ error: 'Unsupported status.' }, 400);
  }

  const claim = await claimNotificationEvent(record, previousRecord);
  if (!claim.claimed) {
    return jsonResponse({ ok: true, duplicate: true, dedupe_key: claim.dedupeKey });
  }

  const bookingId = getBookingId(record);

  await updateBooking(bookingId, {
    customer_notified_status: null,
    customer_notified_at: null,
    customer_notification_error: null
  });

  try {
    const brevoResult = await sendBrevoEmail(email);
    await updateNotificationEvent(claim.dedupeKey, {
      state: 'sent',
      brevo_message_id: brevoResult && brevoResult.messageId ? String(brevoResult.messageId) : null,
      error: null
    });

    await updateBooking(bookingId, {
      customer_notified_status: nextStatus,
      customer_notified_at: new Date().toISOString(),
      customer_notification_error: null
    });

    return jsonResponse({
      ok: true,
      status: nextStatus,
      booking_id: bookingId,
      dedupe_key: claim.dedupeKey
    });
  } catch (error) {
    const message = error && error.message ? error.message : 'Unknown Brevo delivery failure.';
    await updateNotificationEvent(claim.dedupeKey, {
      state: 'failed',
      error: message
    }).catch(function () {
      /* ignore */
    });

    await updateBooking(bookingId, {
      customer_notification_error: message,
      customer_notified_status: null,
      customer_notified_at: null
    }).catch(function () {
      /* ignore */
    });

    return jsonResponse({ error: message }, 502);
  }
});

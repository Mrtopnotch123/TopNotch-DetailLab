const BRAND_NAME = 'TopNotch DetailLab';
const TAGLINE = 'Detailing Beyond Expectations';
const SUPPORTED_STATUSES = new Set(['confirmed', 'more_info_needed', 'declined', 'completed', 'cancelled']);
const PACKAGE_COPY = {
  'quick reset': 'Your Quick Reset is locked in and ready for a focused refresh that restores the essentials.',
  'full reset': 'Your Full Reset is confirmed for a more complete interior revival with elevated care.',
  'deep reset': 'Your Deep Reset is confirmed and prepared for a thorough, detail-driven transformation.',
  'recovery reset': 'Your Recovery Reset is confirmed for a careful, assessment-led restoration.',
  'build your own reset': 'Your Build Your Own Reset is confirmed with your custom selections in place.'
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://okesvucbkkjgxiqfulqf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || '';
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') || 'hello@topnotchdetaillab.com';
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') || BRAND_NAME;
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') || '';

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
  if (!Number.isFinite(amount)) return '—';
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

function buildPackageCopy(packageName) {
  const key = normalize(packageName);
  return PACKAGE_COPY[key] || 'Your appointment is confirmed and our team is ready to deliver premium detail work.';
}

function getReferenceNumber(record) {
  return trimValue(record.reference_number || record.id || '—');
}

function getBookingId(record) {
  return trimValue(record.id);
}

function buildConfirmedEmail(record) {
  const packageName = trimValue(record.package_name || 'your service');
  const packageCopy = buildPackageCopy(packageName);
  const customerName = trimValue(record.customer_name || 'there');
  const ownerMessage = trimValue(record.owner_message);
  const reference = getReferenceNumber(record);
  const confirmedDate = formatDate(record.confirmed_date || record.preferred_date);
  const confirmedTime = formatTime(record.confirmed_time || record.preferred_time_window);
  const confirmedLocation = trimValue(record.confirmed_location || '—');
  const finalPrice = money(record.final_price == null ? record.starting_price : record.final_price);

  const text = [
    `Hi ${customerName},`,
    '',
    packageCopy,
    '',
    `Reference number: ${reference}`,
    `Confirmed date: ${confirmedDate}`,
    `Confirmed time: ${confirmedTime}`,
    `Confirmed location: ${confirmedLocation}`,
    `Final price: ${finalPrice}`
  ];

  if (ownerMessage) {
    text.push('', `Owner message: ${ownerMessage}`);
  }

  text.push('', `${BRAND_NAME}`, TAGLINE);

  return {
    subject: `${BRAND_NAME}: your ${packageName} is confirmed`,
    preheader: `${packageName} appointment confirmed for ${confirmedDate}.`,
    text: text.join('\n'),
    html: `
      <div class="card">
        <p class="eyebrow">Appointment confirmed</p>
        <h1>Hello ${escapeHtml(customerName)},</h1>
        <p>${escapeHtml(packageCopy)}</p>
        <div class="highlight">
          <div class="highlight-label">Reference number</div>
          <div class="highlight-value">${escapeHtml(reference)}</div>
        </div>
        <div class="details">
          <div class="row"><span>Date</span><strong>${escapeHtml(confirmedDate)}</strong></div>
          <div class="row"><span>Time</span><strong>${escapeHtml(confirmedTime)}</strong></div>
          <div class="row"><span>Location</span><strong>${escapeHtml(confirmedLocation)}</strong></div>
          <div class="row"><span>Final price</span><strong>${escapeHtml(finalPrice)}</strong></div>
        </div>
        ${
          ownerMessage
            ? `<div class="note"><strong>Owner message</strong><p>${withLineBreaks(ownerMessage)}</p></div>`
            : ''
        }
      </div>
    `
  };
}

function buildMoreInfoEmail(record) {
  const customerName = trimValue(record.customer_name || 'there');
  const reference = getReferenceNumber(record);
  const ownerMessage = trimValue(record.owner_message);

  const text = [
    `Hi ${customerName},`,
    '',
    'We just need one more thing before we can confirm your appointment.',
    `Reference number: ${reference}`
  ];

  if (ownerMessage) {
    text.push('', ownerMessage);
  }

  text.push('', `${BRAND_NAME}`, TAGLINE);

  return {
    subject: `${BRAND_NAME}: one more detail needed`,
    preheader: 'We need one more detail before confirming your appointment.',
    text: text.join('\n'),
    html: `
      <div class="card">
        <p class="eyebrow">More information needed</p>
        <h1>Hello ${escapeHtml(customerName)},</h1>
        <p>We just need one more thing before we can confirm your appointment.</p>
        <div class="highlight">
          <div class="highlight-label">Reference number</div>
          <div class="highlight-value">${escapeHtml(reference)}</div>
        </div>
        ${
          ownerMessage
            ? `<div class="note"><strong>Owner message</strong><p>${withLineBreaks(ownerMessage)}</p></div>`
            : ''
        }
      </div>
    `
  };
}

function buildDeclinedEmail(record) {
  const customerName = trimValue(record.customer_name || 'there');
  const reference = getReferenceNumber(record);
  const ownerMessage = trimValue(record.owner_message);
  const packageName = trimValue(record.package_name || 'your booking');

  const text = [
    `Hi ${customerName},`,
    '',
    `Thanks for reaching out about ${packageName}.`,
    `Reference number: ${reference}`
  ];

  if (ownerMessage) {
    text.push('', ownerMessage);
  }

  text.push('', `${BRAND_NAME}`, TAGLINE);

  return {
    subject: `${BRAND_NAME}: update on your booking`,
    preheader: 'Your booking has been declined.',
    text: text.join('\n'),
    html: `
      <div class="card">
        <p class="eyebrow">Booking update</p>
        <h1>Hello ${escapeHtml(customerName)},</h1>
        <p>Thanks for reaching out about ${escapeHtml(packageName)}. At this time, we’re not able to move forward with the booking.</p>
        <div class="highlight">
          <div class="highlight-label">Reference number</div>
          <div class="highlight-value">${escapeHtml(reference)}</div>
        </div>
        ${
          ownerMessage
            ? `<div class="note"><strong>Owner message</strong><p>${withLineBreaks(ownerMessage)}</p></div>`
            : ''
        }
      </div>
    `
  };
}

function buildCompletedEmail(record) {
  const customerName = trimValue(record.customer_name || 'there');
  const reference = getReferenceNumber(record);
  const packageName = trimValue(record.package_name || 'your service');
  const ownerMessage = trimValue(record.owner_message);

  const text = [
    `Hi ${customerName},`,
    '',
    `Your ${packageName} is complete. Thank you for choosing TopNotch DetailLab.`,
    `Reference number: ${reference}`,
    '',
    'We’d love to care for your vehicle again whenever you need a future reset.'
  ];

  if (ownerMessage) {
    text.push('', ownerMessage);
  }

  text.push('', `${BRAND_NAME}`, TAGLINE);

  return {
    subject: `${BRAND_NAME}: your ${packageName} is complete`,
    preheader: 'Your service is complete. Thank you for choosing TopNotch DetailLab.',
    text: text.join('\n'),
    html: `
      <div class="card">
        <p class="eyebrow">Service complete</p>
        <h1>Hello ${escapeHtml(customerName)},</h1>
        <p>Your ${escapeHtml(packageName)} is complete. Thank you for choosing TopNotch DetailLab.</p>
        <div class="highlight">
          <div class="highlight-label">Reference number</div>
          <div class="highlight-value">${escapeHtml(reference)}</div>
        </div>
        <p>We’d love to care for your vehicle again whenever you need a future reset.</p>
        ${
          ownerMessage
            ? `<div class="note"><strong>Owner message</strong><p>${withLineBreaks(ownerMessage)}</p></div>`
            : ''
        }
      </div>
    `
  };
}

function buildCancelledEmail(record) {
  const customerName = trimValue(record.customer_name || 'there');
  const reference = getReferenceNumber(record);
  const ownerMessage = trimValue(record.owner_message);
  const packageName = trimValue(record.package_name || 'your booking');

  const text = [
    `Hi ${customerName},`,
    '',
    `Your ${packageName} has been cancelled.`,
    `Reference number: ${reference}`
  ];

  if (ownerMessage) {
    text.push('', ownerMessage);
  }

  text.push('', `${BRAND_NAME}`, TAGLINE);

  return {
    subject: `${BRAND_NAME}: your booking has been cancelled`,
    preheader: 'Your appointment has been cancelled.',
    text: text.join('\n'),
    html: `
      <div class="card">
        <p class="eyebrow">Appointment cancelled</p>
        <h1>Hello ${escapeHtml(customerName)},</h1>
        <p>Your ${escapeHtml(packageName)} has been cancelled.</p>
        <div class="highlight">
          <div class="highlight-label">Reference number</div>
          <div class="highlight-value">${escapeHtml(reference)}</div>
        </div>
        ${
          ownerMessage
            ? `<div class="note"><strong>Owner message</strong><p>${withLineBreaks(ownerMessage)}</p></div>`
            : ''
        }
      </div>
    `
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

function layout(subject, preheader, bodyHtml) {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#090909;color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader || subject)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#090909;padding:24px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;padding:0 16px;">
                <tr>
                  <td style="padding:0 0 16px 0;text-align:center;">
                    <div style="font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#ff5a5f;">${escapeHtml(BRAND_NAME)}</div>
                    <div style="font-size:14px;color:#d8d8d8;margin-top:8px;">${escapeHtml(TAGLINE)}</div>
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
                  <td style="padding:16px 8px 0 8px;text-align:center;color:#8b8b8b;font-size:12px;line-height:1.5;">
                    <div>${escapeHtml(BRAND_NAME)}</div>
                    <div>${escapeHtml(TAGLINE)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <style>
          @media (max-width: 600px) {
            .card { padding: 0 !important; }
            .details { gap: 10px !important; }
            .details .row { padding: 14px 0 !important; }
          }
          h1 { margin: 0 0 16px 0; font-size: 32px; line-height: 1.05; color: #ffffff; }
          p { margin: 0 0 16px 0; color: #e7e7e7; font-size: 16px; line-height: 1.6; }
          .eyebrow { margin: 0 0 12px 0; color: #ff5a5f; text-transform: uppercase; letter-spacing: .18em; font-size: 11px; font-weight: 700; }
          .highlight { background: linear-gradient(180deg, #181818, #101010); border: 1px solid #3a1216; border-left: 4px solid #ff3d47; border-radius: 18px; padding: 18px 20px; margin: 24px 0; }
          .highlight-label { color: #ff8b91; text-transform: uppercase; letter-spacing: .12em; font-size: 11px; margin-bottom: 6px; }
          .highlight-value { color: #ffffff; font-size: 18px; font-weight: 700; }
          .details { display: grid; gap: 12px; margin: 24px 0; }
          .details .row { display: flex; justify-content: space-between; gap: 18px; padding: 14px 0; border-bottom: 1px solid #262626; }
          .details .row span { color: #ababab; font-size: 13px; text-transform: uppercase; letter-spacing: .08em; }
          .details .row strong { color: #ffffff; font-size: 15px; text-align: right; }
          .note { margin-top: 24px; padding: 18px 20px; background:#141414; border:1px solid #272727; border-radius:18px; }
          .note strong { display:block; color:#ff8b91; margin-bottom:10px; font-size:12px; letter-spacing:.12em; text-transform:uppercase; }
          .note p { margin: 0; }
        </style>
      </body>
    </html>
  `;
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
  } catch (_) {
    data = raw;
  }

  if (!response.ok) {
    const message = data && data.message ? data.message : (typeof data === 'string' ? data : `Request failed (${response.status})`);
    throw new Error(message);
  }

  return data;
}

async function claimNotificationEvent(record, previousRecord) {
  const sourceUpdatedAt = trimValue(record.updated_at || previousRecord.updated_at || record.created_at || new Date().toISOString());
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
  } catch (_) {
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
  const htmlContent = layout(subject, template.preheader, template.html);
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

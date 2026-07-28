create extension if not exists pg_net;

alter table public.bookings
  add column if not exists customer_notified_status text,
  add column if not exists customer_notified_at timestamptz,
  add column if not exists customer_notification_error text;

create table if not exists public.customer_notification_events (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  booking_id text not null,
  booking_status text not null,
  source_updated_at timestamptz not null,
  state text not null default 'processing',
  brevo_message_id text,
  error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists customer_notification_events_booking_lookup_idx
  on public.customer_notification_events (booking_id, booking_status, source_updated_at desc);

create or replace function public.notify_customer_status_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  webhook_secret text := current_setting('app.webhooks.customer_notification_secret', true);
  webhook_url text := current_setting('app.webhooks.customer_notification_webhook_url', true);
  payload jsonb;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  if webhook_secret is null or webhook_secret = '' then
    raise exception 'Missing app.webhooks.customer_notification_secret';
  end if;

  if webhook_url is null or webhook_url = '' then
    raise exception 'Missing app.webhooks.customer_notification_webhook_url';
  end if;

  payload := jsonb_build_object(
    'type', 'UPDATE',
    'table', tg_table_name,
    'schema', tg_table_schema,
    'record', to_jsonb(new),
    'old_record', to_jsonb(old)
  );

  perform net.http_post(
    url := webhook_url,
    body := payload,
    params := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-TopNotch-Webhook-Secret', webhook_secret
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

drop trigger if exists bookings_notify_customer_status on public.bookings;

create trigger bookings_notify_customer_status
after update on public.bookings
for each row
when (new.status is distinct from old.status)
execute function public.notify_customer_status_webhook();

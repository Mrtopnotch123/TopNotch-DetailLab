-- New submissions use the plain-hyphen arrival windows listed below.
-- Morning, Afternoon, and Evening remain accepted only for existing legacy bookings.
-- Existing rows must not be rewritten or deleted.
alter table public.bookings
drop constraint if exists bookings_preferred_time_window_check;

alter table public.bookings
add constraint bookings_preferred_time_window_check
check (
  preferred_time_window is null
  or preferred_time_window in (
    '8:00 AM-10:00 AM',
    '10:00 AM-12:00 PM',
    '12:00 PM-2:00 PM',
    '2:00 PM-4:00 PM',
    '4:00 PM-6:00 PM',
    'Flexible',
    'Morning',
    'Afternoon',
    'Evening'
  )
);

SELECT pg_notify('pgrst', 'reload schema');

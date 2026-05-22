
drop policy "Anyone can submit RSVP" on public.rsvps;

create policy "Anyone can submit RSVP" on public.rsvps
  for insert to anon, authenticated
  with check (
    char_length(name) between 1 and 100
    and char_length(email) between 3 and 200
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and (dietary is null or char_length(dietary) <= 500)
    and (message is null or char_length(message) <= 1000)
    and guests between 0 and 10
  );

revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated, public;

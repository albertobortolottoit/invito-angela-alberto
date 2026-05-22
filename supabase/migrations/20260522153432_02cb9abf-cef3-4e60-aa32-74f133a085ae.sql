
-- Roles enum + table
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Admins read roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- RSVPs
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  attending boolean not null,
  guests int not null default 1 check (guests between 0 and 10),
  dietary text,
  message text,
  created_at timestamptz not null default now()
);

alter table public.rsvps enable row level security;

-- Anyone (anon + authed) can insert an RSVP
create policy "Anyone can submit RSVP" on public.rsvps
  for insert to anon, authenticated with check (true);

-- Only admins can read/manage
create policy "Admins read rsvps" on public.rsvps
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete rsvps" on public.rsvps
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

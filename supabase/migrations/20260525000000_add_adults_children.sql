-- Replace guests column with adults + children
alter table public.rsvps
  drop column if exists guests,
  add column if not exists adults int not null default 1 check (adults between 0 and 20),
  add column if not exists children int not null default 0 check (children between 0 and 20);

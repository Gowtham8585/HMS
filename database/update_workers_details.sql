alter table public.workers add column if not exists phone text;
alter table public.workers add column if not exists address text;
alter table public.workers add column if not exists join_date date default current_date;

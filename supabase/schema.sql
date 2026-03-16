create extension if not exists pgcrypto;

create table if not exists public.tier_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null default 'My Tier List',
  description text not null default '',
  tiers jsonb not null,
  items jsonb not null,
  theme text not null default 'modern',
  board_background text not null default 'transparent',
  item_size text not null default 'medium',
  image_fit text not null default 'cover',
  remix_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.remixes (
  id uuid primary key default gen_random_uuid(),
  tier_list_id uuid not null references public.tier_lists(id) on delete cascade,
  user_id uuid not null,
  items jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tier_lists_updated_at on public.tier_lists;

create trigger set_tier_lists_updated_at
before update on public.tier_lists
for each row
execute function public.set_updated_at();

alter table public.tier_lists enable row level security;
alter table public.remixes enable row level security;

drop policy if exists "tier_lists_select" on public.tier_lists;
create policy "tier_lists_select"
on public.tier_lists
for select
using (true);

drop policy if exists "tier_lists_insert" on public.tier_lists;
create policy "tier_lists_insert"
on public.tier_lists
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "tier_lists_update_owner" on public.tier_lists;
create policy "tier_lists_update_owner"
on public.tier_lists
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "tier_lists_delete_owner" on public.tier_lists;
create policy "tier_lists_delete_owner"
on public.tier_lists
for delete
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "remixes_select" on public.remixes;
create policy "remixes_select"
on public.remixes
for select
using (true);

drop policy if exists "remixes_insert" on public.remixes;
create policy "remixes_insert"
on public.remixes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "remixes_update_owner" on public.remixes;
create policy "remixes_update_owner"
on public.remixes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "remixes_delete_owner" on public.remixes;
create policy "remixes_delete_owner"
on public.remixes
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.submit_remix(p_tier_list_id uuid, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_remix_id uuid;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.remixes (tier_list_id, user_id, items)
  values (p_tier_list_id, current_user_id, p_items)
  returning id into new_remix_id;

  update public.tier_lists
  set remix_count = remix_count + 1
  where id = p_tier_list_id;

  if not found then
    raise exception 'Tier list not found';
  end if;

  return new_remix_id;
end;
$$;

grant execute on function public.submit_remix(uuid, jsonb) to authenticated;

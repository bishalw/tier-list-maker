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

-- View tracking
alter table public.tier_lists
add column if not exists view_count integer not null default 0;

-- Visibility. Defaults to true so existing share links keep working; the select
-- policy below is what actually enforces it.
alter table public.tier_lists
add column if not exists is_public boolean not null default true;

create table if not exists public.tier_list_views (
  id uuid primary key default gen_random_uuid(),
  tier_list_id uuid not null references public.tier_lists(id) on delete cascade,
  viewer_user_id uuid,
  viewer_ip text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
--
-- Postgres does not index foreign keys automatically, so both of the app's hot
-- lookups (a profile's lists, a list's remixes) were sequential scans.
-- ---------------------------------------------------------------------------

create index if not exists tier_lists_owner_id_idx
on public.tier_lists (owner_id, updated_at desc);

create index if not exists remixes_tier_list_id_idx
on public.remixes (tier_list_id, created_at);

create unique index if not exists tier_list_views_user_unique
on public.tier_list_views (tier_list_id, viewer_user_id)
where viewer_user_id is not null;

create unique index if not exists tier_list_views_ip_unique
on public.tier_list_views (tier_list_id, viewer_ip)
where viewer_user_id is null;

-- ---------------------------------------------------------------------------
-- One remix per person per list
--
-- Without this, a single account could submit unlimited remixes, each one
-- incrementing remix_count and re-weighting the community consensus.
-- Pre-existing duplicates are collapsed to the most recent submission first.
-- ---------------------------------------------------------------------------

delete from public.remixes r
using public.remixes newer
where r.tier_list_id = newer.tier_list_id
  and r.user_id = newer.user_id
  and (newer.created_at, newer.id) > (r.created_at, r.id);

create unique index if not exists remixes_one_per_user_per_list
on public.remixes (tier_list_id, user_id);

update public.tier_lists t
set remix_count = coalesce(counts.total, 0)
from (
  select tier_list_id, count(*)::integer as total
  from public.remixes
  group by tier_list_id
) as counts
where counts.tier_list_id = t.id
  and t.remix_count is distinct from counts.total;

-- ---------------------------------------------------------------------------
-- Size guards
--
-- These mirror constants/board.ts. Added NOT VALID so the migration applies to
-- databases holding older rows; new and updated rows are still checked.
-- ---------------------------------------------------------------------------

alter table public.tier_lists drop constraint if exists tier_lists_tiers_bounds;
alter table public.tier_lists
add constraint tier_lists_tiers_bounds
check (
  jsonb_typeof(tiers) = 'array'
  and jsonb_array_length(tiers) between 1 and 26
) not valid;

alter table public.tier_lists drop constraint if exists tier_lists_items_bounds;
alter table public.tier_lists
add constraint tier_lists_items_bounds
check (
  jsonb_typeof(items) = 'array'
  and jsonb_array_length(items) <= 500
) not valid;

alter table public.tier_lists drop constraint if exists tier_lists_title_length;
alter table public.tier_lists
add constraint tier_lists_title_length
check (char_length(title) between 1 and 100) not valid;

alter table public.tier_lists drop constraint if exists tier_lists_description_length;
alter table public.tier_lists
add constraint tier_lists_description_length
check (char_length(description) <= 1000) not valid;

alter table public.remixes drop constraint if exists remixes_items_bounds;
alter table public.remixes
add constraint remixes_items_bounds
check (
  jsonb_typeof(items) = 'array'
  and jsonb_array_length(items) <= 500
) not valid;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.tier_lists enable row level security;
alter table public.remixes enable row level security;
alter table public.tier_list_views enable row level security;

drop policy if exists "tier_lists_select" on public.tier_lists;
create policy "tier_lists_select"
on public.tier_lists
for select
using (is_public or auth.uid() = owner_id);

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

-- Consensus is public, but who contributed to it is not. Raw remix rows carry
-- user_id, so they are readable only by their author and by the list owner;
-- everyone else reads rankings through get_remix_items() below.
drop policy if exists "remixes_select" on public.remixes;
drop policy if exists "remixes_select_participants" on public.remixes;
create policy "remixes_select_participants"
on public.remixes
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.tier_lists t
    where t.id = remixes.tier_list_id
      and t.owner_id = auth.uid()
  )
);

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

drop policy if exists "tier_list_views_select" on public.tier_list_views;
create policy "tier_list_views_select"
on public.tier_list_views
for select
using (
  exists (
    select 1
    from public.tier_lists t
    where t.id = tier_list_views.tier_list_id
      and t.owner_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

create or replace function public.submit_remix(p_tier_list_id uuid, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_remix_id uuid;
  existing_remix_id uuid;
  current_user_id uuid;
  list_owner_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select owner_id into list_owner_id
  from public.tier_lists
  where id = p_tier_list_id;

  if list_owner_id is null then
    raise exception 'Tier list not found' using errcode = 'P0002';
  end if;

  if list_owner_id = current_user_id then
    raise exception 'Cannot remix your own tier list' using errcode = '42501';
  end if;

  select id into existing_remix_id
  from public.remixes
  where tier_list_id = p_tier_list_id
    and user_id = current_user_id;

  -- Resubmitting replaces the previous ranking. remix_count is a count of
  -- people, so it must not move.
  if existing_remix_id is not null then
    update public.remixes
    set items = p_items
    where id = existing_remix_id;

    return existing_remix_id;
  end if;

  insert into public.remixes (tier_list_id, user_id, items)
  values (p_tier_list_id, current_user_id, p_items)
  returning id into new_remix_id;

  update public.tier_lists
  set remix_count = remix_count + 1
  where id = p_tier_list_id;

  return new_remix_id;
end;
$$;

grant execute on function public.submit_remix(uuid, jsonb) to authenticated;

-- Rankings without identities, for the community consensus view.
create or replace function public.get_remix_items(p_tier_list_id uuid)
returns table (items jsonb)
language sql
security definer
set search_path = public
stable
as $$
  select r.items
  from public.remixes r
  join public.tier_lists t on t.id = r.tier_list_id
  where r.tier_list_id = p_tier_list_id
    and (t.is_public or t.owner_id = auth.uid())
  order by r.created_at asc;
$$;

grant execute on function public.get_remix_items(uuid) to authenticated;
grant execute on function public.get_remix_items(uuid) to anon;

create or replace function public.record_view(
  p_tier_list_id uuid,
  p_viewer_ip text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_user_id uuid;
  v_inserted_rows integer;
begin
  v_user_id := auth.uid();

  select owner_id into v_owner_id
  from public.tier_lists where id = p_tier_list_id;

  if v_owner_id is null then return; end if;
  if v_user_id is not null and v_user_id = v_owner_id then return; end if;

  if v_user_id is not null then
    insert into public.tier_list_views (tier_list_id, viewer_user_id)
    values (p_tier_list_id, v_user_id)
    on conflict do nothing;
  else
    if p_viewer_ip is null then return; end if;
    insert into public.tier_list_views (tier_list_id, viewer_ip)
    values (p_tier_list_id, p_viewer_ip)
    on conflict do nothing;
  end if;

  -- ROW_COUNT is a bigint; assigning it to a boolean only worked through
  -- PL/pgSQL's I/O coercion fallback.
  get diagnostics v_inserted_rows = row_count;

  if v_inserted_rows > 0 then
    update public.tier_lists
    set view_count = view_count + 1
    where id = p_tier_list_id;
  end if;
end;
$$;

grant execute on function public.record_view(uuid, text) to authenticated;
grant execute on function public.record_view(uuid, text) to anon;

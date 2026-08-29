begin;

create extension if not exists pgcrypto;

-- The connected project contained two empty legacy PWA tables. Refuse to
-- replace them if records appear between audit and migration.
do $$
begin
  if to_regclass('public.profiles') is not null
     and not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'profiles' and column_name = 'display_name'
     ) then
    if exists (select 1 from public.profiles limit 1) then
      raise exception 'Legacy profiles contains data; migration stopped to prevent data loss.';
    end if;
    if to_regclass('public.encouragements') is not null
       and exists (select 1 from public.encouragements limit 1) then
      raise exception 'Legacy encouragements contains data; migration stopped to prevent data loss.';
    end if;
    drop table if exists public.encouragements cascade;
    drop table public.profiles cascade;
  end if;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  initials text not null check (char_length(initials) between 1 and 3),
  avatar_color text not null default '#E7A52C' check (avatar_color ~ '^#[0-9A-Fa-f]{6}$'),
  friend_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)) unique,
  appearance text not null default 'system' check (appearance in ('system', 'light', 'dark')),
  reminders_enabled boolean not null default false,
  celebration_haptics boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pods (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 240),
  color text not null default '#F27C72' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  invite_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)) unique,
  invite_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pod_members (
  pod_id uuid not null references public.pods(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (pod_id, user_id)
);

create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  pod_id uuid references public.pods(id) on delete set null,
  body text not null check (char_length(body) between 1 and 800),
  mood text not null check (mood in ('sunny', 'peaceful', 'proud', 'connected')),
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.moment_reactions (
  moment_id uuid not null references public.moments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('smile', 'heart', 'celebrate')),
  created_at timestamptz not null default now(),
  primary key (moment_id, user_id)
);

create table if not exists public.friendships (
  user_one_id uuid not null references public.profiles(id) on delete cascade,
  user_two_id uuid not null references public.profiles(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_one_id, user_two_id),
  check (user_one_id < user_two_id),
  check (requested_by = user_one_id or requested_by = user_two_id)
);

create table if not exists public.encouragements (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  pod_id uuid references public.pods(id) on delete set null,
  body text not null check (char_length(body) between 1 and 360),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> recipient_id)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  moment_id uuid references public.moments(id) on delete set null,
  pod_id uuid references public.pods(id) on delete set null,
  reason text not null check (reason in ('harassment', 'hate', 'sexual', 'violence', 'self_harm', 'spam', 'privacy', 'other')),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  check (reported_user_id is not null or moment_id is not null or pod_id is not null)
);

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(message) between 1 and 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.support_requests alter column user_id drop not null;
alter table public.support_requests alter column email set not null;
alter table public.support_requests drop constraint if exists support_requests_email_check;
alter table public.support_requests add constraint support_requests_email_check check (
  char_length(email) between 3 and 254
);

alter table public.reports drop constraint if exists reports_reason_check;
alter table public.reports add constraint reports_reason_check check (
  reason in ('harassment', 'hate', 'sexual', 'violence', 'self_harm', 'spam', 'privacy', 'other')
);

create index if not exists pod_members_user_idx on public.pod_members(user_id, joined_at desc);
create index if not exists moments_author_created_idx on public.moments(author_id, created_at desc);
create index if not exists moments_pod_created_idx on public.moments(pod_id, created_at desc);
create index if not exists reactions_user_idx on public.moment_reactions(user_id);
create index if not exists encouragements_recipient_created_idx on public.encouragements(recipient_id, created_at desc);
create index if not exists encouragements_sender_created_idx on public.encouragements(sender_id, created_at desc);
create index if not exists friendships_user_two_idx on public.friendships(user_two_id, status);
create index if not exists blocks_blocked_idx on public.blocks(blocked_id);
create index if not exists reports_status_created_idx on public.reports(status, created_at desc);
create index if not exists support_requests_status_created_idx on public.support_requests(status, created_at desc);

create or replace function public.initials_for(display_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(
    case
      when array_length(regexp_split_to_array(trim(display_value), '\s+'), 1) > 1
        then left((regexp_split_to_array(trim(display_value), '\s+'))[1], 1) || left((regexp_split_to_array(trim(display_value), '\s+'))[2], 1)
      else left(trim(display_value), 2)
    end
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_blocked_pair(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = auth.uid() and blocked_id = target_user)
       or (blocker_id = target_user and blocked_id = auth.uid())
  );
$$;

create or replace function public.is_pod_member(target_pod uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.pod_members
    where pod_id = target_pod and user_id = auth.uid()
  );
$$;

create or replace function public.are_friends(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((user_one_id = auth.uid() and user_two_id = target_user)
        or (user_two_id = auth.uid() and user_one_id = target_user))
  );
$$;

create or replace function public.shares_pod_with(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.pod_members mine
    join public.pod_members theirs on theirs.pod_id = mine.pod_id
    where mine.user_id = auth.uid() and theirs.user_id = target_user
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_name text;
  pending_token uuid;
begin
  chosen_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1), 'Happy friend');
  insert into public.profiles (id, display_name, initials)
  values (new.id, left(chosen_name, 60), public.initials_for(chosen_name))
  on conflict (id) do nothing;

  begin
    pending_token := nullif(new.raw_user_meta_data ->> 'pending_invite_token', '')::uuid;
  exception when invalid_text_representation then
    pending_token := null;
  end;

  if pending_token is not null then
    insert into public.pod_members (pod_id, user_id, role)
    select p.id, new.id, 'member' from public.pods p where p.invite_token = pending_token
    on conflict (pod_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute procedure public.touch_updated_at();
drop trigger if exists pods_touch_updated_at on public.pods;
create trigger pods_touch_updated_at before update on public.pods
for each row execute procedure public.touch_updated_at();
drop trigger if exists friendships_touch_updated_at on public.friendships;
create trigger friendships_touch_updated_at before update on public.friendships
for each row execute procedure public.touch_updated_at();
drop trigger if exists moments_touch_updated_at on public.moments;
create trigger moments_touch_updated_at before update on public.moments
for each row execute procedure public.touch_updated_at();

create or replace function public.create_pod(p_name text, p_description text, p_color text)
returns public.pods
language plpgsql
security definer
set search_path = ''
as $$
declare created_pod public.pods;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.pods (owner_id, name, description, color)
  values (auth.uid(), trim(p_name), coalesce(trim(p_description), ''), p_color)
  returning * into created_pod;
  insert into public.pod_members (pod_id, user_id, role) values (created_pod.id, auth.uid(), 'owner');
  return created_pod;
end;
$$;

create or replace function public.get_invite_preview(p_invite_token uuid)
returns table (pod_id uuid, pod_name text, pod_description text, pod_color text, owner_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.name, p.description, p.color, owner.display_name
  from public.pods p join public.profiles owner on owner.id = p.owner_id
  where p.invite_token = p_invite_token;
$$;

create or replace function public.claim_pod_invite(p_invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare target_pod public.pods;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into target_pod from public.pods where invite_token = p_invite_token;
  if target_pod.id is null then raise exception 'Invitation not found'; end if;
  if public.is_blocked_pair(target_pod.owner_id) then raise exception 'Invitation unavailable'; end if;
  insert into public.pod_members (pod_id, user_id, role) values (target_pod.id, auth.uid(), 'member')
  on conflict (pod_id, user_id) do nothing;
  return target_pod.id;
end;
$$;

create or replace function public.join_pod_by_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare token uuid;
begin
  select invite_token into token from public.pods where upper(invite_code) = upper(trim(p_invite_code));
  if token is null then raise exception 'Invitation not found'; end if;
  return public.claim_pod_invite(token);
end;
$$;

create or replace function public.find_friend_by_code(p_friend_code text)
returns table (id uuid, display_name text, initials text, avatar_color text, already_connected boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.initials, p.avatar_color, public.are_friends(p.id)
  from public.profiles p
  where upper(p.friend_code) = upper(trim(p_friend_code))
    and p.id <> auth.uid()
    and not public.is_blocked_pair(p.id);
$$;

create or replace function public.send_friend_request(p_friend_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare target_id uuid; first_id uuid; second_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select p.id into target_id from public.profiles p where upper(p.friend_code) = upper(trim(p_friend_code));
  if target_id is null or target_id = auth.uid() or public.is_blocked_pair(target_id) then raise exception 'Friend code not found'; end if;
  first_id := least(auth.uid(), target_id); second_id := greatest(auth.uid(), target_id);
  insert into public.friendships (user_one_id, user_two_id, requested_by, status)
  values (first_id, second_id, auth.uid(), 'pending')
  on conflict (user_one_id, user_two_id) do update set requested_by = auth.uid(), status = case when public.friendships.status = 'accepted' then 'accepted' else 'pending' end;
  return target_id;
end;
$$;

create or replace function public.respond_to_friend_request(p_other_user uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare first_id uuid := least(auth.uid(), p_other_user); second_id uuid := greatest(auth.uid(), p_other_user);
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_accept then
    update public.friendships set status = 'accepted'
    where user_one_id = first_id and user_two_id = second_id and requested_by <> auth.uid() and status = 'pending';
  else
    delete from public.friendships
    where user_one_id = first_id and user_two_id = second_id and requested_by <> auth.uid() and status = 'pending';
  end if;
end;
$$;

create or replace function public.list_friend_connections()
returns table (
  user_one_id uuid,
  user_two_id uuid,
  requested_by uuid,
  status text,
  other_user_id uuid,
  other_display_name text,
  other_initials text,
  other_avatar_color text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    f.user_one_id,
    f.user_two_id,
    f.requested_by,
    f.status,
    other_profile.id,
    other_profile.display_name,
    other_profile.initials,
    other_profile.avatar_color,
    f.created_at
  from public.friendships f
  join public.profiles other_profile
    on other_profile.id = case when f.user_one_id = auth.uid() then f.user_two_id else f.user_one_id end
  where auth.uid() in (f.user_one_id, f.user_two_id)
    and not public.is_blocked_pair(other_profile.id)
  order by case when f.status = 'pending' and f.requested_by <> auth.uid() then 0 when f.status = 'accepted' then 1 else 2 end,
    f.created_at desc;
$$;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;

alter table public.profiles enable row level security;
alter table public.pods enable row level security;
alter table public.pod_members enable row level security;
alter table public.moments enable row level security;
alter table public.moment_reactions enable row level security;
alter table public.friendships enable row level security;
alter table public.encouragements enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.support_requests enable row level security;

drop policy if exists profiles_select_connected on public.profiles;
create policy profiles_select_connected on public.profiles for select to authenticated using (
  id = auth.uid() or (not public.is_blocked_pair(id) and (public.are_friends(id) or public.shares_pod_with(id)))
);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists pods_select_members on public.pods;
create policy pods_select_members on public.pods for select to authenticated using (owner_id = auth.uid() or public.is_pod_member(id));
drop policy if exists pods_update_owner on public.pods;
create policy pods_update_owner on public.pods for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists pods_delete_owner on public.pods;
create policy pods_delete_owner on public.pods for delete to authenticated using (owner_id = auth.uid());

drop policy if exists pod_members_select_members on public.pod_members;
create policy pod_members_select_members on public.pod_members for select to authenticated using (public.is_pod_member(pod_id));
drop policy if exists pod_members_leave_self_or_owner_remove on public.pod_members;
create policy pod_members_leave_self_or_owner_remove on public.pod_members for delete to authenticated using (
  user_id = auth.uid() or exists (select 1 from public.pods p where p.id = pod_id and p.owner_id = auth.uid() and role <> 'owner')
);

drop policy if exists moments_select_visible on public.moments;
create policy moments_select_visible on public.moments for select to authenticated using (
  author_id = auth.uid() or (pod_id is not null and public.is_pod_member(pod_id) and not public.is_blocked_pair(author_id))
);
drop policy if exists moments_insert_self on public.moments;
create policy moments_insert_self on public.moments for insert to authenticated with check (
  author_id = auth.uid() and (pod_id is null or public.is_pod_member(pod_id))
);
drop policy if exists moments_update_self on public.moments;
create policy moments_update_self on public.moments for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid() and (pod_id is null or public.is_pod_member(pod_id)));
drop policy if exists moments_delete_self on public.moments;
create policy moments_delete_self on public.moments for delete to authenticated using (author_id = auth.uid());

drop policy if exists reactions_select_visible on public.moment_reactions;
create policy reactions_select_visible on public.moment_reactions for select to authenticated using (
  exists (select 1 from public.moments m where m.id = moment_id and (m.author_id = auth.uid() or (m.pod_id is not null and public.is_pod_member(m.pod_id))))
);
drop policy if exists reactions_manage_self on public.moment_reactions;
create policy reactions_manage_self on public.moment_reactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists friendships_select_participants on public.friendships;
create policy friendships_select_participants on public.friendships for select to authenticated using (auth.uid() in (user_one_id, user_two_id));
drop policy if exists friendships_delete_participants on public.friendships;
create policy friendships_delete_participants on public.friendships for delete to authenticated using (auth.uid() in (user_one_id, user_two_id));

drop policy if exists encouragements_select_participants on public.encouragements;
create policy encouragements_select_participants on public.encouragements for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());
drop policy if exists encouragements_insert_connected on public.encouragements;
create policy encouragements_insert_connected on public.encouragements for insert to authenticated with check (
  sender_id = auth.uid() and sender_id <> recipient_id and not public.is_blocked_pair(recipient_id)
  and (public.are_friends(recipient_id) or public.shares_pod_with(recipient_id))
  and (pod_id is null or public.is_pod_member(pod_id))
);
drop policy if exists encouragements_mark_read on public.encouragements;
create policy encouragements_mark_read on public.encouragements for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

drop policy if exists blocks_manage_self on public.blocks;
create policy blocks_manage_self on public.blocks for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
drop policy if exists reports_insert_self on public.reports;
create policy reports_insert_self on public.reports for insert to authenticated with check (reporter_id = auth.uid());
drop policy if exists reports_select_self on public.reports;
create policy reports_select_self on public.reports for select to authenticated using (reporter_id = auth.uid());

drop policy if exists support_requests_insert_self on public.support_requests;
create policy support_requests_insert_self on public.support_requests for insert to authenticated with check (user_id = auth.uid());
drop policy if exists support_requests_insert_public on public.support_requests;
create policy support_requests_insert_public on public.support_requests for insert to anon with check (
  user_id is null and char_length(email) between 3 and 254
);

revoke all on all tables in schema public from anon;
grant select, update on public.profiles to authenticated;
grant select, update, delete on public.pods to authenticated;
grant select, delete on public.pod_members to authenticated;
grant select, insert, update, delete on public.moments to authenticated;
grant select, insert, update, delete on public.moment_reactions to authenticated;
grant select, delete on public.friendships to authenticated;
grant select, insert, update on public.encouragements to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert on public.reports to authenticated;
grant insert on public.support_requests to anon, authenticated;
grant all on all tables in schema public to service_role;

revoke all on function public.get_invite_preview(uuid) from public;
grant execute on function public.get_invite_preview(uuid) to anon, authenticated, service_role;
revoke all on function public.create_pod(text, text, text) from public;
revoke all on function public.claim_pod_invite(uuid) from public;
revoke all on function public.join_pod_by_code(text) from public;
revoke all on function public.find_friend_by_code(text) from public;
revoke all on function public.send_friend_request(text) from public;
revoke all on function public.respond_to_friend_request(uuid, boolean) from public;
revoke all on function public.list_friend_connections() from public;
revoke all on function public.delete_my_account() from public;
grant execute on function public.create_pod(text, text, text) to authenticated, service_role;
grant execute on function public.claim_pod_invite(uuid) to authenticated, service_role;
grant execute on function public.join_pod_by_code(text) to authenticated, service_role;
grant execute on function public.find_friend_by_code(text) to authenticated, service_role;
grant execute on function public.send_friend_request(text) to authenticated, service_role;
grant execute on function public.respond_to_friend_request(uuid, boolean) to authenticated, service_role;
grant execute on function public.list_friend_connections() to authenticated, service_role;
grant execute on function public.delete_my_account() to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','pods','pod_members','moments','moment_reactions','friendships','encouragements','blocks']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;

commit;

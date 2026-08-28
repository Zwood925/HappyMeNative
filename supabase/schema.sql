create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_color text not null default '#E7A52C',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pods (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  color text not null default '#F27C72',
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.pod_members (
  pod_id uuid not null references public.pods(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
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

create table if not exists public.encouragements (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  pod_id uuid references public.pods(id) on delete set null,
  body text not null check (char_length(body) between 1 and 360),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists moments_author_created_idx on public.moments(author_id, created_at desc);
create index if not exists moments_pod_created_idx on public.moments(pod_id, created_at desc);
create index if not exists encouragements_recipient_created_idx on public.encouragements(recipient_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.pods enable row level security;
alter table public.pod_members enable row level security;
alter table public.moments enable row level security;
alter table public.moment_reactions enable row level security;
alter table public.encouragements enable row level security;

create or replace function public.is_pod_member(target_pod uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.pod_members where pod_id = target_pod and user_id = auth.uid()) $$;

create policy "profiles readable by authenticated users" on public.profiles for select to authenticated using (true);
create policy "users manage own profile" on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "members read pods" on public.pods for select to authenticated using (public.is_pod_member(id) or owner_id = auth.uid());
create policy "owners create pods" on public.pods for insert to authenticated with check (owner_id = auth.uid());
create policy "owners update pods" on public.pods for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "members read membership" on public.pod_members for select to authenticated using (public.is_pod_member(pod_id));
create policy "owners add membership" on public.pod_members for insert to authenticated with check (exists (select 1 from public.pods where id = pod_id and owner_id = auth.uid()) or user_id = auth.uid());
create policy "visible moments are readable" on public.moments for select to authenticated using (author_id = auth.uid() or (pod_id is not null and public.is_pod_member(pod_id)));
create policy "authors create moments" on public.moments for insert to authenticated with check (author_id = auth.uid() and (pod_id is null or public.is_pod_member(pod_id)));
create policy "authors update moments" on public.moments for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "authors delete moments" on public.moments for delete to authenticated using (author_id = auth.uid());
create policy "visible reactions are readable" on public.moment_reactions for select to authenticated using (exists (select 1 from public.moments where id = moment_id and (author_id = auth.uid() or (pod_id is not null and public.is_pod_member(pod_id)))));
create policy "users manage own reactions" on public.moment_reactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "participants read encouragements" on public.encouragements for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "senders create encouragements" on public.encouragements for insert to authenticated with check (sender_id = auth.uid() and sender_id <> recipient_id);
create policy "recipients mark encouragements read" on public.encouragements for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

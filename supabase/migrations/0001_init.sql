-- Papaya v2 — Supabase başlangıç şeması
-- Supabase Studio > SQL Editor'da çalıştır. Idempotent olacak şekilde yazıldı.

-------------------------------------------------------------------------------
-- 0) Yardımcılar
-------------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-------------------------------------------------------------------------------
-- 1) PROFILES
-------------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default 'Papaya kullanıcısı',
  avatar     text not null default '😎',
  color      text not null default '#f95816',
  status     text not null default 'Papaya’dayım 🍈',
  onboarded  boolean not null default false,
  last_seen  timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles okunur (giriş yapmış herkes)" on public.profiles;
create policy "profiles okunur (giriş yapmış herkes)"
  on public.profiles for select to authenticated using (true);

drop policy if exists "kendi profilini ekle" on public.profiles;
create policy "kendi profilini ekle"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "kendi profilini güncelle" on public.profiles;
create policy "kendi profilini güncelle"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Yeni kullanıcı kaydolduğunda otomatik profil oluştur
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-------------------------------------------------------------------------------
-- 2) KONUŞMALAR + ÜYELER + MESAJLAR
-------------------------------------------------------------------------------
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  is_group   boolean not null default false,
  title      text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  type            text not null default 'text' check (type in ('text','image','video')),
  body            text,
  media_url       text,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);

-- RLS özyinelemesini önlemek için güvenli üyelik kontrolü
create or replace function public.is_conversation_member(cid uuid, uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.conversation_members m
    where m.conversation_id = cid and m.user_id = uid
  );
$$;

alter table public.conversations        enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages             enable row level security;

drop policy if exists "üye olduğun konuşmayı gör" on public.conversations;
create policy "üye olduğun konuşmayı gör"
  on public.conversations for select to authenticated
  using (public.is_conversation_member(id, auth.uid()));

drop policy if exists "konuşma oluştur" on public.conversations;
create policy "konuşma oluştur"
  on public.conversations for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists "üyeleri gör" on public.conversation_members;
create policy "üyeleri gör"
  on public.conversation_members for select to authenticated
  using (public.is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "üye ekle" on public.conversation_members;
create policy "üye ekle"
  on public.conversation_members for insert to authenticated with check (true);

drop policy if exists "kendi okundu bilgini güncelle" on public.conversation_members;
create policy "kendi okundu bilgini güncelle"
  on public.conversation_members for update to authenticated using (user_id = auth.uid());

drop policy if exists "mesajları gör (üyeysen)" on public.messages;
create policy "mesajları gör (üyeysen)"
  on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "mesaj gönder (üyeysen)" on public.messages;
create policy "mesaj gönder (üyeysen)"
  on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id, auth.uid()));

-- 1-1 sohbeti atomik bul-veya-oluştur (RLS'i güvenle aşar)
create or replace function public.get_or_create_dm(other_user uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  cid uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if other_user = me then raise exception 'cannot DM self'; end if;
  select c.id into cid
  from public.conversations c
  join public.conversation_members m1 on m1.conversation_id = c.id and m1.user_id = me
  join public.conversation_members m2 on m2.conversation_id = c.id and m2.user_id = other_user
  where c.is_group = false
  limit 1;
  if cid is not null then return cid; end if;
  insert into public.conversations (is_group, created_by) values (false, me) returning id into cid;
  insert into public.conversation_members (conversation_id, user_id) values (cid, me), (cid, other_user);
  return cid;
end; $$;

-------------------------------------------------------------------------------
-- 3) AKIŞ: GÖNDERİLER + BEĞENİ + YORUM
-------------------------------------------------------------------------------
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text,
  media_url  text,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts(created_at desc);

create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

alter table public.posts      enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments   enable row level security;

drop policy if exists "gönderiler herkese açık (giriş yapmış)" on public.posts;
create policy "gönderiler herkese açık (giriş yapmış)"
  on public.posts for select to authenticated using (true);
drop policy if exists "kendi gönderini ekle" on public.posts;
create policy "kendi gönderini ekle"
  on public.posts for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "kendi gönderini sil" on public.posts;
create policy "kendi gönderini sil"
  on public.posts for delete to authenticated using (author_id = auth.uid());

drop policy if exists "beğenileri gör" on public.post_likes;
create policy "beğenileri gör"
  on public.post_likes for select to authenticated using (true);
drop policy if exists "kendi beğenini ekle" on public.post_likes;
create policy "kendi beğenini ekle"
  on public.post_likes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "kendi beğenini sil" on public.post_likes;
create policy "kendi beğenini sil"
  on public.post_likes for delete to authenticated using (user_id = auth.uid());

drop policy if exists "yorumları gör" on public.comments;
create policy "yorumları gör"
  on public.comments for select to authenticated using (true);
drop policy if exists "kendi yorumunu ekle" on public.comments;
create policy "kendi yorumunu ekle"
  on public.comments for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "kendi yorumunu sil" on public.comments;
create policy "kendi yorumunu sil"
  on public.comments for delete to authenticated using (author_id = auth.uid());

-------------------------------------------------------------------------------
-- 4) STORIES (24 saat)
-------------------------------------------------------------------------------
create table if not exists public.stories (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  media_url  text not null,
  type       text not null default 'image' check (type in ('image','video')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
create index if not exists stories_expires_idx on public.stories(expires_at);

create table if not exists public.story_views (
  story_id  uuid references public.stories(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

alter table public.stories     enable row level security;
alter table public.story_views enable row level security;

drop policy if exists "aktif story'leri gör" on public.stories;
create policy "aktif story'leri gör"
  on public.stories for select to authenticated using (expires_at > now());
drop policy if exists "kendi story'ni ekle" on public.stories;
create policy "kendi story'ni ekle"
  on public.stories for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "kendi story'ni sil" on public.stories;
create policy "kendi story'ni sil"
  on public.stories for delete to authenticated using (author_id = auth.uid());

drop policy if exists "görülmeleri gör" on public.story_views;
create policy "görülmeleri gör"
  on public.story_views for select to authenticated using (true);
drop policy if exists "kendi görülmeni ekle" on public.story_views;
create policy "kendi görülmeni ekle"
  on public.story_views for insert to authenticated with check (viewer_id = auth.uid());

-------------------------------------------------------------------------------
-- 5) ÇOK OYUNCULU OYUN OTURUMLARI
-------------------------------------------------------------------------------
create table if not exists public.game_sessions (
  id         uuid primary key default gen_random_uuid(),
  game       text not null check (game in ('tic','memory')),
  host_id    uuid not null references public.profiles(id) on delete cascade,
  guest_id   uuid references public.profiles(id) on delete set null,
  state      jsonb not null default '{}'::jsonb,
  turn_id    uuid,
  winner_id  uuid,
  status     text not null default 'waiting' check (status in ('waiting','active','over')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_sessions enable row level security;

drop policy if exists "oyununu gör (host/guest)" on public.game_sessions;
create policy "oyununu gör (host/guest)"
  on public.game_sessions for select to authenticated
  using (host_id = auth.uid() or guest_id = auth.uid() or status = 'waiting');
drop policy if exists "oyun oluştur" on public.game_sessions;
create policy "oyun oluştur"
  on public.game_sessions for insert to authenticated with check (host_id = auth.uid());
drop policy if exists "oyunu güncelle (host/guest)" on public.game_sessions;
create policy "oyunu güncelle (host/guest)"
  on public.game_sessions for update to authenticated
  using (host_id = auth.uid() or guest_id = auth.uid());

-------------------------------------------------------------------------------
-- 6) PUSH ABONELİKLERİ
-------------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "kendi aboneliklerini yönet" on public.push_subscriptions;
create policy "kendi aboneliklerini yönet"
  on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-------------------------------------------------------------------------------
-- 7) REALTIME yayını
-------------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.messages;
  alter publication supabase_realtime add table public.conversation_members;
  alter publication supabase_realtime add table public.posts;
  alter publication supabase_realtime add table public.post_likes;
  alter publication supabase_realtime add table public.stories;
  alter publication supabase_realtime add table public.game_sessions;
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;

-------------------------------------------------------------------------------
-- 8) STORAGE bucket'ları + politikaları
-------------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars','avatars', true), ('media','media', true), ('stories','stories', true)
on conflict (id) do nothing;

drop policy if exists "medya herkese okunur" on storage.objects;
create policy "medya herkese okunur"
  on storage.objects for select using (bucket_id in ('avatars','media','stories'));

drop policy if exists "giriş yapan yükler" on storage.objects;
create policy "giriş yapan yükler"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars','media','stories'));

drop policy if exists "kendi dosyanı sil" on storage.objects;
create policy "kendi dosyanı sil"
  on storage.objects for delete to authenticated using (owner = auth.uid());

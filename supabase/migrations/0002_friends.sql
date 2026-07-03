-- Papaya — Arkadaşlık Sistemi
-- Supabase Studio > SQL Editor'da çalıştır.

-------------------------------------------------------------------------------
-- 1) ARKADAŞLIK İSTEKLERİ
-------------------------------------------------------------------------------
create table if not exists public.friend_requests (
  id            uuid primary key default gen_random_uuid(),
  from_user_id  uuid not null references public.profiles(id) on delete cascade,
  to_user_id    uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (from_user_id, to_user_id)
);

create index if not exists friend_requests_to_idx on public.friend_requests(to_user_id, status);
create index if not exists friend_requests_from_idx on public.friend_requests(from_user_id, status);

alter table public.friend_requests enable row level security;

drop policy if exists "kendi isteklerini gör" on public.friend_requests;
create policy "kendi isteklerini gör"
  on public.friend_requests for select to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

drop policy if exists "istek gönder" on public.friend_requests;
create policy "istek gönder"
  on public.friend_requests for insert to authenticated
  with check (from_user_id = auth.uid());

drop policy if exists "istek güncelle (hedef)" on public.friend_requests;
create policy "istek güncelle (hedef)"
  on public.friend_requests for update to authenticated
  using (to_user_id = auth.uid())
  with check (to_user_id = auth.uid());

drop policy if exists "kendi isteğini iptal et" on public.friend_requests;
create policy "kendi isteğini iptal et"
  on public.friend_requests for delete to authenticated
  using (from_user_id = auth.uid());

-------------------------------------------------------------------------------
-- 2) yardımcı: kullanıcının arkadaş listesini döndür
-------------------------------------------------------------------------------
create or replace function public.get_friends(uid uuid)
returns table (friend_id uuid, name text, avatar text, color text, online boolean, last_seen timestamptz)
language sql security definer stable set search_path = public as $$
  select
    case when fr.from_user_id = uid then fr.to_user_id else fr.from_user_id end,
    p.name, p.avatar, p.color,
    p.last_seen > now() - interval '5 minutes',
    p.last_seen
  from public.friend_requests fr
  join public.profiles p on p.id = case when fr.from_user_id = uid then fr.to_user_id else fr.from_user_id end
  where fr.status = 'accepted' and (fr.from_user_id = uid or fr.to_user_id = uid);
$$;

-------------------------------------------------------------------------------
-- 3) REALTIME
-------------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.friend_requests;
exception when duplicate_object then null;
end $$;

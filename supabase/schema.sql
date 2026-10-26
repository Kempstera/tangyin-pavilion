-- ============================================================
-- 唐音閣 · Supabase Schema
-- 在 Supabase Dashboard → SQL Editor 中整段执行
-- ============================================================

create extension if not exists pg_trgm;

-- ---------- 诗人 ----------
create table if not exists public.authors (
  id            bigint primary key,
  name          text not null,
  name_s        text not null,
  slug          text not null unique,
  description   text default '',
  description_s text default '',
  poem_count    int  default 0,
  created_at    timestamptz default now()
);

-- ---------- 诗作 ----------
create table if not exists public.poems (
  id                bigint primary key,
  title             text not null,
  title_s           text not null,
  short_title       text,
  short_title_s     text,
  author_id         bigint references public.authors(id),
  author            text not null,
  author_s          text not null,
  dynasty           text default '唐',
  genre             text default '',
  tags              text[] default '{}',
  paragraphs        text[] not null,
  paragraphs_s      text[] not null,
  content           text not null,
  content_s         text not null,
  notes             jsonb,
  translation       text,
  translation_s     text,
  notes_source      text,
  translation_source text,
  is_tang300        boolean default false,
  is_featured       boolean default false,
  char_count        int default 0
);

create index if not exists poems_title_trgm    on public.poems using gin (title gin_trgm_ops);
create index if not exists poems_title_s_trgm  on public.poems using gin (title_s gin_trgm_ops);
create index if not exists poems_content_trgm  on public.poems using gin (content gin_trgm_ops);
create index if not exists poems_content_s_trgm on public.poems using gin (content_s gin_trgm_ops);
create index if not exists poems_author_idx    on public.poems (author);
create index if not exists poems_author_id_idx on public.poems (author_id);
create index if not exists poems_genre_idx     on public.poems (genre);
create index if not exists poems_300_idx       on public.poems (id) where is_tang300;
create index if not exists poems_featured_idx  on public.poems (id) where is_featured;

-- ---------- 题壁（留言） ----------
create table if not exists public.guestbook (
  id         bigserial primary key,
  user_id    uuid references auth.users(id) on delete set null,
  nickname   text not null default '无名氏',
  content    text not null check (char_length(content) between 1 and 2000),
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists guestbook_created_idx on public.guestbook (created_at desc);

-- ---------- 访问统计 ----------
create table if not exists public.page_visits (
  id         bigserial primary key,
  path       text,
  visitor    text,
  ref        text,
  created_at timestamptz not null default now()
);
create index if not exists page_visits_created_idx on public.page_visits (created_at desc);
create index if not exists page_visits_visitor_idx on public.page_visits (visitor);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.authors     enable row level security;
alter table public.poems       enable row level security;
alter table public.guestbook   enable row level security;
alter table public.page_visits enable row level security;

drop policy if exists authors_read on public.authors;
create policy authors_read on public.authors for select using (true);

drop policy if exists poems_read on public.poems;
create policy poems_read on public.poems for select using (true);

drop policy if exists guestbook_read on public.guestbook;
create policy guestbook_read on public.guestbook for select using (is_visible);

drop policy if exists guestbook_insert on public.guestbook;
create policy guestbook_insert on public.guestbook
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists guestbook_delete_own on public.guestbook;
create policy guestbook_delete_own on public.guestbook
  for delete to authenticated
  using (auth.uid() = user_id);

-- page_visits 不开放直接读写，仅通过下方 RPC 写入

-- ============================================================
-- RPC：记录访问
-- ============================================================
create or replace function public.record_visit(p_path text, p_visitor text, p_ref text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.page_visits(path, visitor, ref)
  values (left(coalesce(p_path, ''), 200), left(coalesce(p_visitor, ''), 64), left(coalesce(p_ref, ''), 200));
end;
$$;

-- ============================================================
-- RPC：站点统计
-- ============================================================
create or replace function public.get_site_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total    bigint;
  v_today    bigint;
  v_visitors bigint;
  v_msgs     bigint;
  v_users    bigint;
begin
  select count(*) into v_total from public.page_visits;
  select count(*) into v_today from public.page_visits
    where created_at >= date_trunc('day', now());
  select count(distinct visitor) into v_visitors from public.page_visits;
  select count(*) into v_msgs from public.guestbook where is_visible;
  begin
    select count(*) into v_users from auth.users;
  exception when others then
    v_users := 0;
  end;
  return json_build_object(
    'total_views',    coalesce(v_total, 0),
    'today_views',    coalesce(v_today, 0),
    'total_visitors', coalesce(v_visitors, 0),
    'total_messages', coalesce(v_msgs, 0),
    'total_users',    coalesce(v_users, 0)
  );
end;
$$;

grant execute on function public.record_visit(text, text, text) to anon, authenticated;
grant execute on function public.get_site_stats() to anon, authenticated;

-- ============================================================
-- 导入后刷新统计信息（可选，加速查询计划）
-- ============================================================
-- analyze public.poems;
-- analyze public.authors;

-- 本格版: 認証・検索履歴・ユーザー別出典タイプ
alter table public.words add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.words add column if not exists source_type text;
alter table public.words add column if not exists source_title text;
alter table public.words add column if not exists source_url text;
alter table public.words add column if not exists note text;
alter table public.words add column if not exists example_sentence text;

create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  meanings jsonb not null default '[]'::jsonb,
  example_sentence text,
  searched_at timestamptz not null default now(),
  registered_word_id uuid references public.words(id) on delete set null
);

create table if not exists public.source_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create index if not exists words_user_id_idx on public.words(user_id);
create index if not exists words_next_review_idx on public.words(next_review);
create index if not exists search_history_user_id_idx on public.search_history(user_id, searched_at desc);
create index if not exists source_types_user_id_idx on public.source_types(user_id);

alter table public.words enable row level security;
alter table public.search_history enable row level security;
alter table public.source_types enable row level security;

-- 既存のpublicポリシーを削除（名前が存在する場合）
drop policy if exists "public select" on public.words;
drop policy if exists "public insert" on public.words;
drop policy if exists "public update" on public.words;
drop policy if exists "words_select_public" on public.words;
drop policy if exists "words_insert_public" on public.words;
drop policy if exists "words_update_public" on public.words;

create policy "words_select_own" on public.words for select using (auth.uid() = user_id);
create policy "words_insert_own" on public.words for insert with check (auth.uid() = user_id);
create policy "words_update_own" on public.words for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "words_delete_own" on public.words for delete using (auth.uid() = user_id);

create policy "history_select_own" on public.search_history for select using (auth.uid() = user_id);
create policy "history_insert_own" on public.search_history for insert with check (auth.uid() = user_id);
create policy "history_update_own" on public.search_history for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "history_delete_own" on public.search_history for delete using (auth.uid() = user_id);

create policy "sources_select_own" on public.source_types for select using (auth.uid() = user_id);
create policy "sources_insert_own" on public.source_types for insert with check (auth.uid() = user_id);
create policy "sources_update_own" on public.source_types for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sources_delete_own" on public.source_types for delete using (auth.uid() = user_id);

-- 初期の出典タイプは各ユーザーの初回アクセス時にAPIが作成します。

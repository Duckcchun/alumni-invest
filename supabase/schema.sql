-- 알럼나이 모의 엔젤 투자 · Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여 넣고 Run 하세요.

-- 1) 투표 테이블 (이메일당 1표)
create table if not exists public.votes (
  id          bigint generated always as identity primary key,
  email       text not null unique,
  generation  text,                -- 기수 (예: "10기")
  team_id     text not null check (team_id in (
    'aftor','travelguard','picknu','mcmorbit','nextime','refit','momote',
    'mxis','sott','aura-aura','hale','closer','aura-eagle','tagonai','mcmportal'
  )),
  created_at  timestamptz not null default now()
);

-- 1-1) 선배의 한마디 (투자할 때 선택 입력, 이메일당 1개)
alter table public.votes add column if not exists comment text
  check (comment is null or char_length(comment) <= 200);
alter table public.votes add column if not exists comment_type text
  check (comment_type is null or comment_type in ('cheer','impressive','suggest'));
alter table public.votes add column if not exists is_public boolean not null default true; -- false = 팀에게만 전달
alter table public.votes add column if not exists hidden boolean not null default false;   -- 운영진이 숨김 처리

-- 2) 이벤트 설정 (마감 시각). closes_at 이 null 이면 마감 없음.
create table if not exists public.event_config (
  id         int primary key default 1 check (id = 1),
  closes_at  timestamptz
);
insert into public.event_config (id, closes_at)
values (1, '2026-10-25 23:59:59+09')
on conflict (id) do update set closes_at = excluded.closes_at;

-- 3) RLS: 익명 사용자는 테이블에 직접 접근 불가 (이메일 보호)
alter table public.votes enable row level security;
alter table public.event_config enable row level security;
-- 정책을 만들지 않으므로 anon 은 select/insert 모두 막힘. 아래 함수로만 접근.

-- 4) 투표 함수 (한마디 인자 추가로 시그니처가 바뀌어 예전 버전은 지움)
drop function if exists public.cast_vote(text, text, text);
create or replace function public.cast_vote(
  p_email text, p_generation text, p_team_id text,
  p_comment text default null, p_comment_type text default null, p_is_public boolean default true
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   text := lower(trim(p_email));
  v_closes  timestamptz;
  v_comment text := left(nullif(trim(p_comment), ''), 200);
  v_type    text := case when p_comment_type in ('cheer','impressive','suggest') then p_comment_type end;
begin
  if v_comment is null then v_type := null; end if;
  select closes_at into v_closes from event_config where id = 1;
  if v_closes is not null and now() > v_closes then
    return 'closed';
  end if;

  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    return 'invalid_email';
  end if;

  begin
    insert into votes (email, generation, team_id, comment, comment_type, is_public)
    values (v_email, left(nullif(trim(p_generation), ''), 20), p_team_id,
            v_comment, v_type, coalesce(p_is_public, true));
  exception
    when unique_violation then return 'already_voted';
    when check_violation  then return 'invalid_team';
  end;

  return 'ok';
end;
$$;

-- 5) 결과 함수 (팀별 득표수만 공개, 이메일은 노출 안 됨)
create or replace function public.get_results()
returns table (team_id text, votes bigint)
language sql
security definer
stable
set search_path = public
as $$
  select team_id, count(*)::bigint from votes group by team_id;
$$;

-- 6) 마감 시각 조회 함수
create or replace function public.get_event_config()
returns table (closes_at timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select closes_at from event_config where id = 1;
$$;

-- 7) 공개 한마디 조회 함수 (이메일은 절대 돌려주지 않음)
create or replace function public.get_comments()
returns table (id bigint, team_id text, generation text, comment_type text, comment text, created_at timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select id, team_id, generation, comment_type, comment, created_at
  from votes
  where comment is not null and is_public and not hidden
  order by created_at desc
  limit 500;
$$;

revoke all on function public.cast_vote(text, text, text, text, text, boolean) from public;
revoke all on function public.get_results() from public;
revoke all on function public.get_event_config() from public;
revoke all on function public.get_comments() from public;
grant execute on function public.cast_vote(text, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.get_results() to anon, authenticated;
grant execute on function public.get_event_config() to anon, authenticated;
grant execute on function public.get_comments() to anon, authenticated;

-- ───────── 운영용 쿼리 (필요할 때 SQL Editor 에서 실행) ─────────
-- 마감 설정:   update event_config set closes_at = '2026-10-25 23:59:59+09' where id = 1;
-- 마감 해제:   update event_config set closes_at = null where id = 1;
-- 순위 확인:   select team_id, count(*) from votes group by team_id order by 2 desc;
-- 기수별 참여: select generation, count(*) from votes group by 1 order by 1;
-- 최근 한마디:  select id, team_id, generation, comment_type, comment, is_public, hidden from votes where comment is not null order by created_at desc;
-- 한마디 숨김:  update votes set hidden = true where id = 123;
-- 팀별 전달용(비공개 포함): select team_id, generation, comment_type, comment, is_public from votes where comment is not null and not hidden order by team_id, created_at;
-- 이벤트 종료 후 이메일 파기: update votes set email = 'deleted-' || id;

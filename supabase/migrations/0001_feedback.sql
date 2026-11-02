-- 0001_feedback.sql
-- Phiếu phản hồi 5 câu của buổi thử nghiệm. Nguồn sự thật cho lược đồ.
-- Giới hạn ở đây phải khớp src/shared/feedback-schema.ts (tools/verify-schema-sync.mjs kiểm tra).
-- Cách áp: Supabase > SQL Editor > dán toàn bộ tệp > Run.
-- Không chứa khóa hay dữ liệu nhạy cảm.

create table if not exists public.feedback_responses (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  tester_code       text        not null check (tester_code ~ '^T[0-9]{2}$'),
  q1_self_complete  text        not null check (q1_self_complete in ('co', 'mot_phan', 'khong')),
  q2_clarity        smallint    not null check (q2_clarity between 1 and 5),
  q3_excess_missing text        not null check (char_length(q3_excess_missing) between 1 and 500),
  q4_would_use      text        not null check (char_length(q4_would_use) between 1 and 500),
  q5_top_fix        text        not null check (char_length(q5_top_fix) between 1 and 500),
  app_version       text        not null check (char_length(app_version) between 1 and 40),
  rulepack_id       text        not null check (char_length(rulepack_id) between 1 and 40)
);

comment on table public.feedback_responses is
  'Phản hồi buổi thử nghiệm Trạm soát tài liệu. Chỉ ghi, không đọc công khai. Không chứa nội dung tài liệu.';

-- Bật RLS và áp dụng cho cả chủ bảng.
alter table public.feedback_responses enable row level security;
alter table public.feedback_responses force row level security;

-- Thu hồi mọi quyền, rồi chỉ cấp quyền INSERT theo từng cột cho anon.
-- (id và created_at do cơ sở dữ liệu tự đặt, máy khách không được tự ghi.)
revoke all on table public.feedback_responses from public, anon, authenticated;
grant insert (
  tester_code, q1_self_complete, q2_clarity,
  q3_excess_missing, q4_would_use, q5_top_fix,
  app_version, rulepack_id
) on table public.feedback_responses to anon;

-- Chính sách: anon được chèn. KHÔNG tạo chính sách SELECT, UPDATE, DELETE.
drop policy if exists feedback_insert_anon on public.feedback_responses;
create policy feedback_insert_anon
  on public.feedback_responses
  for insert
  to anon
  with check (true);

-- Giới hạn tổng số hàng để hạn chế rác (khóa anon là công khai).
create or replace function public.feedback_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Tuần tự hóa các lần chèn đồng thời để phép đếm bên dưới không bị vượt (khóa nhả khi giao dịch kết thúc).
  perform pg_advisory_xact_lock(hashtext('feedback_cap'));
  if (select count(*) from public.feedback_responses) >= 300 then
    raise exception 'feedback_cap_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.feedback_cap() from public, anon, authenticated;

drop trigger if exists feedback_cap_trg on public.feedback_responses;
create trigger feedback_cap_trg
  before insert on public.feedback_responses
  for each row execute function public.feedback_cap();

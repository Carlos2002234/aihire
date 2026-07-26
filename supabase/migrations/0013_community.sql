-- Módulo 13: Community — Q&A, Salary Transparency, Interview Experiences.
-- Base de conocimiento profesional, no red social: sin feed infinito, sin
-- seguidores, sin timeline personal. Todo el contenido puede publicarse
-- como anónimo (is_anonymous), pero el autor real siempre se guarda para
-- moderación/ownership — nunca se expone al público vía RLS/selects.

create table public.community_questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  is_anonymous boolean not null default false,
  title text not null,
  body text not null,
  tags text[] not null default '{}',
  views int not null default 0,
  created_at timestamptz not null default now()
);

create table public.community_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.community_questions (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  is_anonymous boolean not null default false,
  body text not null,
  upvotes int not null default 0,
  is_helpful boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.community_answer_votes (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.community_answers (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (answer_id, voter_id)
);

create table public.community_salary_entries (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid not null references public.profiles (id) on delete cascade,
  country text not null,
  city text,
  company text,
  job_title text not null,
  years_experience numeric not null,
  salary_amount numeric not null,
  salary_currency text not null default 'USD',
  bonus_amount numeric,
  work_mode work_mode,
  industry text,
  certifications text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.community_interview_experiences (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid not null references public.profiles (id) on delete cascade,
  company text not null,
  job_title text not null,
  rounds int not null,
  difficulty int not null check (difficulty between 1 and 10),
  duration text,
  interview_type text not null check (interview_type in ('technical', 'behavioral', 'both')),
  questions_remembered text,
  overall_experience text not null,
  tips text,
  created_at timestamptz not null default now()
);

create index on public.community_questions (created_at desc);
create index on public.community_answers (question_id, created_at);
create index on public.community_answer_votes (answer_id);
create index on public.community_salary_entries (country, job_title);
create index on public.community_interview_experiences (lower(company));

-- upvotes: se mantiene desnormalizado en community_answers, recalculado
-- por trigger a partir de community_answer_votes (mismo patrón que
-- candidate_profiles.completion_pct).
create function public.recalculate_answer_upvotes(p_answer_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.community_answers
  set upvotes = (select count(*) from public.community_answer_votes where answer_id = p_answer_id)
  where id = p_answer_id;
end;
$$;

create function public.trigger_recalculate_answer_upvotes()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_answer_upvotes(old.answer_id);
    return old;
  end if;
  perform public.recalculate_answer_upvotes(new.answer_id);
  return new;
end;
$$;

create trigger community_answer_votes_recalculate
  after insert or delete on public.community_answer_votes
  for each row execute function public.trigger_recalculate_answer_upvotes();

-- mark_answer_helpful: solo el autor de la pregunta puede marcar una
-- respuesta como útil (y desmarcar otras respuestas de la misma pregunta,
-- una sola respuesta "helpful" por pregunta a la vez).
create function public.mark_answer_helpful(p_answer_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_question_id uuid;
  v_question_author uuid;
begin
  select question_id into v_question_id from public.community_answers where id = p_answer_id;
  if v_question_id is null then
    raise exception 'Answer not found';
  end if;

  select author_id into v_question_author from public.community_questions where id = v_question_id;
  if v_question_author is distinct from auth.uid() then
    raise exception 'Only the question author can mark an answer as helpful';
  end if;

  update public.community_answers set is_helpful = false where question_id = v_question_id;
  update public.community_answers set is_helpful = true where id = p_answer_id;
end;
$$;

create function public.increment_question_views(p_question_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.community_questions set views = views + 1 where id = p_question_id;
end;
$$;

alter table public.community_questions enable row level security;
alter table public.community_answers enable row level security;
alter table public.community_answer_votes enable row level security;
alter table public.community_salary_entries enable row level security;
alter table public.community_interview_experiences enable row level security;

-- Lectura abierta a cualquier usuario autenticado (candidato o recruiter):
-- es una base de conocimiento profesional compartida, no contenido privado
-- de un candidato. is_anonymous se resuelve en la app (nunca se expone
-- author_id/submitter_id real al público vía este grant).
grant select, insert on public.community_questions to authenticated;
grant select, insert on public.community_answers to authenticated;
grant select, insert, delete on public.community_answer_votes to authenticated;
grant select, insert on public.community_salary_entries to authenticated;
grant select, insert on public.community_interview_experiences to authenticated;
grant execute on function public.mark_answer_helpful to authenticated;
grant execute on function public.increment_question_views to authenticated;

create policy "community_questions_select_all"
  on public.community_questions for select
  to authenticated
  using (true);

create policy "community_questions_insert_own"
  on public.community_questions for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "community_answers_select_all"
  on public.community_answers for select
  to authenticated
  using (true);

create policy "community_answers_insert_own"
  on public.community_answers for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "community_answer_votes_select_all"
  on public.community_answer_votes for select
  to authenticated
  using (true);

create policy "community_answer_votes_insert_own"
  on public.community_answer_votes for insert
  to authenticated
  with check (voter_id = auth.uid());

create policy "community_answer_votes_delete_own"
  on public.community_answer_votes for delete
  to authenticated
  using (voter_id = auth.uid());

create policy "community_salary_entries_select_all"
  on public.community_salary_entries for select
  to authenticated
  using (true);

create policy "community_salary_entries_insert_own"
  on public.community_salary_entries for insert
  to authenticated
  with check (submitter_id = auth.uid());

create policy "community_interview_experiences_select_all"
  on public.community_interview_experiences for select
  to authenticated
  using (true);

create policy "community_interview_experiences_insert_own"
  on public.community_interview_experiences for insert
  to authenticated
  with check (submitter_id = auth.uid());

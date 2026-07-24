-- Módulo 12 (v2, parcial): AI Career Coach

create table public.coach_conversations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.coach_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index on public.coach_conversations (candidate_id, created_at desc);
create index on public.coach_messages (conversation_id, created_at);

alter table public.coach_conversations enable row level security;
alter table public.coach_messages enable row level security;

-- Solo lectura + insert para el dueño. No hay edit/delete: el historial de
-- coach es un log de la conversación, no se corrige después.
grant select, insert on public.coach_conversations to authenticated;
grant select, insert on public.coach_messages to authenticated;

create policy "coach_conversations_select_own"
  on public.coach_conversations for select
  to authenticated
  using (candidate_id = auth.uid());

create policy "coach_conversations_insert_own"
  on public.coach_conversations for insert
  to authenticated
  with check (candidate_id = auth.uid());

create policy "coach_messages_select_own"
  on public.coach_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.coach_conversations c
      where c.id = coach_messages.conversation_id and c.candidate_id = auth.uid()
    )
  );

create policy "coach_messages_insert_own"
  on public.coach_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.coach_conversations c
      where c.id = coach_messages.conversation_id and c.candidate_id = auth.uid()
    )
  );

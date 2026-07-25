-- Módulo 12 (cont.): CV Builder — ajustar CV a una posición en texto libre
-- (no necesariamente un job de HireFlow) + preview editable antes de exportar.

alter table public.resumes
  add column target_position_title text,
  add column target_position_description text;

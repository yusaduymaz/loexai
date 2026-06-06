-- LoexAI · Live discovery UX
--
-- Adds scan_jobs, scan_job_items, and pipeline_stage_runs to the supabase_realtime
-- publication so the browser client receives push updates for the discovery page
-- and per-job pipeline timeline. RLS still applies — subscribers only receive
-- rows their policies allow (auth.uid()-scoped via existing policies).

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'scan_jobs'
  ) then
    execute 'alter publication supabase_realtime add table public.scan_jobs';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'scan_job_items'
  ) then
    execute 'alter publication supabase_realtime add table public.scan_job_items';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pipeline_stage_runs'
  ) then
    execute 'alter publication supabase_realtime add table public.pipeline_stage_runs';
  end if;
end;
$$;

-- WHY: REPLICA IDENTITY FULL ensures UPDATE events include OLD row values, which
-- the browser needs to update existing rows (status transitions) without an extra
-- re-fetch. PK is enough for INSERT/DELETE; FULL is required for UPDATE diffs.
alter table public.scan_jobs replica identity full;
alter table public.scan_job_items replica identity full;
alter table public.pipeline_stage_runs replica identity full;

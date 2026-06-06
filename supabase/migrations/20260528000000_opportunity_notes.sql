-- ───────────────────────────────────────────────────────────────────────────
-- LoexAI · Phase 3 followup · Free-text note per opportunity
-- ───────────────────────────────────────────────────────────────────────────
--
-- Scope:
--   * Adds a `notes` text column to public.opportunities so users can jot a
--     freeform note against a scored lead from the Opportunities dashboard
--     ("Not al" action). Surfaced both there and in the business report.
--
-- RLS:
--   No new policy needed. The existing opportunities_update_own / _select_own
--   policies already scope all column reads/writes to the owning user.
-- ───────────────────────────────────────────────────────────────────────────

alter table public.opportunities
  add column if not exists notes text;

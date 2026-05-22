---
title: Karar — Esnek Veriler jsonb'de
tags: [karar, database, jsonb, supabase]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# Karar — Esnek Veriler jsonb'de

**Karar:** `gaps`, `raw_data`, `enrichment_data`, çözüm teklifleri `jsonb` alanlarında tutulur.

**Neden:** AI pipeline çıktıları zamanla evrilir. Her yeni alan için migration yazmak yerine jsonb esneklik sağlar. Şema katılığı yaratmaz.

**Nasıl uygulanır:** Sabit/sık sorgulanan alanlar (score, status, priority) typed kolon. Değişken/zengin veri jsonb.

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[entities/supabase-veri-modeli]]

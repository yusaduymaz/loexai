---
title: Karar — Migration Tek Source of Truth
tags: [karar, database, migration, supabase]
source: sources/docs/2026-05-22-claude-md.md
date: 2026-05-22
status: active
---

# Karar — Migration Tek Source of Truth

**Karar:** Supabase şemasının tek doğru kaynağı `supabase/migrations/` altındaki migration dosyalarıdır. CLAUDE.md'deki veri modeli kavramsal/referans amaçlıdır.

**Neden:** Wiki ve dokümanlar güncelliğini yitirir. Migration dosyaları her zaman çalışan gerçek şemayı yansıtır.

**Nasıl uygulanır:** Yeni tablo/alan gerektiğinde önce migration yaz, sonra CLAUDE.md'deki kavramsal modeli güncelle.

## Kaynaklar

- [[sources/docs/2026-05-22-claude-md]]

## İlgili

- [[entities/supabase-veri-modeli]]
